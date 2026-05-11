// Board generation, mesh placement, raycasting
import * as THREE from 'three';
import { getScene, getCamera, getContainer, spawnParticles, triggerShake } from './game.js';

// State
let boardTiles = new Map();   // `${col},${row}` → tile
let coverObjects = new Map(); // `${col},${row}` → { mesh, detail, edgeKey }
let baseMeshes = new Map();   // `${col},${row}` → base mesh
let itemMeshes = new Map();   // `${itemId}_${instanceId}` → mesh
let permanentEdges = [];      // always visible edge lines

let activeBounds = { minCol: 1, maxCol: 5, minRow: 1, maxRow: 5 };

// ── Tile coordinate helpers ──────────────────────────────────────────────────
const tx = col => col - 1;
const ty = row => -(row - 1);

// ── Emoji map ────────────────────────────────────────────────────────────────
const ITEM_EMOJI = {
  1001: '🏺', 1002: '🗝️', 1003: '⚔️',
  1004: '⛑️', 1005: '👑', 1006: '⛏️',
};
export function getItemEmoji(id) { return ITEM_EMOJI[id] || '❓'; }

// ── Board generation ─────────────────────────────────────────────────────────
export function generateBoard(stage, stageCfg, itemCfg) {
  const cfg = stageCfg.find(s => s.stage_id === stage);
  if (!cfg) { console.error('No stage config for', stage); return []; }

  const rawIds = String(cfg.item_ids);
  const itemIds = rawIds.split(',').map(s => s.trim()).filter(Boolean);

  const tiles = [];
  let minC = 10, maxC = 1, minR = 10, maxR = 1;

  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {
      const ct = cfg[`col_${col}`];
      const rt = cfg[`row_${row}`];
      let ft;
      if (ct === 'NULL' || rt === 'NULL') ft = 'NULL';
      else if (ct === 'BLOCK' || rt === 'BLOCK') ft = 'BLOCK';
      else ft = 'BOX';

      tiles.push({ col, row, final_type: ft, content: 'EMPTY', item_id: null, instance_id: null, tile_index: null, state: 'hidden' });

      if (ft !== 'NULL') {
        minC = Math.min(minC, col); maxC = Math.max(maxC, col);
        minR = Math.min(minR, row); maxR = Math.max(maxR, row);
      }
    }
  }

  activeBounds = { minCol: minC, maxCol: maxC, minRow: minR, maxRow: maxR };

  // Place items
  for (let iIdx = 0; iIdx < itemIds.length; iIdx++) {
    const itemId = parseInt(itemIds[iIdx]);
    const parts  = itemCfg.filter(r => r.item_id === itemId);
    if (!parts.length) continue;
    const instanceId = iIdx;

    let placed = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      const boxTiles = tiles.filter(t => t.final_type === 'BOX' && t.content === 'EMPTY');
      if (!boxTiles.length) break;
      const anchor = boxTiles[Math.floor(Math.random() * boxTiles.length)];
      const toPlace = [];
      let ok = true;

      for (const part of parts) {
        const c = anchor.col + part.offset_col;
        const r = anchor.row + part.offset_row;
        const t = tiles.find(t => t.col === c && t.row === r);
        if (!t || t.final_type !== 'BOX' || t.content !== 'EMPTY') { ok = false; break; }
        toPlace.push({ tile: t, part });
      }

      if (ok) {
        for (const { tile, part } of toPlace) {
          tile.content    = 'ITEM';
          tile.item_id    = itemId;
          tile.instance_id = instanceId;
          tile.tile_index = part.tile_index;
        }
        placed = true;
        break;
      }
    }
    if (!placed) console.warn('Could not place item', itemId);
  }

  // Place gems
  const emptyBox = tiles.filter(t => t.final_type === 'BOX' && t.content === 'EMPTY');
  shuffleArray(emptyBox);
  const gc = Math.min(cfg.gem_count, emptyBox.length);
  for (let i = 0; i < gc; i++) emptyBox[i].content = 'GEM';

  // Empty rewards
  const remaining = tiles.filter(t => t.final_type === 'BOX' && t.content === 'EMPTY');
  shuffleArray(remaining);
  const rc = Math.floor(remaining.length * (cfg.empty_reward_ratio || 0.15));
  for (let i = 0; i < rc; i++) remaining[i].content = 'EMPTY_REWARD';

  return tiles;
}

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// ── Board rendering ──────────────────────────────────────────────────────────
export function renderBoard(tiles) {
  clearBoard();

  boardTiles.clear();
  tiles.forEach(t => boardTiles.set(`${t.col},${t.row}`, t));

  // Recalculate active bounds from tiles
  let minC = 10, maxC = 1, minR = 10, maxR = 1;
  tiles.forEach(t => {
    if (t.final_type !== 'NULL') {
      minC = Math.min(minC, t.col); maxC = Math.max(maxC, t.col);
      minR = Math.min(minR, t.row); maxR = Math.max(maxR, t.row);
    }
  });
  activeBounds = { minCol: minC, maxCol: maxC, minRow: minR, maxRow: maxR };

  const scene = getScene();

  tiles.forEach(tile => {
    if (tile.final_type === 'NULL') return;
    const x = tx(tile.col), y = ty(tile.row);

    if (tile.final_type === 'BLOCK') {
      addBlockTile(scene, x, y, tile.col, tile.row);
    } else {
      addBaseTile(scene, x, y, tile);
      if (tile.state === 'hidden') addCoverTile(scene, x, y, tile.col, tile.row);
    }

    // Permanent grid edge
    addGridEdge(scene, x, y);
  });

  // Item meshes (hidden by default, revealed when all parts dug)
  buildItemMeshes(tiles, scene);
}

