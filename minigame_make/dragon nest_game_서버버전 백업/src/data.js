function parseCSVLine(line) {
  const vals = []; let cur = '', inQuote = false;
  for (const ch of line) {
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  vals.push(cur.trim());
  return vals;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      const v = vals[i] ?? '';
      obj[h] = v !== '' && !isNaN(v) ? Number(v) : v;
    });
    return obj;
  });
}

export async function loadAllData() {
  const [evText, slText, drText] = await Promise.all([
    fetch('/dn_event_config.csv').then(r => r.text()),
    fetch('/dn_slot_config.csv').then(r => r.text()),
    fetch('/dn_dragon_config.csv').then(r => r.text()),
  ]);

  const eventConfig = {};
  parseCSV(evText).forEach(r => { eventConfig[r.config_key] = r.value; });

  const slotConfig = parseCSV(slText);

  const dragonRows = parseCSV(drText);
  const dragonConfig = {};
  dragonRows.forEach(r => {
    if (!dragonConfig[r.dragon_id]) dragonConfig[r.dragon_id] = { name: r.dragon_name, stages: [] };
    dragonConfig[r.dragon_id].stages.push({ stage: r.stage, target: r.stage_target });
  });

  return { eventConfig, slotConfig, dragonConfig };
}

export function weightedRandom(slotConfig) {
  const total = slotConfig.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const row of slotConfig) { rand -= row.weight; if (rand <= 0) return row.slot_id; }
  return slotConfig.at(-1).slot_id;
}

export function savePlayerState(ps) { localStorage.setItem('dn_player_state', JSON.stringify(ps)); }
export function loadPlayerState(defaultBalls) {
  const raw = localStorage.getItem('dn_player_state');
  return raw ? JSON.parse(raw) : { ball_count: defaultBalls, selected_multiplier: 1, event_completed: false };
}

export function saveDragonState(id, ds) { localStorage.setItem(`dn_dragon_state_${id}`, JSON.stringify(ds)); }
export function loadDragonState(id) {
  const raw = localStorage.getItem(`dn_dragon_state_${id}`);
  return raw ? JSON.parse(raw) : { dragon_id: id, stage: 1, my_token: 0, partner_token: 0, completed: false };
}

export function clearAllStorage() {
  ['dn_player_state','dn_dragon_state_1','dn_dragon_state_2','dn_dragon_state_3','dn_dragon_state_4']
    .forEach(k => localStorage.removeItem(k));
}

export function startBotTimer(dragonStates, eventConfig, onContribute) {
  const minMs = eventConfig.bot_min_interval_ms ?? 30000;
  const maxMs = eventConfig.bot_max_interval_ms ?? 60000;
  const minTok = eventConfig.bot_min_token ?? 50;
  const maxTok = eventConfig.bot_max_token ?? 200;

  function schedule() {
    const delay = minMs + Math.random() * (maxMs - minMs);
    setTimeout(() => {
      const incomplete = Object.values(dragonStates).filter(d => !d.completed);
      if (!incomplete.length) return;
      const dragon = incomplete[Math.floor(Math.random() * incomplete.length)];
      const amount = Math.floor(minTok + Math.random() * (maxTok - minTok));
      onContribute(dragon.dragon_id, amount);
      schedule();
    }, delay);
  }
  schedule();
}
