/* src/board.js */
export const Board = {
  generateBoard(stageConfig, itemConfig, eventConfig) {
    const board = [];
    let boxCount = 0;
    let minCol = 10, maxCol = -1, minRow = 10, maxRow = -1;

    for(let row=1; row<=10; row++) {
      for(let col=1; col<=10; col++) {
        const colType = stageConfig[`col_${col}`];
        const rowType = stageConfig[`row_${row}`];
        let finalType = 'BOX';
        if (colType === 'NULL' || rowType === 'NULL') finalType = 'NULL';
        else if (colType === 'BLOCK' || rowType === 'BLOCK') finalType = 'BLOCK';
        
        if (finalType !== 'NULL') {
          if (col-1 < minCol) minCol = col-1;
          if (col-1 > maxCol) maxCol = col-1;
          if (row-1 < minRow) minRow = row-1;
          if (row-1 > maxRow) maxRow = row-1;
        }
        if (finalType === 'BOX') boxCount++;
        
        board.push({
          index: (row-1)*10+(col-1),
          row: row-1,
          col: col-1,
          final_type: finalType,
          content: 'EMPTY',
          item_instance_id: 0,
          state: 'hidden'
        });
      }
    }
    
    const boardStats = { minCol, maxCol, minRow, maxRow, boxCount };
    const active_items = [];
    let instanceId = 1;
    
    if (stageConfig.item_ids) {
      const stageItemIds = String(stageConfig.item_ids).split(',').map(id => id.trim());
      stageItemIds.forEach(itemId => {
        const itemTiles = itemConfig[itemId];
        if (!itemTiles) return;
        let placed = false, attempts = 0;
        while (!placed && attempts < 100) {
          const originRow = Math.floor(Math.random() * 10);
          const originCol = Math.floor(Math.random() * 10);
          const cells = itemTiles.map(t => {
            const r = originRow + t.offset_row;
            const c = originCol + t.offset_col;
            if (r >= 0 && r < 10 && c >= 0 && c < 10) return r * 10 + c;
            return -1;
          });
          if (cells.every(idx => idx !== -1 && board[idx] && board[idx].final_type === 'BOX' && board[idx].content === 'EMPTY')) {
            cells.forEach(idx => {
              board[idx].content = 'ITEM';
              board[idx].item_instance_id = instanceId;
            });
            active_items.push({
              instanceId,
              itemId: parseInt(itemId),
              totalTiles: cells.length,
              revealedTiles: 0,
              filled: false
            });
            instanceId++;
            placed = true;
          }
          attempts++;
        }
      });
    }

    let boxCells = board.filter(c => c.final_type === 'BOX' && c.content === 'EMPTY');
    const gemCount = parseInt(stageConfig.gem_count || 0);
    for(let i=0; i<Math.min(gemCount, boxCells.length); i++) {
      const rndIdx = Math.floor(Math.random() * boxCells.length);
      boxCells[rndIdx].content = 'GEM';
      boxCells.splice(rndIdx, 1);
    }
    
    boxCells = board.filter(c => c.final_type === 'BOX' && c.content === 'EMPTY');
    const rewardRatio = eventConfig.empty_reward_default_ratio || 0.15;
    const rewardCount = Math.floor(boxCells.length * rewardRatio);
    for(let i=0; i<rewardCount; i++) {
      const rndIdx = Math.floor(Math.random() * boxCells.length);
      boxCells[rndIdx].content = 'EMPTY_REWARD';
      boxCells.splice(rndIdx, 1);
    }

    return { board, boardStats, active_items };
  }
};
