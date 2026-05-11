---
identity:
  name: "Dragon Nest Pinball — Engine"
  file: "game_1.md"
  role: "Pure physics pinball — no pre-determination, no lerp correction. Real random outcomes."
  genre: [pinball, physics-simulation]
  platform: [web]
  players: 1
  pitch: "A faithful pinball simulation. Ball physics are fully deterministic given launch angle and speed. Outcome is genuinely random from the player's perspective. This file defines the engine only — no dragon progression, no multipliers, no event logic."

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — no game logic"
  files:
    src/main.js:    "entry — init Matter.js, load slot_config.csv, start pinball"
    src/physics.js: "Matter.js world setup — ball, bumpers, pins, walls, spring, slot sensors"
    src/layout.js:  "all coordinate constants derived from canvas size — single source of truth"
    src/input.js:   "spring drag interaction — touch and mouse"
    src/renderer.js:"custom Matter.js render overrides — Blank Paper Sketch visual style"
    src/ui.js:      "DOM overlays — score, ball counter, debug panel"
    src/data.js:    "CSV parsing, localStorage, round logging"
  data_files: [slot_config.csv]
  physics_engine: "Matter.js 0.19 (cdnjs)"

viewport:
  width_px: 390
  height_px: 844
  strategy: |
    Fixed 390×844px div centered on screen.
    All physics coordinates are absolute pixels within this viewport.
    Never scale, never make responsive.
  css: |
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #d0cdc8; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    #app {
      width: 390px; height: 844px;
      position: relative; overflow: hidden;
      background: #faf8f5;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }

layout:
  # All measurements in px, origin top-left of #app
  header:
    y: 0
    h: 56
    # contains: ball counter (right), round score (center), debug +10 btn (left)

  board_frame:
    x: 0
    y: 56
    w: 390
    h: 732
    # contains: partner gauge, stage gauge, canvas, multiplier row

  partner_gauge:
    x: 0
    y: 56
    w: 390
    h: 40
    # my_score LEFT | gauge bar CENTER | partner_score RIGHT

  stage_gauge:
    x: 10
    y: 96
    w: 340
    h: 32
    # progress bar with 2 checkpoint icons

  canvas:
    x: 0
    y: 128
    w: 390
    h: 600   # Matter.js renders here — FIXED

  multiplier_row:
    x: 0
    y: 728
    w: 390
    h: 116
    # x1 / x5 / x10 / x50 buttons + spring charge display

