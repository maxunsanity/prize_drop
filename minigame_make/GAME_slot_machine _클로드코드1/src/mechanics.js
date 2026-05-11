import { GameData } from './data.js';

export const Mechanics = {
  weightedRandom() {
    const config     = GameData.symbolConfig;
    const totalWeight = config.reduce((sum, s) => sum + s.weight, 0);
    let rnd = Math.random() * totalWeight;
    for (const sym of config) {
      rnd -= sym.weight;
      if (rnd <= 0) return sym;
    }
    return config[config.length - 1];
  },

  determineResult() {
    return [this.weightedRandom(), this.weightedRandom(), this.weightedRandom()];
  },

  checkPayout(results, bet) {
    const [s0, s1, s2] = results;

    // JACKPOT: 3 wilds
    if (s0.symbol_id === 'wild' && s1.symbol_id === 'wild' && s2.symbol_id === 'wild') {
      return { type: 'JACKPOT', amount: bet * 50 };
    }

    // WIN: all same (wild substitutes any)
    for (const sym of GameData.symbolConfig) {
      if (sym.symbol_id === 'wild') continue;
      const match = results.every(s => s.symbol_id === sym.symbol_id || s.symbol_id === 'wild');
      if (match) return { type: 'WIN', amount: bet * sym.payout_multiplier };
    }

    // SPECIAL: 2 cherries (first two are cherry or wild)
    const isCherryOrWild = (s) => s.symbol_id === 'cherry' || s.symbol_id === 'wild';
    if (isCherryOrWild(s0) && isCherryOrWild(s1)) {
      return { type: 'WIN', amount: bet * 1 }; // Return bet amount
    }

    return { type: 'LOSE', amount: 0 };
  },
};
