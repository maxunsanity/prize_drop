import * as THREE from 'three';
import { getCamera, getRenderer } from './game.js';

const doorEmojis = ['🚪', '🏛️', '⛩️', '🏰', '🗿', '🌌'];
const itemEmojis = { 1001: '🏺', 1002: '🗝️', 1003: '⚔️', 1004: '🪖', 1005: '👑', 1006: '🛠️' };

export function getItemEmoji(id) { return itemEmojis[id] || '💎'; }

export function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  const wrap = document.getElementById('canvas-wrap');
  wrap.style.cursor = 'none';
  cursor.style.display = 'block';
  wrap.addEventListener('pointermove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  wrap.addEventListener('pointerleave', () => { cursor.style.display = 'none'; });
  wrap.addEventListener('pointerenter', () => { cursor.style.display = 'block'; });
}

export function swingCursor() {
  const cursor = document.getElementById('custom-cursor');
  cursor.classList.remove('swing');
  void cursor.offsetWidth;
  cursor.classList.add('swing');
  cursor.addEventListener('animationend', () => cursor.classList.remove('swing'), { once: true });
}

export function updateUI(ps, stageCfg) {
  document.getElementById('ui-pickaxe').textContent = ps.pickaxe_count;
  const total = stageCfg ? stageCfg.gem_count : 0;
  document.getElementById('ui-gem-counter').textContent = `${ps.gems_collected} / ${total}`;
  document.getElementById('door').textContent = doorEmojis[Math.min(ps.stage - 1, 5)];
  updateStageProgress(ps.stage);
  updateItemSlots(ps.active_items);
}

export function updateStageProgress(currentStage) {
  const bar = document.getElementById('stage-progress');
  bar.innerHTML = '';
  const stages = [
    { label: '관I' }, { label: '관II' }, { label: '관III' }, { label: '관IV' }, { label: '관V' }
  ];
  stages.forEach((s, i) => {
    const stageNum = i + 1;
    const chest = document.createElement('div');
    chest.className = 'chest';
    if (stageNum < currentStage) chest.classList.add('done');
    else if (stageNum === currentStage) chest.classList.add('active');
    chest.textContent = stageNum < currentStage ? `🏆` : `🗝️`;
    chest.title = s.label;
    bar.appendChild(chest);
    if (i < 4) {
      const line = document.createElement('div');
      line.className = 'line';
      if (stageNum < currentStage) line.classList.add('done');
      else if (stageNum === currentStage) line.classList.add('active');
      bar.appendChild(line);
    }
  });
}

export function initItemSlots(activeItems) {
  const container = document.getElementById('ui-item-slots');
  container.innerHTML = '';
  activeItems.forEach((item, i) => {
    const slot = document.createElement('div');
    slot.className = 'item-slot' + (item.filled ? ' filled' : '');
    slot.id = `slot-${i}`;
    const emojiEl = document.createElement('div');
    emojiEl.className = 'slot-emoji';
    emojiEl.textContent = item.filled ? getItemEmoji(item.item_id) : '';
    const label = document.createElement('div');
    label.className = 'slot-label';
    label.textContent = `${item.tile_count || 1}칸`;
    slot.appendChild(emojiEl);
    slot.appendChild(label);
    container.appendChild(slot);
  });
}

function updateItemSlots(activeItems) {
  activeItems.forEach((item, i) => {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) return;
    if (item.filled) {
      slot.classList.add('filled');
      slot.querySelector('.slot-emoji').textContent = getItemEmoji(item.item_id);
    }
  });
}

export function showFloatText(text, wx, wz) {
  const renderer = getRenderer();
  const camera = getCamera();
  if (!renderer || !camera) return;

  const { x: sx, y: sy } = worldToScreen(wx, wz, renderer, camera);
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = sx + 'px';
  el.style.top = sy + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export function showItemPopup(worldPos, emoji, onDone) {
  if (!worldPos) { onDone(); return; }
  const renderer = getRenderer();
  const camera = getCamera();
  const { x: sx, y: sy } = worldToScreen(worldPos.x, worldPos.z, renderer, camera);

  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:${sx}px;top:${sy}px;transform:translate(-50%,-50%);
    font-size:20px;font-weight:bold;background:#fffde7;border:2px solid #222;
    padding:6px 12px;box-shadow:2px 2px 0 #222;z-index:160;pointer-events:none;`;
  el.textContent = `${emoji} 발굴!`;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); onDone(); }, 500);
}

