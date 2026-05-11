export const UI = {
  uiCoins: null,
  uiBet: null,
  uiResult: null,
  btnBet: null,
  btnSpin: null,
  app: null,
  reelsContainerWrapper: null,

  init() {
    this.uiCoins = document.getElementById('ui-coins');
    this.uiBet = document.getElementById('btn-bet'); // Use the button as bet display
    this.uiResult = document.getElementById('ui-result');
    this.btnBet = document.getElementById('btn-bet');
    this.btnSpin = document.getElementById('btn-spin');
    this.app = document.getElementById('app');
    this.reelsContainerWrapper = document.getElementById('reel-container-wrapper');
  },

  updateCoins(coins) {
    this.uiCoins.textContent = `🐾 ${coins}`;
  },

  updateBet(bet) {
    this.btnBet.textContent = `x${bet}`;
  },

  setSpinButtonState(disabled) {
    if (disabled) {
      this.btnSpin.classList.add('disabled');
      this.btnSpin.style.pointerEvents = 'none';
    } else {
      this.btnSpin.classList.remove('disabled');
      this.btnSpin.style.pointerEvents = 'auto';
    }
  },

  showPopup(text) {
    const popup = document.createElement('div');
    popup.className = 'popup-text';
    popup.textContent = text;
    this.uiResult.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  },

  playWinAnimation(amount) {
    this.reelsContainerWrapper.classList.add('highlight-win');
    setTimeout(() => {
      this.reelsContainerWrapper.classList.remove('highlight-win');
    }, 1000);
    this.showPopup(`+${amount}!`);

    // 돈 날아가는 효과 추가
    this.spawnFlyingCoins(Math.min(15, amount));
  },

  spawnFlyingCoins(count) {
    const startRect = this.app.getBoundingClientRect();
    const targetRect = this.uiCoins.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'flying-coin';
      coin.innerText = '🐾';
      this.uiResult.appendChild(coin);

      const startX = startRect.width / 2 + (Math.random() - 0.5) * 150;
      const startY = startRect.height / 2 - 50 + (Math.random() - 0.5) * 100;

      coin.style.left = startX + 'px';
      coin.style.top = startY + 'px';

      setTimeout(() => {
        coin.style.transition = 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
        coin.style.left = (targetRect.left - startRect.left + 30) + 'px';
        coin.style.top = (targetRect.top - startRect.top + 15) + 'px';
        coin.style.transform = 'scale(0.5)';
        coin.style.opacity = '0';
      }, 50 + i * 50);

      setTimeout(() => {
        coin.remove();
      }, 700 + i * 50);
    }
  },

  playJackpotAnimation(amount) {
    this.app.classList.add('jackpot-flash');
    setTimeout(() => {
      this.app.classList.remove('jackpot-flash');
    }, 1000);
    this.showPopup(`JACKPOT! +${amount}`);
    this.spawnFlyingCoins(30);
  },

  playLoseAnimation() {
    // dim effect not suitable for vibrant style, maybe just do nothing or slight shake
  }
};
