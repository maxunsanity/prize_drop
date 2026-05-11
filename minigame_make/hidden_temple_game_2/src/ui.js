/* src/ui.js */
import * as THREE from 'three';

export const itemEmojis = { 1001: '🏺', 1002: '🗝️', 1003: '⚔️', 1004: '🪖', 1005: '👑', 1006: '⛏️' };
const doorEmojis = ['🚪', '🏛️', '⛩️', '🏰', '🗿', '🌌'];

export const UI = {
  pickaxeCounter: null, gemCounter: null, stageProgress: null, itemSlotBar: null,
  doorInner: null,

  init() {
    this.pickaxeCounter = document.getElementById('pickaxe-counter');
    this.gemCounter = document.getElementById('gem-counter');
    this.stageProgress = document.getElementById('stage-progress');
    this.itemSlotBar = document.getElementById('item-slot-bar');
    this.doorInner = document.querySelector('.door-inner');

    let cursor = document.querySelector('.custom-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'custom-cursor';
      cursor.textContent = '⛏️';
      document.body.appendChild(cursor);
    }
    
    const canvas = document.getElementById('game-canvas');
    
    document.addEventListener('pointermove', (e) => {
      if (e.target === canvas) {
        cursor.style.display = 'block';
        cursor.style.left = (e.clientX - 10) + 'px'; 
        cursor.style.top = (e.clientY - 35) + 'px';
      } else {
        cursor.style.display = 'none';
      }
    });
    
    if (canvas) {
      canvas.addEventListener('pointerdown', () => {
        cursor.style.transform = 'translateY(15px) rotate(-45deg)';
        setTimeout(() => { cursor.style.transform = 'translateY(0) rotate(0deg)'; }, 150);
      });
    }
  },

  updateCounters(pickaxes, gemsCollected, maxGems) {
    if(this.pickaxeCounter) this.pickaxeCounter.textContent = `⛏️ ${pickaxes}`;
    if(this.gemCounter) this.gemCounter.textContent = `💎 ${gemsCollected} / ${maxGems}`;
  },

  updateStage(stageId) {
    if (this.doorInner) this.doorInner.innerText = doorEmojis[stageId - 1] || '🚪';
    
    const chests = this.stageProgress.querySelectorAll('.chest');
    const lines = this.stageProgress.querySelectorAll('.line');
    
    chests.forEach(chest => {
      const id = parseInt(chest.getAttribute('data-stage'));
      chest.className = 'chest'; 
      if (id < stageId) chest.classList.add('cleared');
      else if (id === stageId) chest.classList.add('active');
    });
    lines.forEach((line, index) => {
      line.className = 'line';
      if (index + 1 < stageId) line.classList.add('cleared');
    });
  },

  updateItemSlots(active_items) {
    if (!this.itemSlotBar) return;
    this.itemSlotBar.innerHTML = '';
    active_items.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `item-slot ${item.filled ? 'filled' : ''}`;
      slot.id = `item-slot-${item.instanceId}`;
      const emoji = itemEmojis[item.itemId] || '🎁';
      if (!item.filled) {
        slot.innerHTML = `<span style="font-size:30px; opacity:0.3; filter:grayscale(100%);">${emoji}</span>
                          <span style="font-size:10px; color:#555; position:absolute; bottom:2px; font-weight:bold;">${item.totalTiles}칸</span>`;
      } else {
        slot.innerText = emoji;
      }
      this.itemSlotBar.appendChild(slot);
    });
  },

  playPopup(x, y, text, extraClass) {
    const popup = document.createElement('div');
    popup.innerText = text; 
    popup.className = `popup-anim ${extraClass}`;
    popup.style.left = x + 'px'; popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
  },

  flyItemToSlot(item, cx3d, cz3d, camera, callback) {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    const vector = new THREE.Vector3(cx3d, 0, cz3d);
    vector.project(camera);
    const cx = rect.left + (vector.x * 0.5 + 0.5) * rect.width;
    const cy = rect.top + -(vector.y * 0.5 - 0.5) * rect.height;

    const emoji = itemEmojis[item.itemId] || '🎁';
    const blinkEl = document.createElement('div');
    blinkEl.className = 'popup-anim'; blinkEl.innerText = emoji;
    blinkEl.style.left = cx + 'px'; blinkEl.style.top = cy + 'px';
    blinkEl.style.fontSize = '40px';
    document.body.appendChild(blinkEl);

    setTimeout(() => {
      const flyEl = document.createElement('div');
      flyEl.className = 'flying-item';
      flyEl.style.left = cx + 'px'; flyEl.style.top = cy + 'px';
      flyEl.innerText = emoji;
      document.body.appendChild(flyEl);
      setTimeout(() => {
        flyEl.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
        flyEl.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(360deg)';
        const targetSlot = document.getElementById(`item-slot-${item.instanceId}`);
        if (targetSlot) {
          const targetRect = targetSlot.getBoundingClientRect();
          flyEl.style.left = (targetRect.left + targetRect.width/2) + 'px';
          flyEl.style.top = (targetRect.top + targetRect.height/2) + 'px';
        }
      }, 50);
      
      setTimeout(() => {
        flyEl.remove();
        callback();
      }, 800);
    }, 500); 
  },

  playStageClearAnimation(active_items, stageId, onComplete) {
    const door = document.querySelector('.door-inner');
    const doorRect = door.getBoundingClientRect();
    
    const flyingPromises = active_items.map((item, idx) => {
      return new Promise(resolve => {
        setTimeout(() => {
          const slot = document.getElementById(`item-slot-${item.instanceId}`);
          if (!slot) { resolve(); return; }
          const slotRect = slot.getBoundingClientRect();
          const flyEl = document.createElement('div');
          flyEl.innerText = itemEmojis[item.itemId] || '🎁';
          flyEl.style.position = 'absolute';
          flyEl.style.zIndex = 300;
          flyEl.style.fontSize = '40px';
          flyEl.style.left = slotRect.left + 'px';
          flyEl.style.top = slotRect.top + 'px';
          flyEl.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
          document.body.appendChild(flyEl);
          
          setTimeout(() => {
            flyEl.style.left = (doorRect.left + doorRect.width/2 - 20) + 'px';
            flyEl.style.top = (doorRect.top + doorRect.height/2 - 20) + 'px';
            flyEl.style.transform = 'scale(1.5) rotate(720deg)';
            flyEl.style.opacity = 0;
            
            setTimeout(() => {
              flyEl.remove();
              door.style.transform = 'scale(1.2)';
              door.style.boxShadow = '0 0 20px 5px #222';
              setTimeout(() => {
                door.style.transform = 'scale(1)';
                door.style.boxShadow = 'none';
              }, 300);
              resolve();
            }, 800);
          }, 50);
        }, idx * 400);
      });
    });

    Promise.all(flyingPromises).then(() => {
      const nextStageNum = Math.min(stageId + 1, 6);
      door.innerText = doorEmojis[nextStageNum - 1] || '🚪';
      door.style.transform = 'scale(1.5)';
      setTimeout(() => door.style.transform = 'scale(1)', 300);
      setTimeout(() => onComplete(), 500);
    });
  }
};