canvas_spec:
  # All physics objects defined in canvas-local coordinates (0,0 = canvas top-left)
  w: 390
  h: 600
  background_color: "#1a3a8a"   # deep blue board background
  border_color: "#C8A020"       # golden frame border
  border_thickness: 6

  ball:
    radius: 10
    color: "#cc44ff"            # purple ball (matches Royal Match style)
    border_color: "#ffffff"
    border_thickness: 2
    restitution: 0.6            # bounciness
    friction: 0.01
    frictionAir: 0.008
    density: 0.003

  spring:
    # Right-side vertical launcher
    track_x: 362                # center x of spring track
    track_y_top: 80             # top of travel
    track_y_bottom: 520         # bottom of travel (rest position)
    track_w: 8
    track_color: "#C8A020"
    indicator_w: 28
    indicator_h: 20
    indicator_color_idle: "#888888"
    indicator_color_charged: "#EF9F27"
    launch_x: 362               # ball spawns here
    launch_y: 490               # ball initial y position
    min_speed: 21               # px/frame at zero charge — minimum to reach diagonal guide at y=0-30
    max_speed: 35               # px/frame at full charge
    charge_per_px: 0.005        # charge_ratio += 0.005 per drag pixel
    # launch_speed = min_speed + (max_speed - min_speed) * charge_ratio
    # launch direction: always straight UP from spring (angle = 0°, vx = 0, vy = -speed)
    # player cannot steer — pure vertical launch, physics handles spread

  walls:
    thickness: 12
    color: "#C8A020"
    # left wall: x=0, y=0 to y=545 (top of slot zone)
    # right wall: x=344, y=0 to y=545 (leaves space for spring track x=344..390)
    # ceiling: x=0..390, y=0
    # angled floor guides (funnel into slots):
    #   left guide:  from (0, 545) angled to (55, 600)
    #   right guide: from (344, 545) angled to (289, 600)

  pegs:
    # Small triangular/circular deflectors — top section
    # Row 1 (y=100): 7 pegs at x = 30, 78, 126, 174, 222, 270, 318
    # Row 2 (y=130): 6 pegs at x = 54, 102, 150, 198, 246, 294  (offset)
    # Row 3 below bumpers (y=380): 8 pegs
    # Row 4 (y=420): 7 pegs (offset)
    # Row 5 (y=460): 8 pegs
    radius: 5
    color: "#C8A020"
    restitution: 0.4

  bumpers:
    count: 7
    radius: 32
    color_idle:   "#1a5a1a"     # dark green base
    color_ring:   "#C8A020"     # gold ring
    color_hit:    "#ffff00"     # yellow flash on hit
    label_color:  "#ffffff"
    label_font:   "bold 14px 'IBM Plex Mono'"
    token_value:  5             # matches screenshot (shows "5")
    restitution:  0.8           # very bouncy
    positions:
      # canvas-local coordinates
      - { id: 1, x: 185, y: 195 }   # top center
      - { id: 2, x: 115, y: 270 }   # mid left
      - { id: 3, x: 255, y: 270 }   # mid right
      - { id: 4, x:  65, y: 345 }   # far left
      - { id: 5, x: 185, y: 345 }   # center
      - { id: 6, x: 305, y: 345 }   # far right
      - { id: 7, x: 125, y: 420 }   # lower left
      # bumper 7 only goes to lower-left per screenshot layout

  slot_sensors:
    # Invisible Matter.js sensors at bottom — detect ball entry
    count: 7
    y: 575                      # sensor center y
    h: 20                       # sensor height
    # slot widths derived from (344 - 0) / 7 = ~49px each
    # slot center_x values: 25, 74, 123, 172, 221, 270, 319
    slot_centers: [25, 74, 123, 172, 221, 270, 319]
    slot_labels: ["x1", "x2", "x3", "x10", "x3", "x2", "x1"]
    slot_multipliers: [1, 2, 3, 10, 3, 2, 1]

  slots_visual:
    y: 548
    h: 52
    label_font: "bold 13px 'IBM Plex Mono'"
    color_normal: "#C8A020"     # gold
    color_active: "#ffffff"     # white text on active
    color_jackpot_bg: "#cc0000" # red bg for x10 (matches screenshot)
    border_color: "#8B6B00"
    separator_color: "#8B6B00"

components:
  player_state:
    ball_count:          { type: int, default: 10 }     # debug start
    selected_multiplier: { type: int, values: [1, 5, 10, 50], default: 1 }
    total_score:         { type: int, default: 0 }

  round_state:
    charge_ratio:    { type: float, range: [0, 1], default: 0 }
    bumper_hits:     { type: int, default: 0 }
    round_tokens:    { type: int, default: 0 }
    ball_in_play:    { type: bool, default: false }
    landed_slot:     { type: int, default: -1 }   # -1 = not yet landed

entities:
  player: { components: [player_state], states: [idle, charging, in_play] }
  round:  { components: [round_state] }

