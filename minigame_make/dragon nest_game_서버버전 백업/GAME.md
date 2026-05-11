---
identity:
  name: "Dragon Nest"
  genre: [casual, event-minigame, pinball, cooperative]
  platform: [mobile-ios, mobile-android, web]
  players: 2  # async co-op — simultaneous connection not required
  pitch: "Launch balls down a pinball board, hit bumpers to earn tokens, land in multiplier slots, and fill four dragons' gauges with your partner to claim the Grand Prize."

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — no game logic"
  files:
    src/main.js:      "entry — load CSVs, init state, show lobby or pinball screen"
    src/physics.js:   "Matter.js init, ball body, bumper bodies, pin bodies, wall bodies, spring launcher"
    src/board.js:     "board layout constants, slot zone detection, bumper hit callback, lerp correction"
    src/mechanics.js: "launch(), on_bumper_hit(), on_slot_land(), dragon_gauge_update(), stage_advance(), grand_prize()"
    src/ui.js:        "all DOM updates, DN-ANI series, lobby render, dragon visuals, multiplier buttons"
    src/data.js:      "CSV parsing, weighted_random(), localStorage, bot simulation"
  data_files: [dn_event_config.csv, dn_slot_config.csv, dn_dragon_config.csv]  # must be in public/ directory
  physics_engine: "Matter.js (cdnjs.cloudflare.com)"

viewport:
  # FIXED — do not make responsive
  width_px: 390
  height_px: 844
  strategy: "center fixed 390×844 div on screen, overflow hidden, background #faf8f5"
  css: |
    #app {
      width: 390px;
      height: 844px;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      overflow: hidden;
      background: #faf8f5;
    }

layout:
  # Two screens — lobby and pinball — never shown simultaneously
  lobby:
    header_h: 60px       # title + timer + close button
    grand_prize_h: 80px  # prize chest + label
    partner_row_h: 90px  # 4 partner avatar slots
    dragon_area_h: flex  # 4 dragons on pedestals, fills remaining space
    ball_counter_h: 54px # bottom ball counter

  pinball:
    header_h: 56px       # ← lobby / dragon name+stage / ball counter
    partner_gauge_h: 36px # my name+score LEFT | gauge bar CENTER | partner name+score RIGHT
    stage_gauge_h: 28px  # stage progress bar (checkpoint markers)
    board_h: 420px       # Matter.js canvas — FIXED HEIGHT
    multiplier_row_h: 72px # x1/x5/x10/x50 buttons + spring button
    # board_w = 390px (full width)

board:
  # Matter.js canvas exact spec
  canvas_w: 390
  canvas_h: 420
  background: "#faf8f5"  # paper white — Blank Paper Sketch theme

  # Spring launcher — RIGHT SIDE, click-to-fire button (HTML UI, not canvas)
  spring:
    x: 355              # fixed x position (right side, inside spring channel x=350..390)
    y_top: 80           # top of travel range (visual only)
    y_bottom: 350       # launch y — ball spawns here; must be < LERP_START_Y after first step
    indicator_w: 14px
    indicator_h: 38px
    track_w: 4px
    color_idle: "#222222"
    color_charged: "#EF9F27"
    interaction: "single tap/click on spring-btn div; fires at fixed charge_ratio=0.6"
    launch_x: 355       # ball always launches from this x (SPRING_X in physics.js)
    # charge_ratio = 0.6  (fixed — drag mechanic is NOT implemented)
    # launch_speed = 22 + chargeRatio * 8  →  lerp(22, 30); at ratio=0.6 → speed=26.8
    # launch angle derived from target_slot (see mechanics)

  bumpers:
    count: 7
    radius: 22px          # physics BUMPER_R=22; draws 22px normal, 26px on hit
    color_idle:   "#ffffff"
    color_hit:    "#ffe082"  # light orange flash on hit (not #EF9F27)
    border:       "2px solid #222222"
    label_font:   "IBM Plex Mono 11px bold #222222"
    # label shows token_value (10)
    positions:    # normalized 0..1 of canvas_w × canvas_h
      - { id: 1, nx: 0.38, ny: 0.18 }  # top center
      - { id: 2, nx: 0.22, ny: 0.30 }  # mid-left
      - { id: 3, nx: 0.58, ny: 0.30 }  # mid-right
      - { id: 4, nx: 0.10, ny: 0.42 }  # far left
      - { id: 5, nx: 0.38, ny: 0.42 }  # center
      - { id: 6, nx: 0.66, ny: 0.42 }  # right
      - { id: 7, nx: 0.38, ny: 0.54 }  # lower center

  pins:
    radius: 5px
    color: "#222222"
    # 3 rows of staggered pins below bumpers
    # row1: y=0.62, 6 pins evenly spaced x=0.10..0.75
    # row2: y=0.70, 5 pins offset by half spacing
    # row3: y=0.78, 6 pins evenly spaced

  walls:
    color: "#222222"
    thickness: 3px
    left_x: 0
    right_x: 390   # right wall stops at spring track (x=356)
    # angled floor guides ball into slot zone
    floor_angle_left:  15deg   # left floor angled inward
    floor_angle_right: 15deg   # right floor angled inward

  slots:
    count: 7
    h: 52px
    label_font: "IBM Plex Mono 13px bold"
    color_normal:  "#e8e4dc"
    color_active:  "#EF9F27"  # lights up on ball land
    color_jackpot: "#222222"  # x10 slot dark bg, white text
    border: "1px solid #222222"
    layout: "[ x1 | x2 | x3 | x10 | x3 | x2 | x1 ]  equal width, full board width"

  ball:
    radius: 10px
    color: "#EF9F27"
    border: "2px solid #222222"

