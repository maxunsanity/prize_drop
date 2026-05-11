const CSV_PATH = '/roulette_section_config.csv';

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const sections = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 6) continue;

    sections.push({
      id:           parts[0].trim(),
      label:        parts[1].trim(),
      weight:       parseInt(parts[2].trim(), 10),
      reward_type:  parts[3].trim(),
      reward_value: parseFloat(parts[4].trim()),
      color:        parts[5].trim()
    });
  }
  return sections;
}

export async function loadSectionConfig() {
  try {
    const res = await fetch(CSV_PATH);
    if (!res.ok) throw new Error(`CSV ${res.status}`);
    return parseCSV(await res.text());
  } catch (e) {
    console.warn('CSV 로드 실패, 기본값 사용:', e);
    return [
      { id: 's1', label: '🍒 10',      weight: 25, reward_type: 'COINS',      reward_value: 10,  color: '#ffffff' },
      { id: 's2', label: '✨ BONUS',   weight: 5,  reward_type: 'BONUS',      reward_value: 0,   color: '#f5c842' },
      { id: 's3', label: '🍒 20',      weight: 20, reward_type: 'COINS',      reward_value: 20,  color: '#f0ede8' },
      { id: 's4', label: '💔 EMPTY',   weight: 20, reward_type: 'EMPTY',      reward_value: 0,   color: '#ffffff' },
      { id: 's5', label: '🍒 50',      weight: 10, reward_type: 'COINS',      reward_value: 50,  color: '#f0ede8' },
      { id: 's6', label: '💔 EMPTY',   weight: 15, reward_type: 'EMPTY',      reward_value: 0,   color: '#ffffff' },
      { id: 's7', label: '🍒 100',     weight: 4,  reward_type: 'COINS',      reward_value: 100, color: '#f0ede8' },
      { id: 's8', label: '🎰 JACKPOT', weight: 1,  reward_type: 'MULTIPLIER', reward_value: 10,  color: '#f5c842' },
    ];
  }
}

export const Storage = {
  save(state) {
    localStorage.setItem('roulette_tokens', JSON.stringify(state));
  },
  load() {
    const data = localStorage.getItem('roulette_tokens');
    return data ? JSON.parse(data) : null;
  }
};