function addBlockTile(scene, x, y, col, row) {
  const mesh = makePlane(x, y, 0.02, 0x4a4a4a);
  scene.add(mesh);
  baseMeshes.set(`block_${col},${row}`, mesh);
  // inner detail
  const d = makePlane(x, y, 0.025, 0x333333, 0.8);
  scene.add(d);
  baseMeshes.set(`blockd_${col},${row}`, d);
}

function addBaseTile(scene, x, y, tile) {
  let color;
  if (tile.state === 'revealed') {
    color = tile.content === 'GEM' ? 0xc8f0ff : tile.content === 'EMPTY_REWARD' ? 0xffeedd : 0xd4b896;
  } else {
    color = 0xd4b896; // covered anyway
  }
  const mesh = makePlane(x, y, 0.0, color);
  scene.add(mesh);
  baseMeshes.set(`base_${tile.col},${tile.row}`, mesh);

  // Gem emoji on revealed gem tile
  if (tile.state === 'revealed' && tile.content === 'GEM') {
    const em = makeEmojiPlane('💎', 0.72, x, y, 0.005);
    scene.add(em);
    baseMeshes.set(`gem_${tile.col},${tile.row}`, em);
  }
}

function addCoverTile(scene, x, y, col, row) {
  // Cover at z=0.01, size EXACTLY 1.0 (no gaps!)
  const cover = makePlane(x, y, 0.01, 0x7b5b3a);
  scene.add(cover);
  // dark detail
  const detail = makePlane(x, y, 0.012, 0x5a3c20, 0.82);
  scene.add(detail);
  coverObjects.set(`${col},${row}`, { cover, detail });
}

function addGridEdge(scene, x, y) {
  // Rectangle outline — NO diagonal, purely outer 4 edges
  const pts = new Float32Array([
    x - 0.5, y - 0.5, 0.035,
    x + 0.5, y - 0.5, 0.035,
    x + 0.5, y + 0.5, 0.035,
    x - 0.5, y + 0.5, 0.035,
    x - 0.5, y - 0.5, 0.035,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x222222 }));
  scene.add(line);
  permanentEdges.push(line);
}

function buildItemMeshes(tiles, scene) {
  const groups = new Map();
  tiles.forEach(t => {
    if (t.content !== 'ITEM') return;
    const key = `${t.item_id}_${t.instance_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  });

  groups.forEach((parts, key) => {
    const cols = parts.map(p => p.col);
    const rows = parts.map(p => p.row);
    const minCol = Math.min(...cols), maxCol = Math.max(...cols);
    const minRow = Math.min(...rows), maxRow = Math.max(...rows);

    const w = maxCol - minCol + 1;
    const h = maxRow - minRow + 1;
    const cx = (tx(minCol) + tx(maxCol)) / 2;
    const cy = (ty(minRow) + ty(maxRow)) / 2;

    const emoji = getItemEmoji(parts[0].item_id);
    const res = 128;
    const cvs = document.createElement('canvas');
    cvs.width  = res * w;
    cvs.height = res * h;
    const ctx = cvs.getContext('2d');
    const fs = Math.min(cvs.width, cvs.height) * 0.68;
    ctx.font = `${fs}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cvs.width / 2, cvs.height / 2);

    const tex = new THREE.CanvasTexture(cvs);
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, 0.005);

    // visible only when all parts revealed
    mesh.visible = parts.every(p => p.state === 'revealed');
    scene.add(mesh);
    itemMeshes.set(key, mesh);
  });
}