components:
  player_state:
    ball_count:          { type: int, default: 6 }
    selected_multiplier: { type: int, values: [1, 5, 10, 50], default: 1 }
    active_dragon_id:    { type: int, range: [1, 4], default: 1 }
    event_completed:     { type: bool, default: false }

  dragon_state:
    dragon_id:       { type: int, range: [1, 4] }
    stage:           { type: int, range: [1, 3], default: 1 }
    my_token:        { type: int, default: 0 }
    partner_token:   { type: int, default: 0 }
    completed:       { type: bool, default: false }

  round_state:
    target_slot:     { type: int, default: 0 }    # decided BEFORE launch
    launch_angle:    { type: float, default: 0 }   # derived from target_slot
    launch_speed:    { type: float, default: 0 }   # from spring charge
    bumper_hits:     { type: int, default: 0 }
    round_tokens:    { type: int, default: 0 }
    lerp_active:     { type: bool, default: false }
    ball_in_play:    { type: bool, default: false }

  slot:
    id:         { type: int, range: [1, 7] }
    multiplier: { type: int }
    weight:     { type: int }
    angle_min:  { type: float }   # degrees — negative = left
    angle_max:  { type: float }

entities:
  player:   { components: [player_state], states: [lobby, playing, ball_empty, event_done] }
  dragons:  { components: [dragon_state], count: 4 }
  slots:    { components: [slot], count: 7 }
  round:    { components: [round_state], count: 1 }

