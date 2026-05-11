// CSV 파싱 및 localStorage 관리

function parseCSVLine(line) {
  const vals = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  vals.push(cur.trim());
  return vals;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] ?? '');
    return obj;
  });
}

export async function loadAllData() {
  const [eventText, itemText, stageText] = await Promise.all([
    fetch('/ht_event_config.csv').then(r => r.text()),
    fetch('/ht_item_config.csv').then(r => r.text()),
    fetch('/ht_stage_config.csv').then(r => r.text()),
  ]);

  const eventRows = parseCSV(eventText);
  const eventConfig = {};
  eventRows.forEach(r => {
    const v = r.value;
    eventConfig[r.config_key] = r.type === 'int' ? parseInt(v) : r.type === 'float' ? parseFloat(v) : v;
  });

  const itemRows = parseCSV(itemText);
  const itemConfig = {};
  itemRows.forEach(r => {
    const id = parseInt(r.item_id);
    if (!itemConfig[id]) itemConfig[id] = { ...r, tiles: [] };
    itemConfig[id].tiles.push({ tile_index: parseInt(r.tile_index), offset_row: parseInt(r.offset_row), offset_col: parseInt(r.offset_col) });
    itemConfig[id].tile_count = parseInt(r.tile_count);
    itemConfig[id].reward_type = r.reward_type;
    itemConfig[id].reward_amount = parseInt(r.reward_amount);
  });

  const stageRows = parseCSV(stageText);
  const stageConfig = {};
  stageRows.forEach(r => {
    const colTypes = [], rowTypes = [];
    for (let i = 1; i <= 10; i++) { colTypes.push(r[`col_${i}`] || 'NULL'); rowTypes.push(r[`row_${i}`] || 'NULL'); }
    const itemIds = r.item_ids ? r.item_ids.split(',').map(x => parseInt(x.trim())).filter(Boolean) : [];
    stageConfig[parseInt(r.stage_id)] = {
      stage_id: parseInt(r.stage_id), stage_name: r.stage_name,
      col_types: colTypes, row_types: rowTypes,
      gem_count: parseInt(r.gem_count), item_count: parseInt(r.item_count),
      item_ids: itemIds, empty_reward_ratio: parseFloat(r.empty_reward_ratio),
      approx_box_tiles: parseInt(r.approx_box_tiles),
    };
  });

  return { eventConfig, itemConfig, stageConfig };
}

export function savePlayerState(ps) {
  localStorage.setItem('ht_player_state', JSON.stringify(ps));
}

export function loadPlayerState(defaultPickaxe) {
  const raw = localStorage.getItem('ht_player_state');
  if (raw) return JSON.parse(raw);
  return { pickaxe_count: defaultPickaxe, stage: 1, gems_collected: 0, active_items: [], event_completed: false };
}

export function saveBoardState(stage, tiles) {
  localStorage.setItem(`ht_board_state_stage_${stage}`, JSON.stringify(tiles));
}

export function loadBoardState(stage) {
  const raw = localStorage.getItem(`ht_board_state_stage_${stage}`);
  return raw ? JSON.parse(raw) : null;
}

export function clearAllStorage() {
  Object.keys(localStorage).filter(k => k.startsWith('ht_')).forEach(k => localStorage.removeItem(k));
}
