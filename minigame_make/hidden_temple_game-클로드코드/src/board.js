import * as THREE from 'three';
import { getScene, setCameraSize } from './game.js';
import { saveBoardState } from './data.js';

let tileSize = 1.0;
let boardCols = 0, boardRows = 0;
let tileObjects = {};   // index → { sand, hole, edges }
let itemPlanes = {};    // item_instance_id → THREE.Mesh

export function getBoardDimensions() { return { cols: boardCols, rows: boardRows }; }
export function getTileObjects() { return tileObjects; }

export function renderBoard(tiles, stageId, itemConfig) {
  const scene = getScene();

  // 기존 보드 제거 (엣지 포함 전부)
  Object.values(tileObjects).forEach(o => {
    scene.remove(o.sand);
    scene.remove(o.hole);
    scene.remove(o.edges);
    scene.remove(o.holeEdges);
  });
  Object.values(itemPlanes).forEach(p => scene.remove(p));
  tileObjects = {};
  itemPlanes = {};

  const boxTiles = tiles.filter(t => t.final_type === 'BOX');
  if (!boxTiles.length) return;

  const minCol = Math.min(...boxTiles.map(t => t.col));
  const maxCol = Math.max(...boxTiles.map(t => t.col));
  const minRow = Math.min(...boxTiles.map(t => t.row));
  const maxRow = Math.max(...boxTiles.map(t => t.row));
  boardCols = maxCol - minCol + 1;
  boardRows = maxRow - minRow + 1;

  const offsetX = -(minCol + maxCol) / 2 * tileSize;
  const offsetZ = -(minRow + maxRow) / 2 * tileSize;

  setCameraSize(boardCols, boardRows);

  // 아이템 플레인 먼저 생성 (y = -0.005)
  const instanceGroups = {};
  tiles.filter(t => t.content === 'ITEM').forEach(t => {
    const id = t.item_instance_id;
    if (!instanceGroups[id]) instanceGroups[id] = [];
    instanceGroups[id].push(t);
  });

  Object.entries(instanceGroups).forEach(([instId, iTiles]) => {
    const itemId = iTiles[0].item_id;
    const emoji = getItemEmoji(itemId);
    const cs = iTiles.map(t => t.col), rs = iTiles.map(t => t.row);
    const minC = Math.min(...cs), maxC = Math.max(...cs);
    const minR = Math.min(...rs), maxR = Math.max(...rs);
    const w = (maxC - minC + 1) * tileSize;
    const h = (maxR - minR + 1) * tileSize;
    const cx = ((minC + maxC) / 2) * tileSize + offsetX;
    const cz = ((minR + maxR) / 2) * tileSize + offsetZ;

    const canvas = document.createElement('canvas');
    const px = 128;
    canvas.width = px * (maxC - minC + 1);
    canvas.height = px * (maxR - minR + 1);
    const ctx = canvas.getContext('2d');
    ctx.font = `${px * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(cx, -0.005, cz);
    plane.visible = false;
    scene.add(plane);
    itemPlanes[instId] = plane;
  });

  // 타일 생성
  tiles.forEach(tile => {
    if (tile.final_type !== 'BOX') return;
    const wx = tile.col * tileSize + offsetX;
    const wz = tile.row * tileSize + offsetZ;

    // 모래 타일 (hidden)
    const sandGeo = new THREE.PlaneGeometry(tileSize, tileSize);
    const sandMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(wx, 0, wz);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(sandGeo), new THREE.LineBasicMaterial({ color: 0x222222 }));
    edges.rotation.x = -Math.PI / 2;
    edges.position.set(wx, 0.005, wz);
    scene.add(sand);
    scene.add(edges);

    // 구멍 바닥 (revealed)
    const holeGeo = new THREE.PlaneGeometry(tileSize, tileSize);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0xfaf8f5, side: THREE.DoubleSide });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(wx, -0.01, wz);
    const holeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(holeGeo), new THREE.LineBasicMaterial({ color: 0xcccccc }));
    holeEdges.rotation.x = -Math.PI / 2;
    holeEdges.position.set(wx, -0.009, wz);
    scene.add(hole);
    scene.add(holeEdges);

    tileObjects[tile.index] = { sand, hole, edges, holeEdges, wx, wz, tile };

    if (tile.state === 'revealed') {
      sand.visible = false;
      edges.visible = false;
      if (tile.content === 'ITEM') revealItemPlane(tile.item_instance_id);
    }
  });
}

function revealItemPlane(instId) {
  if (itemPlanes[instId]) itemPlanes[instId].visible = true;
}

export function revealTile(tileIndex, instanceId) {
  const obj = tileObjects[tileIndex];
  if (!obj) return;
  obj.sand.visible = false;
  obj.edges.visible = false;
  if (instanceId) revealItemPlane(instanceId);
}

export function getItemPlaneWorldPos(instId) {
  const p = itemPlanes[instId];
  if (!p) return null;
  return { x: p.position.x, z: p.position.z };
}

export function removeItemPlane(instId) {
  const scene = getScene();
  if (itemPlanes[instId]) { scene.remove(itemPlanes[instId]); delete itemPlanes[instId]; }
}

export function getTileAtPointer(event, renderer, camera) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(groundPlane, target);
  if (!target) return null;

  const wx = target.x;
  const wz = target.z;

  let closest = null, minDist = Infinity;
  Object.values(tileObjects).forEach(obj => {
    const dx = obj.wx - wx, dz = obj.wz - wz;
    const d = Math.sqrt(dx*dx + dz*dz);
    if (d < tileSize * 0.55 && d < minDist) { minDist = d; closest = obj; }
  });
  return closest;
}

function getItemEmoji(itemId) {
  const map = { 1001: '🏺', 1002: '🗝️', 1003: '⚔️', 1004: '🪖', 1005: '👑', 1006: '🛠️' };
  return map[itemId] || '💎';
}
