export const UI = {
  uiCoins:       null,
  uiResult:      null,
  app:           null,
  reelContainer: null,
  reelWrapper:   null,

  init() {
    this.uiCoins       = document.getElementById('ui-coins');
    this.uiResult      = document.getElementById('ui-result');
    this.app           = document.getElementById('app');
    this.reelContainer = document.getElementById('reel-container');
    this.reelWrapper   = document.getElementById('reel-container-wrapper');
  },

  updateCoins(coins) {
    this.uiCoins.textContent = `💰 ${coins}`;
  },

  updateBet(bet) {
    document.getElementById('btn-bet').textContent = `BET: ${bet}`;
  },

  setSpinButtonState(disabled) {
    document.getElementById('btn-spin').classList.toggle('disabled', disabled);
  },

  showPopup(text) {
    const el = document.createElement('div');
    el.className   = 'popup-text';
    el.textContent = text;
    this.uiResult.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  },

  // SM-ANI-002: WIN — reel border flashes yellow
  playWinAnimation(amount) {
    this.reelContainer.classList.remove('win-flash');
    void this.reelContainer.offsetWidth; // force reflow to restart animation
    this.reelContainer.classList.add('win-flash');
    setTimeout(() => this.reelContainer.classList.remove('win-flash'), 1700);

    this.showPopup(`+${amount} 💰`);
    this._spawnFlyingCoins(Math.min(30, Math.max(10, Math.floor(amount / 2))));
  },

  // SM-ANI-005: JACKPOT — full-screen flash
  playJackpotAnimation(amount) {
    this.app.classList.remove('jackpot-flash');
    void this.app.offsetWidth;
    this.app.classList.add('jackpot-flash');
    setTimeout(() => this.app.classList.remove('jackpot-flash'), 1300);

    this.showPopup(`JACKPOT! +${amount} 💰`);
    this._spawnFlyingCoins(30);
  },

  // SM-ANI-006: LOSE dim — delegated to Reel.dim() in game.js
  playLoseAnimation() {},

  // SM-ANI-003: flying coins from reel center → #ui-coins
  _spawnFlyingCoins(count) {
    const appRect     = this.app.getBoundingClientRect();
    const wrapperRect = this.reelWrapper.getBoundingClientRect();
    const coinRect    = this.uiCoins.getBoundingClientRect();

    // Convert viewport coords → #app-relative coords
    const startX = wrapperRect.left - appRect.left + wrapperRect.width  / 2;
    const startY = wrapperRect.top  - appRect.top  + wrapperRect.height / 2;
    const endX   = coinRect.left    - appRect.left + coinRect.width     / 2;
    const endY   = coinRect.top     - appRect.top  + coinRect.height    / 2;

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className   = 'flying-coin';
      coin.textContent = '🐾';

      // Random spread around reel center
      const sx = startX + (Math.random() - 0.5) * 120;
      const sy = startY + (Math.random() - 0.5) * 60;
      coin.style.cssText = `left:${sx}px; top:${sy}px; opacity:1;`;
      this.uiResult.appendChild(coin);

      // Trigger CSS transition after first paint
      setTimeout(() => {
        const dur = (0.45 + Math.random() * 0.2).toFixed(2);
        coin.style.transition = `left ${dur}s cubic-bezier(.3,.1,.2,1), top ${dur}s cubic-bezier(.3,.1,.2,1), opacity ${dur}s, transform ${dur}s`;
        coin.style.left      = `${endX}px`;
        coin.style.top       = `${endY}px`;
        coin.style.opacity   = '0';
        coin.style.transform = 'scale(0.3)';
      }, 60 + i * 50);

      setTimeout(() => coin.remove(), 900 + i * 50);
    }
  },
};
