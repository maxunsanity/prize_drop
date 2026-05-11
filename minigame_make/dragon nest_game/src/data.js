// CSV parsing, localStorage, round logging

function parseCSV(text) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => {
      const v = (vals[i] ?? '').trim();
      obj[h]  = v !== '' && !isNaN(v) ? Number(v) : v;
    });
    return obj;
  });
}

export async function loadSlotConfig() {
  const text = await fetch('/slot_config.csv').then(r => r.text());
  return parseCSV(text);
}

// ─── LocalStorage ─────────────────────────────────────────────────────────────

const LS_PLAYER  = 'g1_player';
const LS_ROUNDS  = 'g1_round_log';

export function loadPlayerState(debugBalls = 10) {
  const raw = localStorage.getItem(LS_PLAYER);
  return raw ? JSON.parse(raw) : {
    ball_count:          debugBalls,
    selected_multiplier: 1,
    total_score:         0,
  };
}

export function savePlayerState(ps) {
  localStorage.setItem(LS_PLAYER, JSON.stringify(ps));
}

export function clearStorage() {
  localStorage.removeItem(LS_PLAYER);
  localStorage.removeItem(LS_ROUNDS);
}

// ─── Round Logging ────────────────────────────────────────────────────────────

let _roundLog    = [];
let _startTime   = performance.now();
let _roundId     = 0;

export function initRoundLog() {
  const raw = localStorage.getItem(LS_ROUNDS);
  _roundLog  = raw ? JSON.parse(raw) : [];
  _roundId   = _roundLog.length;
  _startTime = performance.now();
}

export function logRound({ launchSpeed, chargeRatio, bumperHits, bumperSequence, landedSlot, slotLabel, roundTokens, finalTokens }) {
  _roundId++;
  const entry = {
    round_id:        _roundId,
    launch_speed:    launchSpeed,
    charge_ratio:    chargeRatio,
    bumper_hits:     bumperHits,
    bumper_sequence: bumperSequence,
    landed_slot:     landedSlot,
    slot_label:      slotLabel,
    round_tokens:    roundTokens,
    final_tokens:    finalTokens,
    timestamp:       Math.round(performance.now() - _startTime),
  };
  _roundLog.push(entry);
  localStorage.setItem(LS_ROUNDS, JSON.stringify(_roundLog));
  return entry;
}

export function getRoundCount() { return _roundId; }
