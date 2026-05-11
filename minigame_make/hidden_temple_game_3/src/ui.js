import { EMOJI_MAP } from './board.js';

export function setupUI() {
  document.addEventListener('mousemove', (e) => {
    let cursor = document.getElementById('custom-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'custom-cursor';
      cursor.className = 'pickaxe-cursor';
      cursor.innerText = '⛏️';
      document.body.appendChild(cursor);
    }
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.addEventListener('mousedown', () => {
    const cursor = document.getElementById('custom-cursor');
    if(cursor) cursor.classList.add('dig');
  });
  document.addEventListener('mouseup', () => {
    const cursor = document.getElementById('custom-cursor');
    if(cursor) cursor.classList.remove('dig');
  });
}

export function updateUI(GameState) {
  document.getElementById('pickaxe-counter').innerText = `⛏️ ${GameState.pickaxe_count}`;
  document.getElementById('gem-counter').innerText = `💎 ${GameState.gems_collected}`;

  for(let i=1; i<=5; i++) {
    const chest = document.getElementById(`stage-indicator-${i}`);
    if (chest) {
      if(i < GameState.stage) chest.classList.add('active');
      else if (i === GameState.stage) {
        chest.classList.add('active');
        chest.style.transform = 'scale(1.2)';
      } else {
        chest.classList.remove('active');
        chest.style.transform = 'none';
      }
    }
  }

  const slotBar = document.getElementById('item-slot-bar');
  slotBar.innerHTML = '';
  GameState.active_items.forEach(item => {
    const slot = document.createElement('div');
    slot.className = 'item-slot';
    if(item.filled) {
      slot.classList.add('filled');
      slot.innerText = EMOJI_MAP[item.item_id] || '❓';
    }
    slot.id = `slot-${item.instance_id}`;
    slotBar.appendChild(slot);
  });
}

export function showPopup(text, clientX, clientY) {
  const el = document.createElement('div');
  el.className = 'popup-anim';
  el.innerText = text;
  el.style.left = clientX + 'px';
  el.style.top = clientY + 'px';
  document.getElementById('ui-layer').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

export function animateItemFly(item_id, startX, startY, targetEl) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'flying-item';
    el.innerText = EMOJI_MAP[item_id] || '❓';
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    document.getElementById('ui-layer').appendChild(el);

    const rect = targetEl.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    setTimeout(() => {
      el.style.left = targetX + 'px';
      el.style.top = targetY + 'px';
      el.style.transform = 'translate(-50%, -50%) scale(0.5)';
      el.style.opacity = '0';
    }, 50);

    setTimeout(() => {
      el.remove();
      resolve();
    }, 850);
  });
}

export function animateStageClear(activeItems) {
  return new Promise(resolve => {
    const door = document.querySelector('.door-inner');
    const promises = activeItems.map((item, idx) => {
      return new Promise(r => {
        setTimeout(() => {
          const slot = document.getElementById(`slot-${item.instance_id}`);
          if(!slot) return r();
          const rect = slot.getBoundingClientRect();
          animateItemFly(item.item_id, rect.left + rect.width/2, rect.top + rect.height/2, door).then(() => {
            slot.classList.remove('filled');
            slot.innerText = '';
            r();
          });
        }, idx * 200);
      });
    });

    Promise.all(promises).then(() => {
      door.classList.add('pulse');
      setTimeout(() => {
        door.classList.remove('pulse');
        resolve();
      }, 500);
    });
  });
}
