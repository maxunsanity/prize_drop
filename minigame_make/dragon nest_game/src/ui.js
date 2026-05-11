// DOM overlay updates — all direct DOM manipulation lives here

export function updateHeader({ ballCount, totalScore, roundCount }) {
  document.getElementById('ui-ball-count').textContent  = `🔵 ${ballCount}`;
  document.getElementById('ui-total-score').textContent = `${totalScore} pts`;
  document.getElementById('ui-round-count').textContent = `R${roundCount}`;
}

export function updateMultiplierBtns(selected, ballCount) {
  document.querySelectorAll('.mult-btn').forEach(btn => {
    const m = Number(btn.dataset.mult);
    btn.classList.toggle('active',      m === selected);
    btn.classList.toggle('unavailable', ballCount < m);
  });
}

export function showSlotResult(label, finalTokens) {
  const el = document.getElementById('ui-result');
  el.textContent = `${label}  +${finalTokens}`;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

// Float texts on canvas overlay
export function addFloatText(text, x, y, cls = '') {
  const layer = document.getElementById('float-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className   = 'float-text ' + cls;
  el.textContent = text;
  el.style.left  = (x - 20) + 'px';
  el.style.top   = (y - 10) + 'px';
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