// ── Tile reveal ───────────────────────────────────────────────────────────────
export function revealTile(col, row) {
  const tile = boardTiles.get(`${col},${row}`);
  if (!tile || tile.state === 'revealed' || tile.final_type !== 'BOX') return null;

  tile.state = 'revealed';
  const scene = getScene();
  const x = tx(col), y = ty(row);

  // Remove cover
  const co = coverObjects.get(`${col},${row}`);
  if (co) {
    scene.remove(co.cover);  co.cover.geometry.dispose();  co.cover.material.dispose();
    scene.remove(co.detail); co.detail.geometry.dispose(); co.detail.material.dispose();
    coverObjects.delete(`${col},${row}`);
  }

  // Update base color
  const base = baseMeshes.get(`base_${col},${row}`);
  if (base) {
    if (tile.content === 'GEM') {
      base.material.color.setHex(0xc8f0ff);
      const em = makeEmojiPlane('💎', 0.72, x, y, 0.005);
      scene.add(em);
      baseMeshes.set(`gem_${col},${row}`, em);
    } else if (tile.content === 'EMPTY_REWARD') {
      base.material.color.setHex(0xffeedd);
    } else {
      base.material.color.setHex(0xd4b896);
    }
  }

  spawnParticles(x, y, 9);
  triggerShake(0.1, 6);

  // Check item completion
  if (tile.content === 'ITEM') {
    const key = `${tile.item_id}_${tile.instance_id}`;
    const allParts = [];
    boardTiles.forEach(t => {
      if (t.item_id === tile.item_id && t.instance_id === tile.instance_id) allParts.push(t);
    });
    if (allParts.every(p => p.state === 'revealed')) {
      const im = itemMeshes.get(key);
      if (im) im.visible = true;
      return { type: 'item_complete', item_id: tile.item_id, instance_id: tile.instance_id };
    }
    return { type: 'ITEM' };
  }

  return { type: tile.content }; // 'GEM', 'EMPTY', 'EMPTY_REWARD'
}

export function getTile(col, row) { return boardTiles.get(`${col},${row}`) || null; }
export function getActiveBounds() { return activeBounds; }

// ── Raycasting ────────────────────────────────────────────────────────────────
export function getRaycasterTile(event) {
  const camera    = getCamera();
  const container = getContainer();
  const rect      = container.getBoundingClientRect();
  const src = event.touches ? event.touches[0] : event;

  const ndx = ((src.clientX - rect.left) / rect.width)  * 2 - 1;
  const ndy = -((src.clientY - rect.top)  / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x: ndx, y: ndy }, camera);

  // Intersect XY plane (z=0)
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit   = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) return null;

  const col = Math.round(hit.x) + 1;
  const row = Math.round(-hit.y) + 1;
  if (col < 1 || col > 10 || row < 1 || row > 10) return null;

  return boardTiles.get(`${col},${row}`) || null;
}

// ── Clear / helpers ───────────────────────────────────────────────────────────
export function clearBoard() {
  const scene = getScene();
  coverObjects.forEach(o => {
    scene.remove(o.cover);  scene.remove(o.detail);
  });
  coverObjects.clear();
  baseMeshes.forEach(m => { scene.remove(m); });
  baseMeshes.clear();
  itemMeshes.forEach(m => { scene.remove(m); });
  itemMeshes.clear();
  permanentEdges.forEach(m => scene.remove(m));
  permanentEdges.length = 0;
  boardTiles.clear();
}

function makePlane(x, y, z, color, scale = 1.0) {
  const geo = new THREE.PlaneGeometry(scale, scale);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function makeEmojiPlane(emoji, size, x, y, z) {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 128;
  const ctx = cvs.getContext('2d');
  ctx.font = `${Math.round(128 * 0.68)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 64);
  const tex = new THREE.CanvasTexture(cvs);
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  return mesh;
}
