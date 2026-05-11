/* src/data.js */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    if (!line.trim()) return null;
    const values = [];
    let inQuotes = false; let currentVal = '';
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(currentVal.trim()); currentVal = ''; }
      else currentVal += char;
    }
    values.push(currentVal.trim());
    const obj = {};
    headers.forEach((h, i) => {
      let val = values[i];
      if (!isNaN(val) && val !== '') val = Number(val);
      obj[h] = val;
    });
    return obj;
  }).filter(Boolean);
}

export const GameData = {
  stages: [],
  items: {},
  events: {},

  async loadData() {
    try {
      const [stageRes, itemRes, eventRes] = await Promise.all([
        fetch('/ht_stage_config.csv'),
        fetch('/ht_item_config.csv'),
        fetch('/ht_event_config.csv')
      ]);

      const stageText = await stageRes.text();
      const itemText = await itemRes.text();
      const eventText = await eventRes.text();

      this.stages = parseCSV(stageText);
      
      const itemRows = parseCSV(itemText);
      itemRows.forEach(row => {
        if (!this.items[row.item_id]) this.items[row.item_id] = [];
        this.items[row.item_id].push(row);
      });

      const eventRows = parseCSV(eventText);
      eventRows.forEach(row => {
        this.events[row.config_key] = row.value;
      });
    } catch (e) {
      console.error("Error loading CSV:", e);
    }
  },

  getStage(stageId) {
    return this.stages.find(s => s.stage_id === stageId);
  }
};

export const Storage = {
  save(key, Object) {
    localStorage.setItem(key, JSON.stringify(Object));
  },
  load(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  clear(key) {
    localStorage.removeItem(key);
  }
};
