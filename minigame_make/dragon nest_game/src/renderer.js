import * as L from './layout.js';

const BUMPER_HIT_DURATION = 150; // ms

export function drawFrame(ctx, { ballPos, bumperHitTimes, chargeRatio, highlightSlot, roundTokens }) {
  const now = performance.now();

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = L.COLOR.boardBg;
  ctx.fillRect(0, 0, L.CANVAS_W, L.CANVAS_H);

  // Spring channel background (right strip, darker)
  ctx.fillStyle = '#122a6a';
  ctx.fillRect(L.RIGHT_WALL_X, 0, L.CANVAS_W - L.RIGHT_WALL_X, L.SLOT_ZONE_Y);

  // ── Golden frame border ─────────────────────────────────────────────────────
  ctx.strokeStyle = L.COLOR.frame;
  ctx.lineWidth = L.WALL_T;
  ctx.strokeRect(L.WALL_T / 2, L.WALL_T / 2, L.CANVAS_W - L.WALL_T, L.CANVAS_H - L.WALL_T);

  // ── Slot zone ───────────────────────────────────────────────────────────────
  drawSlots(ctx, highlightSlot);

  // ── Pegs ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = L.COLOR.peg;
  L.PEGS.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, L.PEG_R, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── Bumpers ─────────────────────────────────────────────────────────────────
  L.BUMPERS.forEach(b => {
    const hitAge = now - (bumperHitTimes[b.id] || 0);
    const isHit  = hitAge < BUMPER_HIT_DURATION;
    const scale  = isHit ? 1 + 0.4 * Math.max(0, 1 - hitAge / BUMPER_HIT_DURATION) : 1;
    const r      = L.BUMPER_R * scale;

    // Base (dark green)
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fillStyle = isHit ? L.COLOR.bumperHit : L.COLOR.bumperBase;
    ctx.fill();

    // Gold ring
    ctx.strokeStyle = L.COLOR.bumperRing;
    ctx.lineWidth   = 4;
    ctx.stroke();

    // Label
    ctx.fillStyle  = isHit ? '#222' : L.COLOR.bumperLabel;
    ctx.font       = "bold 14px 'IBM Plex Mono', monospace";
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', b.x, b.y);
  });

  // ── Spring indicator ────────────────────────────────────────────────────────
  drawSpring(ctx, chargeRatio);

  // ── Ball ────────────────────────────────────────────────────────────────────
  if (ballPos) {
    ctx.beginPath();
    ctx.arc(ballPos.x, ballPos.y, L.BALL_R, 0, Math.PI * 2);
    ctx.fillStyle   = L.COLOR.ball;
    ctx.fill();
    ctx.strokeStyle = L.COLOR.ballBorder;
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  // ── Round token counter (top of board) ─────────────────────────────────────
  if (roundTokens > 0) {
    ctx.fillStyle = '#fff';
    ctx.font      = "bold 12px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`+${roundTokens}`, 172, 16);
  }
}

function drawSlots(ctx, highlightSlot) {
  const y = L.SLOT_ZONE_Y;
  const h = L.CANVAS_H - y;      // 52px
  const w = L.SLOT_W;

  for (let i = 0; i < L.SLOT_COUNT; i++) {
    const x    = i * w;
    const mult = L.SLOT_MULTIPLIERS[i];
    const isJp = mult === 10;
    const isHl = highlightSlot === i + 1;

    // Background
    if (isHl) {
      ctx.fillStyle = '#ffffff';
    } else if (isJp) {
      ctx.fillStyle = L.COLOR.jackpotBg;
    } else {
      ctx.fillStyle = '#0e2562';
    }
    ctx.fillRect(x, y, w, h);

    // Label
    ctx.fillStyle    = isHl ? '#222' : L.COLOR.slotNormal;
    ctx.font         = "bold 13px 'IBM Plex Mono', monospace";
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(L.SLOT_LABELS[i], x + w / 2, y + h / 2);

    // Separator
    if (i > 0) {
      ctx.strokeStyle = L.COLOR.separator;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    }
  }

  // Top border of slot zone
  ctx.strokeStyle = L.COLOR.frame;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(L.RIGHT_WALL_X, y);
  ctx.stroke();
}

function drawSpring(ctx, chargeRatio) {
  const tx = L.SPRING_X;
  const ty_top = L.SPRING_Y_TOP;
  const ty_bot = L.SPRING_Y_BOT;

  // Track line
  ctx.strokeStyle = L.COLOR.springTrack;
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.moveTo(tx, ty_top);
  ctx.lineTo(tx, ty_bot);
  ctx.stroke();

  // Arrow chevrons (▲) indicating drag direction
  ctx.fillStyle  = '#aaa';
  ctx.font       = '11px monospace';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  [ty_bot - 20, ty_bot - 34, ty_bot - 48].forEach(ay => {
    ctx.fillText('▲', tx, ay);
  });

  // Indicator block
  const indH  = 20;
  const indW  = 28;
  const indY  = ty_bot - chargeRatio * (ty_bot - ty_top) - indH / 2;
  const color = chargeRatio < 0.01
    ? L.COLOR.springIdle
    : lerpColor(L.COLOR.springIdle, L.COLOR.springChg, chargeRatio);

  ctx.fillStyle   = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.5;
  roundRect(ctx, tx - indW / 2, indY, indW, indH, 4);
  ctx.fill();
  ctx.stroke();

  // FIRE label below track
  ctx.fillStyle    = '#ccc';
  ctx.font         = "bold 10px monospace";
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FIRE', tx, ty_bot + 6);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lerpColor(a, b, t) {
  const ah = a.replace('#',''), bh = b.replace('#','');
  const ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab2 = parseInt(ah.slice(4,6),16);
  const br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb  = parseInt(bh.slice(4,6),16);
  const r = Math.round(ar + (br-ar)*t);
  const g = Math.round(ag + (bg-ag)*t);
  const b2= Math.round(ab2+ (bb-ab2)*t);
  return `rgb(${r},${g},${b2})`;
}