mechanics:
  turn_structure: realtime
  data_source: local

  actions:

    select_multiplier:
      actor: player
      preconditions:
        - "player.ball_count >= multiplier"
      effects:
        - "player.selected_multiplier = multiplier"
        - "highlight active multiplier button"
        - "dim unavailable multiplier buttons where ball_count < multiplier"

    launch:
      actor: player
      description: "Player releases spring after charging — result pre-determined before physics"
      preconditions:
        - "player.ball_count >= player.selected_multiplier"
        - "round_state.ball_in_play == false"
      effects:
        - |
          Step 1 — Pre-determine result (src/data.js):
            target_slot = weighted_random(dn_slot_config)
            slot_row = dn_slot_config[target_slot]
            launch_angle_deg = random(slot_row.angle_min, slot_row.angle_max)
            launch_angle_rad = launch_angle_deg × (π / 180)
            store in round_state
        - "player.ball_count -= player.selected_multiplier"
        - "update #ui-ball-counter immediately"
        - |
          Step 2 — Fire ball (src/physics.js):
            # CORRECT velocity direction — up is negative Y in Matter.js
            speed = 22 + chargeRatio * 8   # lerp(22, 30); at ratio=0.6 → 26.8
            vx = sin(launch_angle_rad) × speed
            vy = -cos(launch_angle_rad) × speed  # negative = upward
            # ball spawns at (SPRING_X=355, SPRING_Y=350) — inside spring channel
            Matter.Body.setVelocity(ball, { x: vx, y: vy })
            round_state.ball_in_play = true
            # hasEnteredField guard: ball must first rise above y=336 (LERP_START_Y)
            # before slot landing (y>=368) can be detected — prevents false trigger at spawn
        - "play DN-ANI-001"

    on_bumper_hit:
      actor: client
      params:
        bumper_id: int
      preconditions:
        - "round_state.ball_in_play == true"
        - "round_state.bumper_hits < bumper_gauge_max"
      effects:
        - "round_state.bumper_hits += 1"
        - "round_state.round_tokens += token_value (10)"
        - "play DN-ANI-002: bumper scale 1→1.3→1 (100ms), orange fill, +10 float text"
        - "if bumper_hits == bumper_gauge_max: round_tokens += bumper_bonus_token; play DN-ANI-003"

    on_slot_approach:
      actor: client
      description: "Ball enters bottom 20% of board — apply subtle Lerp force toward target slot"
      preconditions:
        - "ball.position.y >= canvas_h × 0.80"
        - "round_state.lerp_active == false"
      effects:
        - |
          Lerp correction (src/board.js):
            target_x = slot[target_slot].center_x
            every physics frame: Matter.Body.applyForce(ball, ball.position, {
              x: (target_x - ball.position.x) × 0.0008,  # subtle, not a snap
              y: 0
            })
            round_state.lerp_active = true
        # NEVER use Body.setPosition or Body.setVelocity for correction
        # NEVER snap — force only

    on_slot_land:
      actor: client
      preconditions:
        - "ball enters slot sensor zone at bottom"
      effects:
        - "round_state.ball_in_play = false"
        - "round_state.lerp_active = false"
        - "final_tokens = round_tokens × slot[target_slot].multiplier × selected_multiplier"
        - "play DN-ANI-004: slot lights up orange, multiplier text animates in"
        - "Matter.World.remove(ball)"
        - "trigger dragon_gauge_update(active_dragon_id, final_tokens)"
        - "reset round_state for next launch"

    dragon_gauge_update:
      actor: client
      params:
        dragon_id: int
        tokens: int
      effects:
        - "dragon.my_token += tokens"
        - "play DN-ANI-005: +N token text flies from board center → gauge bar"
        - "re-render gauge: orange(my) + blue(partner) + gray(remaining)"
        - "if my_token + partner_token >= stage_target: stage_advance(dragon_id)"

    bot_contribute:
      actor: client
      description: "Irregular async bot — simulates partner offline contribution"
      effects:
        - "schedule via recursive setTimeout (NOT setInterval)"
        - "interval = random(bot_min_interval_ms, bot_max_interval_ms)"
        - "amount = random(bot_min_token, bot_max_token)"
        - "target = random incomplete dragon"
        - "dragon.partner_token += amount"
        - "play DN-ANI-006: blue gauge fills 800ms ease-in-out"
        - "check stage_advance(dragon.id)"

    stage_advance:
      actor: client
      preconditions:
        - "dragon.my_token + dragon.partner_token >= stage_target"
      effects:
        - "dragon.stage += 1"
        - "play DN-ANI-007: dragon transforms, particle burst"
        - "show #stage-reward-modal — player tap required to continue"
        - "reset dragon gauge tokens to 0"
        - "load next stage_target from dn_dragon_config"
        - "if dragon.stage > 3: dragon.completed = true; check grand_prize()"

    grand_prize:
      actor: client
      preconditions:
        - "dragons.every(d => d.completed == true)"
      effects:
        - "play DN-ANI-009: 4 dragons flame → chest opens 3s"
        - "show #grand-prize-modal"
        - "player.event_completed = true"
        - "save to localStorage"

    reset_game:
      actor: player
      effects:
        - "clear all localStorage keys prefixed dn_"
        - "reload window"

  loops:
    - name: pinball_loop
      description: "Spring charge → release → result pre-determined → ball fires at derived angle → bumpers hit → Lerp near bottom → slot land → tokens → gauge update."
    - name: dragon_loop
      description: "my_token + bot_token fills gauge → stage_advance → transform → 3 stages → completed."
    - name: grand_prize_loop
      description: "All 4 dragons completed → grand_prize()."
    - name: refill_loop
      description: "ball_count == 0 → show refill prompt. State always persisted."

goals:
  win:
    - condition: "player.event_completed == true"
  loss:
    - condition: "event timer expires with event_completed == false"

---

## Design Pillars

**Blank Paper Sketch** — `#faf8f5` background, `#222222` ink, `box-shadow: 2px 2px 0 #222` solid shadow only. No gradients, no blur, no 3D textures. Board, bumpers, pins all drawn as ink outlines on paper. Dragon illustrations are ink-line style with flat color fills.
**Physics feels real, result is fixed** — Matter.js simulation runs at full fidelity. Player feels genuine randomness. Lerp correction near bottom is invisible — force-based, never a snap. Player must never sense pre-determination.
**Fixed viewport, no responsive** — 390×844px fixed, centered on screen. Pinball physics depends on fixed coordinates. Responsive scaling breaks bumper positions and slot detection.
**Async co-op warmth** — Bot arrives irregularly. Blue gauge growing while idle creates positive surprise.
**Escalating spectacle** — DN-ANI-009 is the event climax. 4 dragons firing simultaneously must feel earned after 10 days.

