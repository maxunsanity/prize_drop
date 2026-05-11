const tokensEl = document.getElementById('ui-tokens');
const betEl    = document.getElementById('ui-bet');
const resultEl = document.getElementById('ui-result');
const spinBtn  = document.getElementById('btn-spin');
const betBtn   = document.getElementById('btn-bet');
const pointer  = document.getElementById('pointer');

export const UI = {
  updateTokens(n) {
    tokensEl.textContent = `🪙 ${n}`;
    tokensEl.classList.remove('pop');
    void tokensEl.offsetWidth; // reflow → 애니메이션 재시작
    tokensEl.classList.add('pop');
    setTimeout(() => tokensEl.classList.remove('pop'), 400);
  },

  updateBet(n) {
    betEl.textContent = `BET: ${n}`;
    betBtn.textContent = `BET: ${n}`;
  },

  setSpinEnabled(enabled) {
    spinBtn.disabled = !enabled;
    if (enabled) {
      spinBtn.classList.remove('disabled');
    } else {
      spinBtn.classList.add('disabled');
    }
  },

  // ANI-003 보상 팝업: 위로 올라가며 사라짐
  showPopup(text, type = 'default') {
    resultEl.innerHTML = '';
    const el = document.createElement('div');
    el.className = type === 'lose' || type === 'EMPTY' ? 'result-label' : 'reward-popup';
    el.textContent = text;
    resultEl.appendChild(el);
    setTimeout(() => {
      if (resultEl.contains(el)) resultEl.removeChild(el);
    }, 1400);
  },

  // ANI-004 포인터 진동: 정지 순간 ±3deg 2회
  triggerPointerVibrate() {
    pointer.classList.remove('vibrate');
    void pointer.offsetWidth;
    pointer.classList.add('vibrate');
    setTimeout(() => pointer.classList.remove('vibrate'), 400);
  },

  // ANI-005 JACKPOT: 섹션 순차 하이라이트 3회 후 최종 팝업
  showJackpot(sections, wheel, jackpotId, message) {
    let idx = 0;
    let round = 0;
    const maxRounds = 3;

    const interval = setInterval(() => {
      wheel.highlight(sections[idx].id);
      idx = (idx + 1) % sections.length;
      if (idx === 0) round++;

      if (round >= maxRounds) {
        clearInterval(interval);
        wheel.highlight(jackpotId);
        setTimeout(() => this.showPopup(message, 'win'), 200);
      }
    }, 150);
  }
};
