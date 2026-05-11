import { GameData } from './data.js';

export const Mechanics = {
  weightedRandom() {
    const config = GameData.symbolConfig;
    const totalWeight = config.reduce((acc, curr) => acc + curr.weight, 0);
    let rnd = Math.random() * totalWeight;
    for (let i = 0; i < config.length; i++) {
      rnd -= config[i].weight;
      if (rnd <= 0) return config[i];
    }
    return config[config.length - 1];
  },

  determineResult() {
    const roll = Math.random();

    if (roll < 0.15) {
      // 15% 확률: 3개 완전 매칭 (잭팟 포함)
      const sym = this.weightedRandom();
      return [sym, sym, sym];
    } else if (roll < 0.65) {
      // 50% 확률: 2개 매칭 (wild 포함 가능)
      const sym = this.weightedRandom();
      const other = this.weightedRandom();
      const pos = Math.floor(Math.random() * 3);
      const result = [sym, sym, sym];
      result[pos] = other;
      return result;
    } else {
      // 35% 확률: 완전 랜덤
      return [
        this.weightedRandom(),
        this.weightedRandom(),
        this.weightedRandom()
      ];
    }
  },

  checkPayout(results, bet) {
    const [s1, s2, s3] = results;

    if (s1.symbol_id === 'wild' && s2.symbol_id === 'wild' && s3.symbol_id === 'wild') {
      return { type: 'JACKPOT', amount: bet * 50 };
    }

    const checkMatch = (targetId) => {
      return results.every(s => s.symbol_id === targetId || s.symbol_id === 'wild');
    };

    let matchedSymbol = null;

    for (let i = 0; i < GameData.symbolConfig.length; i++) {
      const sym = GameData.symbolConfig[i];
      if (sym.symbol_id !== 'wild' && checkMatch(sym.symbol_id)) {
        matchedSymbol = sym;
        break;
      }
    }

    if (matchedSymbol) {
      return { type: 'WIN', amount: bet * matchedSymbol.payout_multiplier };
    }

    return { type: 'LOSE', amount: 0 };
  }
};
