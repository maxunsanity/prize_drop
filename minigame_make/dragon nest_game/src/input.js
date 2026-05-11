import * as L from './layout.js';

// Spring drag state
let dragging    = false;
let dragStartY  = 0;
let chargeRatio = 0;
let onLaunchCb  = null;
let canLaunchFn = null;

// Spring hit zone — canvas-relative coords, scaled to CSS pixels
const SPRING_ZONE_X1 = L.RIGHT_WALL_X;   // 344
const SPRING_ZONE_X2 = L.CANVAS_W;       // 390
const SPRING_ZONE_Y1 = L.SPRING_Y_TOP;   // 80
const SPRING_ZONE_Y2 = L.CANVAS_H;       // 600

export function getChargeRatio() { return chargeRatio; }

export function initInput(canvasEl, onLaunch, canLaunch) {
  onLaunchCb  = onLaunch;
  canLaunchFn = canLaunch;

  canvasEl.addEventListener('mousedown',  e => handleStart(e.offsetX, e.offsetY));
  canvasEl.addEventListener('mousemove',  e => handleMove(e.offsetY));
  canvasEl.addEventListener('mouseup',    () => handleRelease());
  canvasEl.addEventListener('mouseleave', () => handleRelease());

  canvasEl.addEventListener('touchstart', e => {
    const r = canvasEl.getBoundingClientRect();
    const t = e.touches[0];
    handleStart(t.clientX - r.left, t.clientY - r.top);
    e.preventDefault();
  }, { passive: false });

  canvasEl.addEventListener('touchmove', e => {
    handleMove(e.touches[0].clientY - canvasEl.getBoundingClientRect().top);
    e.preventDefault();
  }, { passive: false });

  canvasEl.addEventListener('touchend', () => handleRelease());
}

function inSpringZone(x, y) {
  return x >= SPRING_ZONE_X1 && x <= SPRING_ZONE_X2
      && y >= SPRING_ZONE_Y1 && y <= SPRING_ZONE_Y2;
}

function handleStart(x, y) {
  if (!canLaunchFn?.()) return;
  if (!inSpringZone(x, y)) return;
  dragging   = true;
  dragStartY = y;
  chargeRatio = 0;
}

function handleMove(y) {
  if (!dragging) return;
  const dy = y - dragStartY;
  if (dy < 0) { chargeRatio = 0; return; } // upward drag = no charge
  chargeRatio = Math.min(dy * L.CHARGE_PER_PX, 1);
}

function handleRelease() {
  if (!dragging) return;
  dragging = false;
  if (chargeRatio > 0.02) {
    const ratio = chargeRatio;
    chargeRatio = 0;
    onLaunchCb?.(ratio);
  } else {
    chargeRatio = 0;
  }
}
