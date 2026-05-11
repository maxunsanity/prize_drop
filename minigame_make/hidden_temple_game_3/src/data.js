export function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') i++; // skip \n
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  if (currentRow.length > 0 || currentVal !== '') {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }

  const headers = rows[0];
  return rows.slice(1).filter(r => r.length > 1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = row[i] ? row[i].trim() : '';
    });
    return obj;
  });
}

import stageCsv from '../ht_stage_config.csv?raw';
import itemCsv from '../ht_item_config.csv?raw';
import eventCsv from '../ht_event_config.csv?raw';

export const Data = {
  stages: parseCSV(stageCsv),
  items: parseCSV(itemCsv),
  events: parseCSV(eventCsv),
  
  getStage(stageId) {
    return this.stages.find(s => parseInt(s.stage_id) === stageId);
  },
  
  getItemConfig(itemId) {
    return this.items.filter(i => parseInt(i.item_id) === itemId);
  },

  getEventConfig(key) {
    const row = this.events.find(e => e.config_key === key);
    if (!row) return null;
    return row.type === 'int' ? parseInt(row.value) : parseFloat(row.value);
  }
};

export const StateManager = {
  load() {
    const saved = localStorage.getItem('ht_player_state');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  },
  save(state) {
    localStorage.setItem('ht_player_state', JSON.stringify(state));
  },
  reset() {
    localStorage.removeItem('ht_player_state');
  }
};