mechanics:
  turn_structure: realtime
  physics: "Matter.js — fully deterministic given same inputs. No pre-determination. No lerp."

  actions:

    charge_spring:
      actor: player
      description: "Player drags DOWN on spring area to charge"
      preconditions:
        - "player.state == idle"
        - "player.ball_count >= player.selected_multiplier"
      effects:
        - "charge_ratio += charge_per_px × drag_pixels (clamped 0..1)"
        - "update spring indicator fill height"
        - "indicator color: lerp(idle_color, charged_color, charge_ratio)"
        - "player.state = charging"

    launch:
      actor: player
      description: "Player releases spring — ball fires straight up, physics takes over"
      preconditions:
        - "player.state == charging"
      effects:
        - |
          Compute velocity (src/physics.js):
            launch_speed = min_speed + (max_speed - min_speed) × charge_ratio
            # Ball always launches straight up from spring track
            # vx has small random jitter ±0.3 for natural feel
            vx = random(-0.3, 0.3)
            vy = -launch_speed   # NEGATIVE = upward in Matter.js
            # NOTE: min_speed=21 is the minimum required for the ball to reach
            # the diagonal guide at y=0-30 (from launch_y=490, gravity.scale=0.001)
            Matter.Body.setPosition(ball, { x: launch_x, y: launch_y })
            Matter.Body.setVelocity(ball, { x: vx, y: vy })
        - "player.ball_count -= selected_multiplier"
        - "round_state.ball_in_play = true"
        - "round_state.charge_ratio = 0"
        - "player.state = in_play"
        - "play G1-ANI-001: spring snap animation"

    on_bumper_hit:
      actor: engine
      params:
        bumper_id: int
      preconditions:
        - "round_state.ball_in_play == true"
      effects:
        - "round_state.bumper_hits += 1"
        - "round_state.round_tokens += token_value (5)"
        - "play G1-ANI-002: bumper flash yellow, scale 1→1.4→1 (120ms), +5 float text"

    on_slot_land:
      actor: engine
      description: "Ball enters slot sensor — round ends"
      preconditions:
        - "ball overlaps slot_sensor"
      effects:
        - "landed_slot = sensor.slot_id"
        - "final_tokens = round_tokens × slot_multipliers[landed_slot] × selected_multiplier"
        - "player.total_score += final_tokens"
        - "round_state.ball_in_play = false"
        - "log_round(bumper_hits, landed_slot, final_tokens)"
        - "play G1-ANI-003: slot lights up, score popup"
        - "remove ball from world"
        - "reset round_state"
        - "player.state = idle"

    add_debug_balls:
      actor: player
      description: "Debug button — always visible in local mode"
      effects:
        - "player.ball_count += 10"
        - "update #ui-ball-counter"

  loops:
    - name: pinball_loop
      description: "Charge spring → release → ball travels freely through pegs and bumpers → lands in slot → score computed → round logged → ready for next launch."

  round_logging:
    # Every completed round writes one entry to round_log (src/data.js)
    schema:
      round_id:      int        # sequential
      launch_speed:  float      # actual speed used
      charge_ratio:  float      # 0..1
      bumper_hits:   int        # 0..7
      bumper_sequence: array    # [bumper_ids in order hit]
      landed_slot:   int        # 1..7
      slot_label:    string     # "x1".."x10"
      round_tokens:  int        # before multiplier
      final_tokens:  int        # after all multipliers
      timestamp:     int        # ms since game start
    storage: "localStorage key: g1_round_log (JSON array, append-only)"

goals:
  win:
    - condition: "none — engine only, no win condition"

---

## Design Pillars

**Pure physics** — No pre-determination, no lerp correction, no weighted random. The ball goes where physics takes it. This is the ground truth engine. game_2 uses this to generate real outcome data.
**Blank Paper Sketch** — `#faf8f5` app background, golden frame, deep blue board interior. Bumpers are dark green with gold rings. Matches Royal Match Dragon Nest aesthetic interpreted in sketch style.
**Fixed viewport** — 390×844px absolute. Physics coordinates are pixel-exact. Any scaling breaks collision detection.
**Round logging** — Every round is logged to localStorage. This data feeds game_2 simulation.

## Mechanics in Depth

### Physics Setup (src/physics.js)
```javascript
const engine = Matter.Engine.create({ gravity: { y: 1.2 } });
// gravity 1.2 = slightly stronger than default (1.0)
// makes ball fall faster, feels more decisive

// Ball properties
const ball = Matter.Bodies.circle(launch_x, launch_y, 10, {
  restitution: 0.6,
  friction: 0.01,
  frictionAir: 0.008,
  density: 0.003,
  label: 'ball'
});

// Bumper properties — high restitution = bouncy
const bumper = Matter.Bodies.circle(x, y, 32, {
  isStatic: true,
  restitution: 0.8,
  label: 'bumper_' + id
});

// Peg properties
const peg = Matter.Bodies.circle(x, y, 5, {
  isStatic: true,
  restitution: 0.4,
  label: 'peg'
});

// Slot sensors — isSensor = no physical collision, just detection
const sensor = Matter.Bodies.rectangle(cx, 575, 49, 20, {
  isStatic: true,
  isSensor: true,
  label: 'slot_' + id
});
```