## Mechanics in Depth

### Result Pre-Determination
```
launch() called
  ↓
weighted_random(dn_slot_config) → target_slot = 3
  ↓
launch_angle = random(slot[3].angle_min, slot[3].angle_max) = random(-12, -4) → -8.3°
  ↓
vx = sin(-8.3° in rad) × speed = -0.144 × speed   ← LEFT bias
vy = -cos(-8.3° in rad) × speed = -0.990 × speed  ← UPWARD (negative Y)
  ↓
Matter.js fires ball — physics runs freely
  ↓
Ball enters bottom 20% → Lerp force toward slot[3].center_x
  ↓
Ball lands in slot 3 → x3 confirmed
```

### Velocity Direction (CRITICAL — common mistake)
```javascript
// Matter.js coordinate: Y increases DOWNWARD
// Ball must launch UPWARD → vy must be NEGATIVE
// Angle 0° = straight up, positive angle = right, negative = left

const rad = launch_angle_deg * (Math.PI / 180);
const vx =  Math.sin(rad) * launch_speed;   // negative deg → negative x → LEFT
const vy = -Math.cos(rad) * launch_speed;   // always negative → UPWARD
Matter.Body.setVelocity(ball, { x: vx, y: vy });
```

### Spring Launcher
```
Right side of board at x=370
Player drags DOWN to charge (charge_ratio = drag_px / 200, clamped 0..1)
launch_speed = lerp(8, 18, charge_ratio)
Visual: thermometer-style fill indicator
Color: idle=#222 → charging=#EF9F27 (orange fill rises as charge increases)
On release: fire ball immediately
```

### Token Calculation
```javascript
final_tokens = round_tokens × slot_multiplier × selected_multiplier

// round_tokens max = (7 bumpers × 10) + 10 bonus = 80
// slot_multiplier: 1/2/3/10
// selected_multiplier: 1/5/10/50
// absolute max = 80 × 10 × 50 = 40,000 tokens
```

### Multiplier Buttons UI
```
┌──────────┬──────────┬──────────┬──────────┬────────────┐
│    x1    │    x5    │   x10    │   x50    │  🌡️ FIRE   │
│  1구슬   │  5구슬   │  10구슬  │  50구슬  │ (spring)   │
└──────────┴──────────┴──────────┴──────────┴────────────┘
- Active: solid black bg, white text
- Inactive: paper bg, ink text
- Unavailable (not enough balls): gray text, no border
- Spring button: rightmost, taller, shows charge level
- Debug button: "+10 🔵" small button top-right corner (local mode only)
```

### Dragon Gauge Bar
```
┌─────────────────────────────────────────────────────┐
│ [나 avatar] 5480  [████████▓▓▓░░░░░░░░░]  0 Korea   │
└─────────────────────────────────────────────────────┘
orange ████ = my_token portion
blue   ▓▓▓▓ = partner_token portion  
gray   ░░░░ = remaining to stage_target

checkpoint markers at 33% and 66% = intermediate reward icons
```

### Stage Gauge Bar (above board)
```
[🥚] ──●──────────────── [🎁] ──────── [💎chest]
      current progress    mid reward    final reward
```
3 markers: stage start, mid-reward (50%), stage complete.

### Lobby Screen Layout
```
┌─────────────────────────────────────┐  ← 390px
│  [i]    드래곤 둥지    [X]           │  header
│  🎁 Grand Prize!  [4일 9시간]        │  prize
│ [P1 aaaa✓] [P2 aaaa✓] [P3 +] [P4+] │  partners
│                                     │
│  🐲       🐲       🐲       🐲      │
│ (stage2) (stage1) (egg)   (stage3) │  dragons on pedestals
│                                     │
│          🏆 (Grand Prize chest)     │  center pedestal
│                                     │
│           🔵 227                   │  ball counter
└─────────────────────────────────────┘
```

