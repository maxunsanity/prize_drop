import * as THREE from 'three';
import { Data } from './data.js';

export const EMOJI_MAP = {
  1001: '🏺', 1002: '🔑', 1003: '🗡️', 1004: '🪖', 1005: '👑', 1006: '⛏️'
};

export function generateBoard(stageId, GameState) {
  const stage = Data.getStage(stageId);
  const board = [];

  const itemIdsStr = stage.item_ids || "";
  const itemIds = itemIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
  for (let r = 0; r < 10; r++) {
    const rowObj = [];
    const rowType = stage[`row_${r+1}`];
    for (let c = 0; c < 10; c++) {
      const colType = stage[`col_${c+1}`];
      let finalType = 'NULL';
      if (rowType === 'NULL' || colType === 'NULL') finalType = 'NULL';
      else if (rowType === 'BLOCK' || colType === 'BLOCK') finalType = 'BLOCK';
      else finalType = 'BOX';

      rowObj.push({
        col: c, row: r,
        final_type: finalType,
        content: 'EMPTY',
        item_instance_id: 0,
        state: 'hidden'
      });
    }
    board.push(rowObj);
  }

  GameState.active_items = [];
  let instanceCount = 1;

  for (const itemId of itemIds) {
    const configs = Data.getItemConfig(itemId);
    if (configs.length === 0) continue;
    
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const startR = Math.floor(Math.random() * 10);
      const startC = Math.floor(Math.random() * 10);

      let canPlace = true;
      for (const tile of configs) {
        const r = startR + parseInt(tile.offset_row);
        const c = startC + parseInt(tile.offset_col);
        if (r >= 10 || c >= 10 || r < 0 || c < 0) { canPlace = false; break; }
        const cell = board[r][c];
        if (cell.final_type !== 'BOX' || cell.content !== 'EMPTY') { canPlace = false; break; }
      }

      if (canPlace) {
        const instanceId = instanceCount++;
        const itemTiles = [];
        for (const tile of configs) {
          const r = startR + parseInt(tile.offset_row);
          const c = startC + parseInt(tile.offset_col);
          board[r][c].content = 'ITEM';
          board[r][c].item_instance_id = instanceId;
          itemTiles.push({ r, c, tile_index: parseInt(tile.tile_index) });
        }
        GameState.active_items.push({
          item_id: itemId,
          instance_id: instanceId,
          filled: false,
          tiles: itemTiles
        });
        placed = true;
      }
    }
  }

  let gemsToPlace = parseInt(stage.gem_count) || 0;
  let emptyCells = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (board[r][c].final_type === 'BOX' && board[r][c].content === 'EMPTY') {
        emptyCells.push({r, c});
      }
    }
  }
  
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  for (let i = 0; i < gemsToPlace && i < emptyCells.length; i++) {
    const cell = emptyCells[i];
    board[cell.r][cell.c].content = 'GEM';
  }

  return board;
}

export function buildBoardMeshes(boardData, group, activeItems) {
  while(group.children.length > 0){ 
      group.remove(group.children[0]); 
  }

  // Multi-Tile Item rendering
  activeItems.forEach(item => {
    let minR = 10, maxR = 0, minC = 10, maxC = 0;
    item.tiles.forEach(t => {
      if(t.r < minR) minR = t.r;
      if(t.r > maxR) maxR = t.r;
      if(t.c < minC) minC = t.c;
      if(t.c > maxC) maxC = t.c;
    });
    const w = maxC - minC + 1;
    const h = maxR - minR + 1;
    const cx = minC + (maxC - minC) / 2;
    const cz = minR + (maxR - minR) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = w * 128;
    canvas.height = h * 128;
    const ctx = canvas.getContext('2d');
    ctx.font = `${Math.min(w,h)*80}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(EMOJI_MAP[item.item_id] || '❓', canvas.width/2, canvas.height/2 + 10);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, -0.05, cz);
    group.add(mesh);
  });

  const hiddenGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const hiddenMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
  const blockGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const blockMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const edgesGeo = new THREE.EdgesGeometry(hiddenGeo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });

  for(let r=0; r<10; r++) {
    for(let c=0; c<10; c++) {
      const cell = boardData[r][c];
      if (cell.final_type === 'NULL') continue;

      if (cell.final_type === 'BLOCK') {
        const mesh = new THREE.Mesh(blockGeo, blockMat);
        mesh.rotation.x = -Math.PI/2;
        mesh.position.set(c, 0, r);
        group.add(mesh);
      } else if (cell.final_type === 'BOX') {
        if (cell.state === 'revealed') {
          if (cell.content === 'GEM') {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.font = '40px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('💎', 32, 36);
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({map:tex, transparent:true});
            const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), mat);
            p.rotation.x = -Math.PI/2;
            p.position.set(c, -0.01, r);
            group.add(p);
          }
        } else {
          const mesh = new THREE.Mesh(hiddenGeo, hiddenMat);
          mesh.rotation.x = -Math.PI/2;
          mesh.position.set(c, 0.05, r);
          mesh.userData = { r, c, isTile: true };
          group.add(mesh);
          
          const edges = new THREE.LineSegments(edgesGeo, lineMat);
          mesh.add(edges);
        }
      }
    }
  }
}
