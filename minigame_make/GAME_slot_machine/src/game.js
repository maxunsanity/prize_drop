import { Reel } from './reel.js';
import { Mechanics } from './mechanics.js';
import { UI } from './ui.js';
import { Storage, GameData } from './data.js';

export const Game = {
  reels: [],
  coins: 50,
  bet: 1,
  spinning: false,

  async init() {
    UI.init();

    const savedCoins = Storage.load('sm_coins');
    if (savedCoins !== null) this.coins = savedCoins;
    UI.updateCoins(this.coins);
    UI.updateBet(this.bet);

    this.reels = [
      new Reel('reel-0', GameData.symbolConfig),
      new Reel('reel-1', GameData.symbolConfig),
      new Reel('reel-2', GameData.symbolConfig)
    ];

    window.addEventListener('resize', () => {
      this.reels.forEach(r => r.resize());
    });

    this.loop();
  },

  changeBet() {
    if (this.spinning) return;
    if (this.bet === 1) this.bet = 5;
    else if (this.bet === 5) this.bet = 10;
    else this.bet = 1;
    UI.updateBet(this.bet);
  },

  addDebugCoins() {
    this.coins += 50;
    this.saveState();
    UI.updateCoins(this.coins);
    UI.setSpinButtonState(false);
  },

  async spin() {
    if (this.spinning) return;
    if (this.coins < this.bet) {
      UI.showPopup("코인 부족");
      return;
    }

    this.spinning = true;
    UI.setSpinButtonState(true);

    this.coins -= this.bet;
    this.saveState();
    UI.updateCoins(this.coins);

    // [CRITICAL] 결과 선결정
    const results = Mechanics.determineResult();

    // 릴 스핀 시작 (빠른 딜레이)
    this.reels[0].spin(results[0].emoji);

    setTimeout(() => {
      this.reels[1].spin(results[1].emoji);
    }, 80);

    setTimeout(() => {
      this.reels[2].spin(results[2].emoji);
    }, 160);

    // 빠른 정지 타이밍
    setTimeout(() => this.reels[0].stop(), 350);
    setTimeout(() => this.reels[1].stop(), 550);

    setTimeout(() => {
      this.reels[2].stop();
      this.checkResultWhenStopped(results);
    }, 750);
  },

  checkResultWhenStopped(results) {
    const checkInterval = setInterval(() => {
      if (this.reels.every(r => r.state === 'IDLE')) {
        clearInterval(checkInterval);
        const payout = Mechanics.checkPayout(results, this.bet);

        if (payout.type === 'WIN') {
          this.coins += payout.amount;
          UI.playWinAnimation(payout.amount);
        } else if (payout.type === 'JACKPOT') {
          this.coins += payout.amount;
          UI.playJackpotAnimation(payout.amount);
        } else {
          UI.playLoseAnimation();
        }

        this.saveState();
        UI.updateCoins(this.coins);
        this.spinning = false;

        if (this.coins >= this.bet) {
          UI.setSpinButtonState(false);
        }
      }
    }, 100);
  },

  saveState() {
    Storage.save('sm_coins', this.coins);
  },

  loop() {
    requestAnimationFrame(() => this.loop());
    this.reels.forEach(r => r.update());
  }
};
