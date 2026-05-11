// CSV parsing (quote-aware) + localStorage

function parseLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

export function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''));
  if (!lines.length) return [];
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] ?? '').trim();
      obj[h] = (v !== '' && !isNaN(+v)) ? Number(v) : v;
    });
    return obj;
  });
}

const LS_KEY = 'ht_player_state';

export function loadState() {
  try {
    const r = localStorage.getItem(LS_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

export function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export function clearState() {
  localStorage.removeItem(LS_KEY);
}
