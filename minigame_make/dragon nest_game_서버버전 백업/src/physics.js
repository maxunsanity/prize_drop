import Matter from 'matter-js';
const { Engine, World, Bodies, Events, Body } = Matter;

export const WORLD_W = 390;
export const WORLD_H = 420;
export const BALL_R = 10;
const BUMPER_R = 22;
const PIN_R = 5;
export const SLOT_H = 52;
export const SLOT_ZONE_Y = WORLD_H - SLOT_H; // 368
const LERP_START_Y = WORLD_H * 0.80;         // 336
const SPRING_X = 355;   // launch x (right side, inside play field)
const SPRING_Y = 350;   // launch y (above slot zone at 368)

export const BUMPER_POSITIONS = [
  { id: 1, x: Math.round(0.38 * WORLD_W), y: Math.round(0.18 * WORLD_H) }, // 148, 76
  { id: 2, x: Math.round(0.22 * WORLD_W), y: Math.round(0.30 * WORLD_H) }, // 86, 126
  { id: 3, x: Math.round(0.58 * WORLD_W), y: Math.round(0.30 * WORLD_H) }, // 226, 126
  { id: 4, x: Math.round(0.10 * WORLD_W), y: Math.round(0.42 * WORLD_H) }, // 39, 176
  { id: 5, x: Math.round(0.38 * WORLD_W), y: Math.round(0.42 * WORLD_H) }, // 148, 176
  { id: 6, x: Math.round(0.66 * WORLD_W), y: Math.round(0.42 * WORLD_H) }, // 257, 176
  { id: 7, x: Math.round(0.38 * WORLD_W), y: Math.round(0.54 * WORLD_H) }, // 148, 227
];

export const PIN_POSITIONS = (() => {
  const pins = [];
  const xStart = 0.10, xEnd = 0.75;
  const step6 = (xEnd - xStart) / 5;

  // Row 1: y=0.62, 6 pins
  for (let i = 0; i < 6; i++) {
    pins.push({ x: Math.round((xStart + i * step6) * WORLD_W), y: Math.round(0.62 * WORLD_H) });
  }
  // Row 2: y=0.70, 5 pins offset by half-step
  const half = step6 / 2;
  const step5 = (xEnd - xStart - step6) / 4;
  for (let i = 0; i < 5; i++) {
    pins.push({ x: Math.round((xStart + half + i * step5) * WORLD_W), y: Math.round(0.70 * WORLD_H) });
  }
  // Row 3: y=0.78, 6 pins
  for (let i = 0; i < 6; i++) {
    pins.push({ x: Math.round((xStart + i * step6) * WORLD_W), y: Math.round(0.78 * WORLD_H) });
  }
  return pins;
})();

const SLOT_COUNT = 7;
const SLOT_W = WORLD_W / SLOT_COUNT;
export const SLOT_CENTERS = Array.from({ length: SLOT_COUNT }, (_, i) => (i + 0.5) * SLOT_W);

let engine, world, ball;
let ballState = 'idle'; // idle | flying | approaching | slot_done
let lerpTargetX = null;
let hasEnteredField = false; // true after ball first rises above LERP_START_Y
let onBumperHitCb = null;

export function initPhysics(onBumperHit) {
  onBumperHitCb = onBumperHit;
  engine = Engine.create({ gravity: { x: 0, y: 1.5 } });
  world = engine.world;

  const T = 20;
  World.add(world, [
    Bodies.rectangle(WORLD_W / 2, -T / 2, WORLD_W + T * 2, T, { isStatic: true, label: 'wall' }),
    Bodies.rectangle(-T / 2, WORLD_H / 2, T, WORLD_H + T * 2, { isStatic: true, label: 'wall' }),
    Bodies.rectangle(WORLD_W + T / 2, WORLD_H / 2, T, WORLD_H + T * 2, { isStatic: true, label: 'wall' }),
  ]);

  BUMPER_POSITIONS.forEach(b => {
    const body = Bodies.circle(b.x, b.y, BUMPER_R, {
      isStatic: true, restitution: 1.3, label: `bumper_${b.id}`,
    });
    body.bumper_id = b.id;
    World.add(world, body);
  });

  PIN_POSITIONS.forEach(p => {
    World.add(world, Bodies.circle(p.x, p.y, PIN_R, { isStatic: true, restitution: 0.7, label: 'pin' }));
  });

  // Slot dividers — only in the bottom slot zone
  for (let i = 1; i < SLOT_COUNT; i++) {
    const x = i * SLOT_W;
    World.add(world, Bodies.rectangle(x, WORLD_H - SLOT_H / 2, 3, SLOT_H, { isStatic: true, label: 'divider' }));
  }

  Events.on(engine, 'collisionStart', event => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      const isBall = bodyA.label === 'ball' || bodyB.label === 'ball';
      const bumper = bodyA.label?.startsWith('bumper_') ? bodyA
        : bodyB.label?.startsWith('bumper_') ? bodyB : null;
      if (isBall && bumper) onBumperHitCb?.(bumper.bumper_id);
    }
  });
}

export function launchBall(vx, vy, targetSlotIdx) {
  if (ball) { World.remove(world, ball); ball = null; }
  lerpTargetX = SLOT_CENTERS[targetSlotIdx];
  ballState = 'flying';
  hasEnteredField = false;

  ball = Bodies.circle(SPRING_X, SPRING_Y, BALL_R, {
    label: 'ball', restitution: 0.6, friction: 0.01, frictionAir: 0.007, density: 0.01,
  });
  Body.setVelocity(ball, { x: vx, y: vy });
  World.add(world, ball);
}

export function physicsStep(delta) {
  if (ballState === 'idle' || ballState === 'slot_done') return null;

  Engine.update(engine, delta);
  if (!ball) return null;

  const y = ball.position.y;

  // Track when ball first enters the main play field (rises above lerp zone)
  if (!hasEnteredField && y < LERP_START_Y) {
    hasEnteredField = true;
  }

  // Apply subtle lerp force when in bottom 20%
  if (lerpTargetX !== null && y >= LERP_START_Y) {
    Body.applyForce(ball, ball.position, {
      x: (lerpTargetX - ball.position.x) * 0.0008,
      y: 0,
    });
  }

  // Only check landing after ball has entered the play field at least once
  if (hasEnteredField) {
    if (y >= SLOT_ZONE_Y) {
      ballState = 'slot_done';
      return 'landed';
    }
    if (y > WORLD_H + 80) {
      ballState = 'slot_done';
      return 'landed';
    }
    if (ballState === 'flying' && y >= LERP_START_Y) {
      ballState = 'approaching';
    }
  }

  return null;
}

export function getBallPos() {
  return ball ? { x: ball.position.x, y: ball.position.y } : null;
}
export function getBallState() { return ballState; }

export function removeBall() {
  if (ball) { World.remove(world, ball); ball = null; }
  ballState = 'idle';
  lerpTargetX = null;
  hasEnteredField = false;
}