export function flyItemToSlot(emoji, worldPos, slotIdx, onDone) {
  const renderer = getRenderer();
  const camera = getCamera();
  const slotEl = document.getElementById(`slot-${slotIdx}`);
  if (!slotEl || !worldPos) { onDone(); return; }

  const start = worldToScreen(worldPos.x, worldPos.z, renderer, camera);
  const slotRect = slotEl.getBoundingClientRect();
  const endX = slotRect.left + slotRect.width / 2;
  const endY = slotRect.top + slotRect.height / 2;

  const fly = document.createElement('div');
  fly.className = 'item-fly';
  fly.textContent = emoji;
  fly.style.left = start.x + 'px';
  fly.style.top = start.y + 'px';
  fly.style.transform = 'translate(-50%,-50%) rotate(0deg)';
  document.body.appendChild(fly);

  requestAnimationFrame(() => {
    fly.style.left = endX + 'px';
    fly.style.top = endY + 'px';
    fly.style.transform = 'translate(-50%,-50%) rotate(360deg)';
  });

  setTimeout(() => { fly.remove(); onDone(); }, 850);
}

export function playStageClearAnim(activeItems, stage, onDone) {
  const doorEl = document.getElementById('door');
  const doorRect = doorEl.getBoundingClientRect();
  const doorX = doorRect.left + doorRect.width / 2;
  const doorY = doorRect.top + doorRect.height / 2;

  let delay = 0;
  const promises = activeItems.map((item, i) => new Promise(resolve => {
    setTimeout(() => {
      const slotEl = document.getElementById(`slot-${i}`);
      if (!slotEl) { resolve(); return; }
      const rect = slotEl.getBoundingClientRect();
      const fly = document.createElement('div');
      fly.className = 'item-fly';
      fly.textContent = getItemEmoji(item.item_id);
      fly.style.left = (rect.left + rect.width / 2) + 'px';
      fly.style.top = (rect.top + rect.height / 2) + 'px';
      fly.style.transform = 'translate(-50%,-50%)';
      document.body.appendChild(fly);
      requestAnimationFrame(() => {
        fly.style.left = doorX + 'px';
        fly.style.top = doorY + 'px';
        fly.style.transform = 'translate(-50%,-50%) scale(0.2)';
      });
      setTimeout(() => {
        fly.remove();
        slotEl.querySelector('.slot-emoji').textContent = '';
        slotEl.classList.remove('filled');
        resolve();
      }, 450);
    }, delay);
    delay += 400;
  }));

  Promise.all(promises).then(() => {
    doorEl.style.transition = 'transform 0.3s';
    doorEl.style.transform = 'scale(1.4)';
    const doorEmojis = ['🚪','🏛️','⛩️','🏰','🗿','🌌'];
    doorEl.textContent = doorEmojis[Math.min(stage, 5)];
    setTimeout(() => {
      doorEl.style.transform = 'scale(1)';
      onDone();
    }, 400);
  });
}

export function showStageClearModal(stage, isLast, onContinue) {
  const modal = document.getElementById('stage-clear-modal');
  document.getElementById('modal-title').textContent = isLast ? '🎉 이벤트 완료!' : `관문 ${stage} 클리어!`;
  document.getElementById('modal-desc').textContent = isLast ? '모든 관문을 통과했습니다!' : `다음 관문으로 진행합니다.`;
  const btn = document.getElementById('modal-continue-btn');
  btn.textContent = isLast ? '완료' : '계속하기 →';
  modal.classList.add('visible');
  btn.onclick = () => { modal.classList.remove('visible'); onContinue(); };
}

function worldToScreen(wx, wz, renderer, camera) {
  const rect = renderer.domElement.getBoundingClientRect();
  const vec = new THREE.Vector3(wx, 0, wz);
  vec.project(camera);
  const sx = (vec.x + 1) / 2 * rect.width + rect.left;
  const sy = -(vec.y - 1) / 2 * rect.height + rect.top;
  return { x: sx, y: sy };
}
