/* src/mechanics.js */
import { Storage, GameData } from './data.js';
import { Renderer } from './game.js';
import { UI, itemEmojis } from './ui.js';
import { Board } from './board.js';

export const Mechanics = {
  playerState: null,
  boardState: null,
  boardStats: null,
  isStageClearing: false,

  init(savedState) {
    if (savedState) {
      this.playerState = savedState.player;
      this.boardState = savedState.board;
      this.boardStats = savedState.stats;
    } else {
      this.playerState = {
        pickaxe_count: GameData.events['pickaxe_debug_start'] || 50,
        stage: 1, gems_collected: 0, tiles_remaining: 0,
        active_items: [], event_completed: false
      };
      this.generateNewStage();
    }
    
    UI.init();
    Renderer.init();
    this.updateAllUI();
    Renderer.renderBoard(this.boardState, this.playerState.active_items, this.boardStats);
  },

  generateNewStage() {
    const stageConfig = GameData.getStage(this.playerState.stage);
    if (!stageConfig) {
      this.playerState.event_completed = true;
      return;
    }
    const { board, boardStats, active_items } = Board.generateBoard(stageConfig, GameData.items, GameData.events);
    this.boardState = board;
    this.boardStats = boardStats;
    this.playerState.active_items = active_items;
    this.playerState.gems_collected = 0;
    this.playerState.tiles_remaining = boardStats.boxCount;
    this.isStageClearing = false;
    this.save();
  },

  dig(tileWrapper, object, clientX, clientY) {
    if (this.playerState.pickaxe_count <= 0) return alert("곡괭이가 부족합니다!");
    if (this.playerState.event_completed || this.playerState.tiles_remaining <= 0) return;

    this.playerState.pickaxe_count--;
    this.playerState.tiles_remaining--;
    tileWrapper.cell.state = 'revealed';
    
    Renderer.breakTile(object);

    setTimeout(() => {
      const content = tileWrapper.cell.content;
      if (content === 'GEM') {
        this.playerState.gems_collected++;
        UI.playPopup(clientX, clientY, '+1 💎', 'text-green');
      } else if (content === 'EMPTY_REWARD') {
        UI.playPopup(clientX, clientY, '🪙', '');
      } else if (content === 'ITEM') {
        const item = this.playerState.active_items.find(it => it.instanceId === tileWrapper.cell.item_instance_id);
        if (item && !item.filled) {
          item.revealedTiles++;
          if (item.revealedTiles >= item.totalTiles) {
            this.handleItemComplete(item);
          }
        }
      }
      this.save();
      this.updateAllUI();
      this.checkStageClear();
    }, 100);
  },

  handleItemComplete(item) {
    const itemCells = this.boardState.filter(c => c.item_instance_id === item.instanceId);
    let sumX = 0, sumZ = 0;
    itemCells.forEach(c => {
      sumX += (c.col - this.boardStats.minCol) * Renderer.gridSpacing;
      sumZ += (c.row - this.boardStats.minRow) * Renderer.gridSpacing;
    });
    const cols = this.boardStats.maxCol - this.boardStats.minCol + 1;
    const rows = this.boardStats.maxRow - this.boardStats.minRow + 1;
    const cx3d = sumX / itemCells.length - (cols * Renderer.gridSpacing)/2 + Renderer.gridSpacing/2;
    const cz3d = sumZ / itemCells.length - (rows * Renderer.gridSpacing)/2 + Renderer.gridSpacing/2;
    
    UI.flyItemToSlot(item, cx3d, cz3d, Renderer.camera, () => {
      item.filled = true;
      const itemConf = GameData.items[item.itemId]?.[0];
      if (itemConf && itemConf.reward_type === 'pickaxe') {
        this.playerState.pickaxe_count += Number(itemConf.reward_amount || 0);
      }
      this.save();
      this.updateAllUI();
      this.checkStageClear();
    });
  },

  checkStageClear() {
    if (this.isStageClearing) return;
    
    const allItemsFilled = this.playerState.active_items.length > 0 && this.playerState.active_items.every(i => i.filled);

    if (allItemsFilled) {
      this.isStageClearing = true;
      this.playerState.tiles_remaining = 0; // Lock board
      
      UI.playStageClearAnimation(this.playerState.active_items, this.playerState.stage, () => {
        this.playerState.stage++;
        if (this.playerState.stage > 5) {
          this.playerState.event_completed = true;
          alert("축하합니다! 숨겨진 사원의 모든 관문을 통과했습니다.");
        } else {
          this.generateNewStage();
          Renderer.renderBoard(this.boardState, this.playerState.active_items, this.boardStats);
        }
        this.save();
        this.updateAllUI();
      });
    }
  },

  updateAllUI() {
    const stageConfig = GameData.getStage(this.playerState.stage);
    const maxGems = stageConfig ? parseInt(stageConfig.gem_count || 0) : 0;
    UI.updateCounters(this.playerState.pickaxe_count, this.playerState.gems_collected, maxGems);
    UI.updateStage(this.playerState.stage);
    UI.updateItemSlots(this.playerState.active_items);
  },

  save() {
    Storage.save('ht_player_state', {
      player: this.playerState,
      board: this.boardState,
      stats: this.boardStats
    });
  },
  reset() { Storage.clear('ht_player_state'); location.reload(); }
};