### DOM Elements
| ID | Role |
|---|---|
| `#lobby-screen` | Full lobby — hidden when pinball active |
| `#pinball-screen` | Full pinball — hidden when lobby active |
| `#ui-ball-counter` | Ball count display (both screens) |
| `#ui-multiplier-btns` | x1/x5/x10/x50 row + spring button |
| `#ui-spring` | Charge indicator overlay on spring button |
| `#ui-dragon-header` | Dragon name + stage above board |
| `#ui-partner-gauge` | Orange/blue/gray gauge + both player scores |
| `#ui-stage-gauge` | Stage progress bar with checkpoints |
| `#canvas-pinball` | Matter.js canvas 390×420 |
| `#stage-reward-modal` | Stage reward popup — tap required |
| `#grand-prize-modal` | Grand Prize screen |
| `#debug-add-balls` | "+10 🔵" button — local debug only, top-right |
| `#reset-btn` | reset_game() |

### Animation Specifications
| ID | Trigger | Spec |
|---|---|---|
| DN-ANI-001 | launch | Spring snaps, ball fires upward — 200ms spring release anim |
| DN-ANI-002 | bumper hit | Bumper: scale 1→1.4→1 (150ms), fill orange, `+10` float text rises and fades |
| DN-ANI-003 | all 7 bumpers hit | All bumpers glow simultaneously, `+10 BONUS!` center popup, 500ms |
| DN-ANI-004 | slot land | Slot fill orange 300ms, multiplier text scale 0→1.2→1, hold 800ms |
| DN-ANI-005 | gauge update | `+N 🔵` text flies from board center → gauge bar, 600ms arc |
| DN-ANI-006 | bot contribute | Blue segment of gauge expands smoothly, 800ms ease-in-out |
| DN-ANI-007 | stage advance | Dragon image swaps to next stage, particle burst, screen flash |
| DN-ANI-008 | dragon completed | Dragon does idle celebration animation on lobby pedestal |
| DN-ANI-009 | grand prize | All 4 dragons breathe fire in sequence (0.5s apart) → chest glows → opens, total 3s |

### LocalStorage Schema
```
dn_player_state      → { ball_count, selected_multiplier, active_dragon_id, event_completed }
dn_dragon_state_1    → { stage, my_token, partner_token, completed }
dn_dragon_state_2    → { stage, my_token, partner_token, completed }
dn_dragon_state_3    → { stage, my_token, partner_token, completed }
dn_dragon_state_4    → { stage, my_token, partner_token, completed }
```

## Content Guidelines
**Slot weight tuning** — Weights must sum to 1000. Jackpot (x10) weight ≤ 10.
**Angle range tuning** — Wider `angle_min/max` = more natural physics variation. Never overlap adjacent slot ranges.
**Dragon stage targets** — All 4 dragons use identical targets for balance fairness.
**Bot timing** — Keep `bot_min_interval` ≥ 30s. Too fast breaks the "offline discovery" feeling.

## Anti-Patterns
**[CRITICAL] CSV를 public/ 외부에만 배치** — Vite는 public/ 디렉토리를 루트(/)로 서빙. data.js의 fetch('/dn_*.csv')는 public/에서 읽음. 프로젝트 루트의 CSV는 참조용이며 실제 서빙되지 않음.
**[CRITICAL] dn_slot_config.csv에 angle_min/angle_max 누락** — 두 컬럼이 없으면 발사 속도가 NaN이 되어 공이 즉시 사라짐. 반드시 포함할 것.
**[CRITICAL] index.html에 게임 로직** — src/ 하위만. 단일 파일 금지.
**[CRITICAL] vy 양수로 발사** — Matter.js Y축은 아래가 양수. 공이 위로 가려면 반드시 `vy = -cos(angle) × speed`. vy 양수 설정 시 공이 즉시 바닥으로 떨어짐.
**[CRITICAL] 물리로 슬롯 결정** — 슬롯 결과는 weighted_random() 선결정. 물리 충돌로 결과 변경 금지.
**[CRITICAL] Body.setPosition/setVelocity로 Lerp** — 보정은 반드시 `Body.applyForce()`만. 순간이동 금지.
**[CRITICAL] setInterval 고정 봇** — 봇은 반드시 재귀 setTimeout + random interval.
**반응형 레이아웃** — 390×844 고정. 반응형 시도 금지. 보드 좌표가 깨짐.
**배율 버튼 텍스트만** — 배율 버튼은 반드시 배율 + 구슬 소모량 함께 표시.
**stage_advance 자동 진행** — 보상 팝업 + 플레이어 탭 필수.
**DN-ANI-009 생략** — Grand Prize 연출 생략 불가.
**디버그 버튼 미구현** — 로컬 모드에서 `#debug-add-balls` (+10구슬) 버튼 반드시 구현. 없으면 테스트 불가.
