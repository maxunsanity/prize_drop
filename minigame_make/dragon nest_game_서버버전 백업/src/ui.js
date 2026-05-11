import { getActiveDragon, getPlayerState, getDragonStates, getStageTarget } from './mechanics.js';

const DRAGON_EMOJI = {
  1: ['🥚','🐣','🐲'],
  2: ['🥚','🐣','🦎'],
  3: ['🥚','🐣','🦕'],
  4: ['🥚','🐣','🐉'],
};
const DRAGON_COLOR = { 1:'#ef5350', 2:'#66bb6a', 3:'#8d6e63', 4:'#42a5f5' };

export function showScreen(name) {
  document.getElementById('lobby-screen').style.display = name === 'lobby' ? 'flex' : 'none';
  document.getElementById('pinball-screen').style.display = name === 'pinball' ? 'flex' : 'none';
}

export function renderLobby(dragonConfig, onDragonClick) {
  const dragonStates = getDragonStates();
  const ps = getPlayerState();

  document.getElementById('lobby-ball-counter').textContent = `🔵 ${ps.ball_count}`;

  const grid = document.getElementById('dragon-grid');
  grid.innerHTML = '';

  Object.entries(dragonStates).forEach(([id, ds]) => {
    const nid = Number(id);
    const cfg = dragonConfig[nid];
    const stageIdx = Math.min(ds.stage - 1, 2);
    const emoji = ds.completed ? '✨' + DRAGON_EMOJI[nid][2] + '✨' : DRAGON_EMOJI[nid][stageIdx];
    const target = getStageTarget(nid);
    const total = ds.my_token + ds.partner_token;
    const myPct = Math.min(ds.my_token / target * 100, 100);
    const partnerPct = Math.min(ds.partner_token / target * 100, 100 - myPct);

    const card = document.createElement('div');
    card.className = 'dragon-card' + (ds.completed ? ' completed' : '');
    card.style.borderColor = ds.completed ? '#f5c518' : DRAGON_COLOR[nid];
    card.innerHTML = `
      <div class="dragon-emoji">${emoji}</div>
      <div class="dragon-name" style="color:${DRAGON_COLOR[nid]}">${cfg.name}</div>
      <div class="dragon-stage">${ds.completed ? '완성! ✓' : `${ds.stage}단계`}</div>
      <div class="dragon-gauge-mini">
        <div class="dgm-my" style="width:${myPct}%"></div>
        <div class="dgm-partner" style="width:${partnerPct}%"></div>
      </div>
      ${ds.completed ? '' : '<div class="dragon-play-btn">탭하여 플레이</div>'}
    `;
    if (!ds.completed) card.addEventListener('click', () => onDragonClick(nid));
    grid.appendChild(card);
  });

  const allDone = Object.values(dragonStates).every(d => d.completed);
  const chest = document.getElementById('grand-prize-chest');
  if (allDone) {
    chest.classList.add('unlocked');
    document.getElementById('grand-prize-icon').textContent = '🎁✨';
    document.getElementById('gp-status').textContent = '클리어! Grand Prize 획득!';
  }
}

export function updatePinballUI(dragonConfig) {
  const ps = getPlayerState();
  const ds = getActiveDragon();
  if (!ds) return;
  const nid = ds.dragon_id;
  const cfg = dragonConfig[nid];
  const stageIdx = Math.min(ds.stage - 1, 2);
  const emoji = DRAGON_EMOJI[nid]?.[stageIdx] ?? '🐉';

  document.getElementById('ui-ball-counter').textContent = `🔵 ${ps.ball_count}`;
  document.getElementById('ui-dragon-header').textContent = `${emoji} ${cfg.name} ${ds.stage}단계`;

  // Partner gauge
  const target = getStageTarget(nid);
  const myPct = Math.min(ds.my_token / target * 100, 100);
  const partnerPct = Math.min(ds.partner_token / target * 100, 100 - myPct);
  document.getElementById('gauge-my').style.width = myPct + '%';
  document.getElementById('gauge-partner').style.width = partnerPct + '%';
  document.getElementById('gauge-my-score').textContent = ds.my_token;
  document.getElementById('gauge-partner-score').textContent = ds.partner_token;

  // Stage progress gauge
  const total = ds.my_token + ds.partner_token;
  const stagePct = Math.min(total / target * 100, 100);
  document.getElementById('stage-bar-fill').style.width = stagePct + '%';
  document.getElementById('stage-label').textContent = `${ds.stage}/3`;

  // Multiplier buttons
  document.querySelectorAll('.mult-btn').forEach(btn => {
    const m = Number(btn.dataset.mult);
    btn.classList.toggle('active', m === ps.selected_multiplier);
    btn.classList.toggle('unavailable', ps.ball_count < m);
    btn.style.opacity = ps.ball_count < m ? '0.5' : '1';
  });
}

export function addFloatText(text, _canvas, worldX, worldY, cls = '') {
  const floatLayer = document.getElementById('float-layer');
  if (!floatLayer) return;
  const el = document.createElement('div');
  el.className = 'float-text ' + cls;
  el.textContent = text;
  // float-layer is position:absolute inset:0 over the 390×420 canvas
  el.style.left = (worldX - 20) + 'px';
  el.style.top  = (worldY - 10) + 'px';
  floatLayer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export function initSpring(onLaunch) {
  const springBtn = document.getElementById('spring-btn');
  const springFill = document.getElementById('spring-fill');

  springBtn.addEventListener('click', () => {
    // Brief visual feedback then fire
    springFill.style.height = '100%';
    springBtn.classList.add('charging');
    setTimeout(() => {
      springFill.style.height = '0%';
      springBtn.classList.remove('charging');
    }, 150);
    onLaunch(0.6); // fixed charge ratio for consistent launch speed
  });
}

export function showStageRewardModal(dragonConfig, dragonId, stage, isCompleted, onContinue) {
  const cfg = dragonConfig[dragonId];
  const stageIdx = Math.min(stage - 1, 2);
  const emoji = isCompleted
    ? '✨' + DRAGON_EMOJI[dragonId]?.[2] + '✨'
    : DRAGON_EMOJI[dragonId]?.[stageIdx] ?? '🐉';

  document.getElementById('modal-dragon-emoji').textContent = emoji;
  document.getElementById('modal-title').textContent = isCompleted
    ? `${cfg.name} 성장 완성!`
    : `${stage}단계 달성!`;
  document.getElementById('modal-desc').textContent = isCompleted
    ? '드래곤이 완전히 성장했습니다!'
    : `다음 단계로 진행합니다. (${stage}/3)`;

  const modal = document.getElementById('stage-reward-modal');
  modal.style.display = 'flex';
  document.getElementById('modal-ok-btn').onclick = () => {
    modal.style.display = 'none';
    onContinue();
  };
}

export function showGrandPrizeModal() {
  document.getElementById('grand-prize-modal').style.display = 'flex';
}
