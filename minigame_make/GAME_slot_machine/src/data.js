export const GameData = {
  symbolConfig: [],

  async loadData() {
    try {
      const res = await fetch('/sm_symbol_config.csv');
      const text = await res.text();
      this.symbolConfig = this.parseCSV(text);
    } catch (e) {
      console.error("Error loading CSV:", e);
    }
  },

  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        let val = values[i];
        if (!isNaN(val) && val !== '') val = Number(val);
        obj[h] = val;
      });
      return obj;
    }).filter(Boolean);
  }
};

export const Storage = {
  save(key, val) {
    localStorage.setItem(key, val);
  },
  load(key) {
    const data = localStorage.getItem(key);
    return data ? Number(data) : null;
  }
};
