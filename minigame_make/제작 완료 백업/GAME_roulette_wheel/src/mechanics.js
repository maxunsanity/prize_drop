export function weightedRandom(sections) {
  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
  const rand = Math.random() * totalWeight;
  let accum = 0;
  for (const sec of sections) {
    accum += sec.weight;
    if (rand < accum) return sec;
  }
  return sections[sections.length - 1];
}

// 보상 판정 — 순수 함수, 토큰 뮤테이션 없음
export function applyReward(section, currentTokens, bet) {
  switch (section.reward_type) {
    case 'COINS':
      return {
        tokens: currentTokens + section.reward_value,
        message: `+${section.reward_value} 토큰!`,
        type: 'COINS'
      };
    case 'BONUS': {
      const gain = bet * 2;
      return {
        tokens: currentTokens + gain,
        message: `보너스! +${gain} 토큰`,
        type: 'BONUS'
      };
    }
    case 'MULTIPLIER': {
      const newTokens = Math.round(currentTokens * section.reward_value);
      return {
        tokens: newTokens,
        message: `🎰 JACKPOT! ×${section.reward_value}배!`,
        type: 'JACKPOT'
      };
    }
    case 'EMPTY':
      return {
        tokens: currentTokens,
        message: '꽝...',
        type: 'EMPTY'
      };
    default:
      return { tokens: currentTokens, message: '', type: 'DEFAULT' };
  }
}
