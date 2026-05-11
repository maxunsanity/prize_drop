// All coordinates are canvas-local (origin = canvas top-left)
// Single source of truth — do not hard-code coordinates elsewhere

export const APP_W = 390;
export const APP_H = 844;

export const HEADER_H      = 56;   // ball counter, score, debug buttons
export const PARTNER_H     = 40;   // partner gauge row
export const STAGE_H       = 32;   // stage gauge row
export const CANVAS_Y      = HEADER_H + PARTNER_H + STAGE_H; // 128
export const CANVAS_W      = 390;
export const CANVAS_H      = 600;
export const MULT_ROW_Y    = CANVAS_Y + CANVAS_H; // 728
export const MULT_ROW_H    = 116;

// Canvas-local physics constants
export const WALL_T        = 12;   // wall thickness
export const RIGHT_WALL_X  = 344;  // left face of right play-area wall
export const SPRING_X      = 362;  // spring track center x (in spring channel)
export const SPRING_Y_TOP  = 80;
export const SPRING_Y_BOT  = 520;
export const LAUNCH_X      = 362;
export const LAUNCH_Y      = 490;
export const MIN_SPEED     = 21;
export const MAX_SPEED     = 35;
export const CHARGE_PER_PX = 0.005;

export const BALL_R        = 10;
export const BUMPER_R      = 32;
export const PEG_R         = 5;

export const SLOT_ZONE_Y   = 548;  // top of slot visual
export const SENSOR_Y      = 575;  // slot sensor center y
export const SENSOR_H      = 20;
export const SLOT_COUNT    = 7;

// Slot centers x (canvas-local) — mirrors slot_config.csv center_x
export const SLOT_CENTERS     = [25, 74, 123, 172, 221, 270, 319];
export const SLOT_MULTIPLIERS = [1, 2, 3, 10, 3, 2, 1];
export const SLOT_LABELS      = ['x1', 'x2', 'x3', 'x10', 'x3', 'x2', 'x1'];
// Slot widths: play area is 0..344 / 7 slots = ~49px each
export const SLOT_W = RIGHT_WALL_X / SLOT_COUNT; // ~49.1

// Bumper positions (canvas-local)
export const BUMPERS = [
  { id: 1, x: 185, y: 195 },
  { id: 2, x: 115, y: 270 },
  { id: 3, x: 255, y: 270 },
  { id: 4, x:  65, y: 345 },
  { id: 5, x: 185, y: 345 },
  { id: 6, x: 305, y: 345 },
  { id: 7, x: 125, y: 420 },
];

// Peg rows (canvas-local)
export const PEGS = [
  // Row 1 y=100: 7 pegs
  ...Array.from({ length: 7 }, (_, i) => ({ x: 30 + i * 46, y: 100 })),
  // Row 2 y=130: 6 pegs (offset by half-step)
  ...Array.from({ length: 6 }, (_, i) => ({ x: 53 + i * 46, y: 130 })),
  // Row 3 y=380: 7 pegs
  ...Array.from({ length: 7 }, (_, i) => ({ x: 22 + i * 44, y: 380 })),
  // Row 4 y=420: 6 pegs (offset)
  ...Array.from({ length: 6 }, (_, i) => ({ x: 44 + i * 44, y: 420 })),
  // Row 5 y=460: 7 pegs
  ...Array.from({ length: 7 }, (_, i) => ({ x: 22 + i * 44, y: 460 })),
];

// Colors
export const COLOR = {
  boardBg:     '#1a3a8a',
  frame:       '#C8A020',
  ball:        '#cc44ff',
  ballBorder:  '#ffffff',
  bumperBase:  '#1a5a1a',
  bumperRing:  '#C8A020',
  bumperHit:   '#ffff00',
  bumperLabel: '#ffffff',
  peg:         '#C8A020',
  slotNormal:  '#C8A020',
  slotActive:  '#ffffff',
  jackpotBg:   '#cc0000',
  separator:   '#8B6B00',
  springTrack: '#C8A020',
  springIdle:  '#888888',
  springChg:   '#EF9F27',
  wall:        '#C8A020',
};
