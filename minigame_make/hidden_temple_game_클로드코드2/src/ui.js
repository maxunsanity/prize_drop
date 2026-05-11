// DOM updates, HT-ANI animations, custom cursor, popups

const slots = [null, null, null]; // up to 3 DOM elements

export function initUI() {
  // Wire up custom cursor to canvas container
  const container = document.getElementById('canvas-container');
  const cursor    = document.getElementById('custom-cursor');
  if (!cursor) return;

  container.addEventListener('mouseenter', () => { cursor.style.display = 'block'; });
  container.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });
  container.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  // Cache slot elements
  document.querySelectorAll('.item-slot').forEach((el, i) => { slots[i] = el; });
}

export function resetSlots() {
  slots.forEach(s => {
    if (!s) return;
    s.classList.remove('filled');
    s.innerHTML = '';
    delete s.dataset.emoji;
    delete s.dataset.itemId;
  });
}

export function updatePickaxe(count) {
  const el = document.querySelector('.pickaxe-counter');
  if (el) el.textContent = `⛏️ ${count}`;
}

export function updateGems(collected, total) {
  const el = document.querySelector('.gem-counter');
  if (el) el.textContent = `💎 ${collected} / ${total}`;
}

export function updateStageProgress(stage) {
  document.querySelectorAll('.chest').forEach((el, i) => {
    el.classList.toggle('done',   i + 1 < stage);
    el.classList.toggle('active', i + 1 === stage);
  });
}

// Show target item dimmed (before collection)
export function previewSlot(index, emoji) {
  const slot = slots[index];
  if (!slot) return;
  slot.classList.remove('filled');
  slot.innerHTML = `<span style="font-size:30px;line-height:1;opacity:0.3;filter:grayscale(1);">${emoji}</span>`;
}

// Fill item slot (index 0-2)
export function fillSlot(index, emoji, itemId) {
  const slot = slots[index];
  if (!slot) return;
  slot.classList.add('filled');
  slot.dataset.emoji  = emoji;
  slot.dataset.itemId = itemId;
  slot.innerHTML = `<span style="font-size:30px;line-height:1;">${emoji}</span>`;
}

// Popup at absolute position within #ui-layer (for gem / reward popups)
export function showPopup(text, screenX, screenY) {
  const el = document.createElement('div');
  el.className   = 'popup-anim';
  el.textContent = text;
  el.style.left  = screenX + 'px';
  el.style.top   = screenY + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// Screen coords for a slot (center)
export function getSlotScreenPos(index) {
  const slot = slots[index];
  if (!slot) return { x: window.innerWidth / 2, y: window.innerHeight - 36 };
  const rect = slot.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Flying emoji from world-projected position → slot (DOM overlay)
export function flyEmojiToSlot(emoji, fromX, fromY, slotIndex) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:       'fixed',
      left:           fromX + 'px',
      top:            fromY + 'px',
      fontSize:       '38px',
      pointerEvents:  'none',
      zIndex:         '500',
      transform:      'translate(-50%,-50%)',
      transition:     'left .55s cubic-bezier(.4,0,.2,1), top .55s cubic-bezier(.4,0,.2,1), font-size .55s, opacity .55s',
      opacity:        '1',
    });
    el.textContent = emoji;
    document.body.appendChild(el);

    const target = getSlotScreenPos(slotIndex);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.left     = target.x + 'px';
      el.style.top      = target.y + 'px';
      el.style.fontSize = '22px';
    }));

    setTimeout(() => { el.remove(); resolve(); }, 620);
  });
}

// All filled slots fly to the door
export function flySlotsToDooor() {
  const door = getDoorScreenPos();
  const promises = [];

  slots.forEach((slot, i) => {
    if (!slot || !slot.classList.contains('filled')) return;
    const emoji = slot.dataset.emoji || '❓';
    const slotRect = slot.getBoundingClientRect();
    const fromX = slotRect.left + slotRect.width  / 2;
    const fromY = slotRect.top  + slotRect.height / 2;

    promises.push(new Promise(resolve => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position:      'fixed',
        left:          fromX + 'px',
        top:           fromY + 'px',
        fontSize:      '30px',
        pointerEvents: 'none',
        zIndex:        '500',
        transform:     'translate(-50%,-50%)',
        transition:    `left .5s ease ${i * 80}ms, top .5s ease ${i * 80}ms, opacity .5s ease ${i * 80}ms`,
        opacity:       '1',
      });
      el.textContent = emoji;
      document.body.appendChild(el);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.left    = door.x + 'px';
        el.style.top     = door.y + 'px';
        el.style.opacity = '0';
      }));

      setTimeout(() => { el.remove(); resolve(); }, 620 + i * 80);
    }));
  });

  return Promise.all(promises);
}

export function pulseDoor() {
  const circle = document.querySelector('.door-circle');
  if (!circle) return;
  circle.classList.remove('pulse');
  void circle.offsetWidth; // reflow
  circle.classList.add('pulse');
}

function getDoorScreenPos() {
  const el = document.querySelector('.door-inner');
  if (!el) return { x: window.innerWidth / 2, y: 60 };
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Modal (stage clear, out of pickaxes, event done)
export function showModal(title, subtitle, btnText, onBtn) {
  let modal = document.getElementById('game-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'game-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">${title}</div>
      <div class="modal-sub">${subtitle}</div>
      <button class="sketch-btn modal-btn" style="pointer-events:auto;">${btnText}</button>
    </div>`;
  modal.style.display = 'flex';
  modal.querySelector('.modal-btn').addEventListener('click', () => {
    modal.style.display = 'none';
    onBtn();
  });
}

export function hideModal() {
  const m = document.getElementById('game-modal');
  if (m) m.style.display = 'none';
}
