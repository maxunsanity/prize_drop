import { Wheel } from './wheel.js';
import { UI } from './ui.js';
import { weightedRandom, applyReward } from './mechanics.js';
import { Storage } from './data.js';

export const Game = {
  wheel: null,
  tokens: 50,
  bet: 1,
  spinning: false,

  init(canvas, sections) {
    const saved = Storage.load();
    if (saved) {
      this.tokens = saved.tokens ?? 50;
      this.bet    = saved.bet    ?? 1;
    }

    this.wheel = new Wheel(canvas, sections);

    window.addEventListener('resize', () => {
      this.wheel.resize();
    });

    UI.updateTokens(this.tokens);
    UI.updateBet(this.bet);
    UI.setSpinEnabled(this.tokens >= this.bet);

    this.loop();
  },

  changeBet() {
    if (this.spinning) return;
    const bets = [1, 3, 5, 10];
    const idx = bets.indexOf(this.bet);
    this.bet = bets[(idx + 1) % bets.length];
    UI.updateBet(this.bet);
    UI.setSpinEnabled(this.tokens >= this.bet);
  },

  addTokens() {
    this.tokens += 50;
    Storage.save({ tokens: this.tokens, bet: this.bet });
    UI.updateTokens(this.tokens);
    UI.setSpinEnabled(this.tokens >= this.bet);
  },

  spin() {
    if (this.spinning || this.wheel.state !== 'IDLE') return;
    if (this.tokens < this.bet) {
      UI.showPopup('토큰 부족!', 'lose');
      return;
    }

    this.spinning = true;
    UI.setSpinEnabled(false);

    // 베팅 차감
    this.tokens -= this.bet;
    Storage.save({ tokens: this.tokens, bet: this.bet });
    UI.updateTokens(this.tokens);

    // [CRITICAL] 결과 선결정
    const resultSection = weightedRandom(this.wheel.sections);
    const targetIdx = this.wheel.sections.findIndex(s => s.id === resultSection.id);

    this.wheel.onStopped = () => this._onWheelStopped(resultSection);
    this.wheel.spin(targetIdx);
  },

  _onWheelStopped(resultSection) {
    // ANI-004: 포인터 진동
    UI.triggerPointerVibrate();
    // ANI-002: 당첨 섹션 하이라이트 0.3s fade-in
    this.wheel.highlight(resultSection.id);

    setTimeout(() => {
      const result = applyReward(resultSection, this.tokens, this.bet);
      this.tokens = result.tokens;
      Storage.save({ tokens: this.tokens, bet: this.bet });
      UI.updateTokens(this.tokens);

      if (result.type === 'JACKPOT') {
        // ANI-005: JACKPOT 순차 하이라이트
        UI.showJackpot(
          this.wheel.sections,
          this.wheel,
          resultSection.id,
          result.message
        );
      } else {
        UI.showPopup(result.message, result.type);
      }

      // 1.5초 후 IDLE 복귀
      setTimeout(() => {
        this.wheel.clearHighlight();
        this.wheel.resetToIdle();
        this.spinning = false;
        UI.setSpinEnabled(this.tokens >= this.bet);
      }, 1500);
    }, 500); // 0.5s 하이라이트 → 팝업
  },

  loop() {
    requestAnimationFrame(() => this.loop());
    if (this.wheel) this.wheel.update();
  }
};
