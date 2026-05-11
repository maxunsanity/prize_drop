import { WORLD_W, WORLD_H, BUMPER_POSITIONS, PIN_POSITIONS, SLOT_CENTERS, BALL_R, SLOT_H, SLOT_ZONE_Y } from './physics.js';

export const SLOT_MULTIPLIERS = [1, 2, 3, 10, 3, 2, 1];
const SLOT_COUNT = 7;
const SLOT_W = WORLD_W / SLOT_COUNT;

// bumperHitMap: { bumperId: hitTimestamp }
export function drawFrame(ctx, { bumperHitMap, bumperHitCount, ballPos, ballState, highlightSlot }) {
  // Background
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Spring channel area (right side, x=350..390)
  ctx.fillStyle = '#f0ede6';
  ctx.fillRect(350, 0, 40, SLOT_ZONE_Y);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(350, 0); ctx.lineTo(350, SLOT_ZONE_Y); ctx.stroke();

  // Board outline
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(1, 1, WORLD_W - 2, WORLD_H - 2);

  // Bumper hit gauge (thin bar at top)
  const gx = 20, gy = 8, gw = 300, gh = 8;
  ctx.fillStyle = '#ddd';
  ctx.fillRect(gx, gy, gw, gh);
  const filled = Math.min(bumperHitCount / 7, 1);
  ctx.fillStyle = bumperHitCount >= 7 ? '#f5c518' : '#EF9F27';
  ctx.fillRect(gx, gy, gw * filled, gh);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
  ctx.strokeRect(gx, gy, gw, gh);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${bumperHitCount}/7`, gx + gw / 2, gy + gh / 2);

  // Slot zone background
  ctx.fillStyle = '#eceae3';
  ctx.fillRect(0, SLOT_ZONE_Y, WORLD_W, SLOT_H);

  // Highlighted slot
  if (highlightSlot !== null && highlightSlot >= 0) {
    ctx.fillStyle = 'rgba(239,159,39,0.45)';
    ctx.fillRect(highlightSlot * SLOT_W, SLOT_ZONE_Y, SLOT_W, SLOT_H);
  }

  // Slot dividers
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
  for (let i = 1; i < SLOT_COUNT; i++) {
    const x = i * SLOT_W;
    ctx.beginPath(); ctx.moveTo(x, SLOT_ZONE_Y); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }

  // Slot labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const labelY = SLOT_ZONE_Y + SLOT_H / 2;
  SLOT_MULTIPLIERS.forEach((mult, i) => {
    const cx = (i + 0.5) * SLOT_W;
    ctx.fillStyle = mult === 10 ? '#c00' : '#222';
    ctx.font = `bold 13px monospace`;
    ctx.fillText(`x${mult}`, cx, labelY);
  });

  // Pins
  PIN_POSITIONS.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#222'; ctx.fill();
  });

  // Bumpers
  const now = performance.now();
  BUMPER_POSITIONS.forEach(b => {
    const hitTime = bumperHitMap[b.id] || 0;
    const isHit = now - hitTime < 200;
    const r = isHit ? 26 : 22;

    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fillStyle = isHit ? '#ffe082' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('10', b.x, b.y);
  });

  // Ball
  if (ballPos && ballState !== 'idle') {
    ctx.beginPath();
    ctx.arc(ballPos.x, ballPos.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#EF9F27'; ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.stroke();
  }
}
