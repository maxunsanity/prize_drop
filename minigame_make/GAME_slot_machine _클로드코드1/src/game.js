import { Reel }              from './reel.js';
import { Mechanics }         from './mechanics.js';
import { UI }                from './ui.js';
import { Storage, GameData } from './data.js';

export const Game = {
  reels:    [],
  coins:    50,
  bet:      1,
  spinning: false,

  init() {
    UI.init();

    const saved = Storage.load('sm_coins');
    if (saved !== null) this.coins = saved;
    UI.updateCoins(this.coins);
    UI.updateBet(this.bet);

    this.reels = [
      new Reel('reel-0', GameData.symbolConfig),
      new Reel('reel-1', GameData.symbolConfig),
      new Reel('reel-2', GameData.symbolConfig),
    ];

    window.addEventListener('resize', () => this.reels.forEach(r => r.resize()));

    this._loop();
  },

  changeBet() {
    if (this.spinning) return;
    if      (this.bet === 1)  this.bet = 5;
    else if (this.bet === 5)  this.bet = 10;
    else                      this.bet = 1;
    UI.updateBet(this.bet);
  },

  addDebugCoins() {
    this.coins += 50;
    Storage.save('sm_coins', this.coins);
    UI.updateCoins(this.coins);
    UI.setSpinButtonState(false);
  },

  spin() {
    if (this.spinning) return;
    if (this.coins < this.bet) {
      UI.showPopup('코인 부족!');
      return;
    }

    this.spinning = true;
    UI.setSpinButtonState(true);

    // [CRITICAL] 베팅 즉시 차감
    this.coins -= this.bet;
    Storage.save('sm_coins', this.coins);
    UI.updateCoins(this.coins);

    // [CRITICAL] 결과 선결정
    const results = Mechanics.determineResult();

    // 릴 순차 시작: 릴0(0ms) → 릴1(200ms) → 릴2(400ms)
    this.reels[0].spin(results[0].emoji);
    setTimeout(() => this.reels[1].spin(results[1].emoji), 200);
    setTimeout(() => this.reels[2].spin(results[2].emoji), 400);

    // 릴 순차 정지: 릴0(600ms) → 릴1(1000ms) → 릴2(1400ms)
    setTimeout(() => this.reels[0].stop(), 600);
    setTimeout(() => this.reels[1].stop(), 1000);
    setTimeout(() => {
      this.reels[2].stop();
      this._waitForStopThenCheck(results);
    }, 1400);
  },

  _waitForStopThenCheck(results) {
    const check = setInterval(() => {
      if (!this.reels.every(r => r.state === 'IDLE')) return;
      clearInterval(check);

      const payout = Mechanics.checkPayout(results, this.bet);

      if (payout.type === 'JACKPOT') {
        this.coins += payout.amount;
        UI.playJackpotAnimation(payout.amount);
      } else if (payout.type === 'WIN') {
        this.coins += payout.amount;
        UI.playWinAnimation(payout.amount);
      } else {
        // SM-ANI-006: dim reels 0.3s → restore 0.5s later
        this.reels.forEach(r => r.dim(true));
        setTimeout(() => this.reels.forEach(r => r.dim(false)), 500);
        UI.playLoseAnimation();
      }

      Storage.save('sm_coins', this.coins);
      UI.updateCoins(this.coins);
      this.spinning = false;

      if (this.coins >= this.bet) {
        UI.setSpinButtonState(false);
      } else {
        UI.showPopup('코인 부족!');
      }
    }, 100);
  },

  _loop() {
    requestAnimationFrame(() => this._loop());
    this.reels.forEach(r => r.update());
  },
};