### Launch Direction
```javascript
// Ball ALWAYS launches straight up from spring track
// Small random jitter prevents identical trajectories
const launch_speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * charge_ratio;
const vx = (Math.random() - 0.5) * 0.6;  // ±0.3 jitter
const vy = -launch_speed;                  // NEGATIVE = UP in Matter.js
Matter.Body.setVelocity(ball, { x: vx, y: vy });
```

### Slot Detection
```javascript
Matter.Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;
    const ball = [bodyA, bodyB].find(b => b.label === 'ball');
    const sensor = [bodyA, bodyB].find(b => b.label?.startsWith('slot_'));
    if (ball && sensor) {
      const slot_id = parseInt(sensor.label.split('_')[1]);
      on_slot_land(slot_id);
    }
    const bumper = [bodyA, bodyB].find(b => b.label?.startsWith('bumper_'));
    if (ball && bumper) {
      const bumper_id = parseInt(bumper.label.split('_')[1]);
      on_bumper_hit(bumper_id);
    }
  }
});
```

### Multiplier Buttons
```
┌──────────┬──────────┬──────────┬──────────┐
│    x1    │    x5    │   x10    │   x50    │
│  1구슬   │  5구슬   │  10구슬  │  50구슬  │
└──────────┴──────────┴──────────┴──────────┘
Active: black bg #222, white text
Inactive: paper bg #faf8f5, ink text #222
Unavailable: gray #aaa, no interaction
Full width = 390px, each button = 97.5px wide
Height = 72px
```

### Spring Visual
```
Right side of board at x=356..390 (34px wide strip)
Track line at x=370, y=80..520
Indicator: 28×20px rounded rect
  - Rests at y=490 (bottom)
  - Drags up to y=80 (full charge)
  - Fill color lerps idle→orange as charge increases
Arrow chevrons (▲▲▲) on right wall indicate spring zone
```

### Debug Panel
```
Top-left corner of header:
[+10 🔵] button — adds 10 balls
[RESET] button — clears localStorage, reloads
Always visible — no toggle needed in local mode
```

## Content Guidelines
**Tuning gravity** — Edit `engine.gravity.y` in src/physics.js. Higher = faster fall, less spread. Lower = floatier, more spread.
**Tuning bumper bounciness** — Edit bumper `restitution` (0..1). 0.8 is current. Above 0.9 causes erratic behavior.
**Tuning ball air friction** — Edit `frictionAir`. Lower = ball travels farther. Current 0.008.
**Adding pegs** — Add to peg rows in src/layout.js. Match normalized positions pattern.

## Anti-Patterns
**[CRITICAL] vy positive on launch** — Matter.js Y increases downward. Ball must go UP so `vy` must be NEGATIVE. Positive vy fires ball into the floor instantly.
**[CRITICAL] min_speed must be >= 21** — Matter.js uses gravity.scale=0.001 by default. With gravity.y=1.2 and launch_y=490, the ball needs speed >= 21 px/frame to reach the diagonal guide at y=0-30. Values below 21 trap the ball in the spring channel.
**[CRITICAL] Responsive viewport** — 390×844 fixed only. Scaling breaks all physics coordinates.
**[CRITICAL] Pre-determining slot result** — game_1 is pure physics. No weighted_random, no lerp correction. If you need pre-determined outcomes, use game_3.
**Using BoxGeometry for bumpers** — Bumpers must be `Bodies.circle`. Boxes cause unnatural deflections.
**Slot detection via position check** — Use Matter.js sensor collision events only. Position polling misses fast balls.
**Not logging rounds** — Every round MUST be logged to g1_round_log. game_2 depends on this data.
**Removing debug panel** — Keep `#debug-add-balls` always visible. Without it, testing is impossible.
