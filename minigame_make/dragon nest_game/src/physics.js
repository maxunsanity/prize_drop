import Matter from 'matter-js';
import * as L from './layout.js';

const { Engine, World, Bodies, Body, Events } = Matter;

let engine, world;
let ball = null;
let ballState = 'idle'; // idle | flying | done
let bumperHitTimes = {}; // id → timestamp (ms)
let onBumperHitCb = null;
let onSlotLandCb  = null;

export function initPhysics(onBumperHit, onSlotLand) {
  onBumperHitCb = onBumperHit;
  onSlotLandCb  = onSlotLand;

  engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
  world  = engine.world;

  buildStaticBodies();
  setupCollisionEvents();
}

function buildStaticBodies() {
  const T = L.WALL_T;

  // Ceiling (full width)
  add(Bodies.rectangle(L.CANVAS_W / 2, -T / 2, L.CANVAS_W + T * 2, T,
    { isStatic: true, label: 'wall', restitution: 0.4, friction: 0 }));

  // Left wall (full height)
  add(Bodies.rectangle(-T / 2, L.CANVAS_H / 2, T, L.CANVAS_H + T * 2,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0 }));

  // Right play-area wall (x=344), from y=25 down to y=545
  // Center x = RIGHT_WALL_X + T/2, height = 520, center y = (25+545)/2 = 285
  add(Bodies.rectangle(L.RIGHT_WALL_X + T / 2, 285, T, 520,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0 }));

  // Right outer wall (canvas right edge)
  add(Bodies.rectangle(L.CANVAS_W + T / 2, L.CANVAS_H / 2, T, L.CANVAS_H + T * 2,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0 }));

  // Spring channel guide — diagonal wall at top-right that redirects ball into play area
  // Line from (RIGHT_WALL_X=344, 0) to (CANVAS_W=390, 30)
  {
    const x1 = L.RIGHT_WALL_X, y1 = 0;
    const x2 = L.CANVAS_W,     y2 = 30;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    add(Bodies.rectangle(cx, cy, len, T,
      { isStatic: true, label: 'guide', restitution: 0.6, friction: 0, angle }));
  }

  // Angled floor guides — funnel ball into slot zone
  // Left:  from (0, 545) to (55, 600)
  // Right: from (RIGHT_WALL_X=344, 545) to (289, 600)
  const floorLen = Math.sqrt(55 ** 2 + 55 ** 2);
  add(Bodies.rectangle(27.5, 572.5, floorLen, T,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0.1, angle: Math.PI / 4 }));
  add(Bodies.rectangle(316.5, 572.5, floorLen, T,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0.1, angle: -Math.PI / 4 }));

  // Bumpers
  L.BUMPERS.forEach(b => {
    const body = Bodies.circle(b.x, b.y, L.BUMPER_R,
      { isStatic: true, restitution: 0.8, friction: 0, label: 'bumper_' + b.id });
    body.bumper_id = b.id;
    add(body);
  });

  // Pegs
  L.PEGS.forEach(p => {
    add(Bodies.circle(p.x, p.y, L.PEG_R,
      { isStatic: true, restitution: 0.4, friction: 0, label: 'peg' }));
  });

  // Slot sensors (isSensor = true, no physical collision)
  L.SLOT_CENTERS.forEach((cx, i) => {
    add(Bodies.rectangle(cx, L.SENSOR_Y, Math.floor(L.SLOT_W), L.SENSOR_H,
      { isStatic: true, isSensor: true, label: 'slot_' + (i + 1) }));
  });
}

function setupCollisionEvents() {
  Events.on(engine, 'collisionStart', event => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      const ballBody  = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
      if (!ballBody) continue;
      const other = ballBody === bodyA ? bodyB : bodyA;

      if (other.label?.startsWith('bumper_')) {
        const id = parseInt(other.label.split('_')[1]);
        bumperHitTimes[id] = performance.now();
        onBumperHitCb?.(id);
      }

      if (other.label?.startsWith('slot_')) {
        const id = parseInt(other.label.split('_')[1]);
        onSlotLandCb?.(id);
      }
    }
  });
}

function add(body) {
  World.add(world, body);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function launchBall(chargeRatio) {
  if (ball) removeBall();
  bumperHitTimes = {};

  const speed = L.MIN_SPEED + (L.MAX_SPEED - L.MIN_SPEED) * chargeRatio;
  const vx    = (Math.random() - 0.5) * 0.6;
  const vy    = -speed; // NEGATIVE = upward in Matter.js

  ball = Bodies.circle(L.LAUNCH_X, L.LAUNCH_Y, L.BALL_R, {
    label: 'ball',
    restitution:  0.6,
    friction:     0.01,
    frictionAir:  0.008,
    density:      0.003,
  });
  Body.setVelocity(ball, { x: vx, y: vy });
  World.add(world, ball);
  ballState = 'flying';

  return speed;
}

export function removeBall() {
  if (ball) { World.remove(world, ball); ball = null; }
  ballState = 'idle';
}

export function stepPhysics(delta) {
  if (ballState === 'idle') return;
  Engine.update(engine, delta);
}

export function getBallPos()       { return ball ? { x: ball.position.x, y: ball.position.y } : null; }
export function getBallState()     { return ballState; }
export function getBumperHitTimes(){ return bumperHitTimes; }
export function setBallStateDone() { ballState = 'done'; }
