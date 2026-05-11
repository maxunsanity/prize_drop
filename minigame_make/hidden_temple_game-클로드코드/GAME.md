---
identity:
  name: "Hidden Temple"
  genre: [casual, event-minigame, exploration]
  platform: [mobile-ios, mobile-android, web]
  players: 1
  pitch: "Spend pickaxes to break flat 2D tiles in a top-down view, find all hidden multi-tile artifacts across five stages, and claim the All-Star reward before the event expires."

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — no game logic"
  files:
    src/main.js:      "entry — load CSVs, call resume() or generate_board(1)"
    src/game.js:      "Three.js init, OrthographicCamera, render loop, camera shake"
    src/board.js:     "generate_board(), tile geometry creation, render rules"
    src/mechanics.js: "dig(), item_collect(), check_stage_clear(), stage_clear()"
    src/ui.js:        "DOM updates, HT-ANI animations, custom cursor"
    src/data.js:      "CSV parsing, localStorage read/write"
  data_files: [ht_stage_config.csv, ht_item_config.csv, ht_event_config.csv]

components:
  position:
    col: { type: int, range: [1, 10] }
    row: { type: int, range: [1, 10] }

  tile_slot:
    col_type:  { type: enum, values: [NULL, BLOCK, BOX] }
    row_type:  { type: enum, values: [NULL, BLOCK, BOX] }
    final_type: { type: enum, values: [NULL, BLOCK, BOX] }
    content:   { type: enum, values: [GEM, ITEM, EMPTY_REWARD, EMPTY], default: EMPTY }
    item_instance_id: { type: int, default: 0 }
    state: { type: enum, values: [hidden, revealed], default: hidden }

  player_state:
    pickaxe_count:   { type: int, default: 50 }
    stage:           { type: int, range: [1, 5], default: 1 }
    gems_collected:  { type: int, default: 0 }
    active_items:    { type: array, default: [] }
    event_completed: { type: bool, default: false }

  item_slot_state:
    item_id:     { type: int }
    instance_id: { type: int }
    filled:      { type: bool, default: false }

entities:
  player:     { components: [player_state], states: [active, pickaxe_empty, event_done] }
  board:      { components: [tile_slot, position], count: 100 }
  item_slots: { components: [item_slot_state], count: 3 }

mechanics:
  turn_structure: realtime
  data_source: local

  actions:
    dig:
      actor: player
      params:
        tile: board
      preconditions:
        - "player.pickaxe_count > 0"
        - "tile.final_type == BOX"
        - "tile.state == hidden"
        - "player.event_completed == false"
      effects:
        - "player.pickaxe_count -= 1"
        - "tile.state = revealed"
        - "play HT-ANI-001, HT-ANI-002"
        - "if tile.content == GEM: player.gems_collected += 1; play HT-ANI-006"
        - "if tile.content == ITEM: if all tiles sharing item_instance_id revealed → item_collect(item_instance_id)"
        - "if tile.content == EMPTY_REWARD: grant small reward; play HT-ANI-006"
        - "if player.pickaxe_count == 0: state = pickaxe_empty"

    item_collect:
      actor: client
      params:
        item_instance_id: int
      preconditions:
        - "all tiles with this item_instance_id are revealed"
      effects:
        - "play HT-ANI-003: wait 0.5s at item center"
        - "play HT-ANI-004: item flies to matching slot"
        - "active_items[instance_id].filled = true"
        - "if item reward_type == pickaxe: player.pickaxe_count += reward_amount"
        - "check_stage_clear()"

    check_stage_clear:
      actor: client
      preconditions:
        - "player.active_items.every(item => item.filled == true)"
      effects:
        - "stage_clear()"

    stage_clear:
      actor: client
      effects:
        - "lock board input"
        - "play HT-ANI-005: items fly to door → door transforms"
        - "show #stage-clear-modal — requires player tap to continue"
        - "player.stage += 1"
        - "player.gems_collected = 0"
        - "player.active_items = []"
        - "save player_state to localStorage"
        - "generate_board(player.stage)"
        - "if player.stage > 5: event_completed = true"

    generate_board:
      actor: client
      params:
        stage_id: int
      preconditions:
        - "BOX cell count >= total item tiles + gem_count"
      effects:
        - "compute final_type per cell from col_type × row_type rules"
        - "place items from stage_config.item_ids only — retry up to generate_retry_limit"
        - "place gem_count GEM tiles in remaining BOX cells"
        - "place floor(remaining * empty_reward_ratio) EMPTY_REWARD tiles"
        - "save board_state to localStorage"
        - "render board; initialize item_slots from stage_config.item_ids"

    reset_game:
      actor: player
      effects:
        - "clear localStorage (ht_player_state, ht_board_state_stage_*)"
        - "reload window"

    resume:
      actor: client
      preconditions:
        - "localStorage ht_board_state_stage_{player.stage} exists"
      effects:
        - "restore board_state and player_state from localStorage"

  loops:
    - name: dig_loop
      description: "Tap hidden BOX → pickaxe swing → tile crumbles → content resolved → item_collect if last item tile."
    - name: clear_loop
      description: "All active_items filled → items fly to door → door transforms → stage_clear modal."
    - name: refill_loop
      description: "pickaxe_count == 0 → refill prompt. board_state persists — progress never lost."

goals:
  win:
    - condition: "player.event_completed == true"
  loss:
    - condition: "event timer expires — partial reward based on player.stage"

---

## Design Pillars

**Blank Paper Sketch** — Background `#faf8f5`, ink `#222222`, solid shadow `box-shadow: 2px 2px 0 #222` only. No gradients, no soft shadows, no 3D textures. The entire game must look like a pen sketch on paper.
**Exploratory tension** — All hidden tiles are visually identical. `content` is never exposed before dig. Every tap must feel like a genuine gamble.
**No defeat, only pause** — `pickaxe_count == 0` freezes progress but never resets it. `board_state` is always persisted in localStorage.
**Something always happens** — Minimum 15% of BOX cells are `EMPTY_REWARD`. No long empty streaks.
**Escalating discovery** — Boards grow from 5×5 to 10×10 across five stages. Each stage introduces a new shape and more complex items.

## Mechanics in Depth

### Stage Clear
```javascript
// src/mechanics.js
function check_stage_clear() {
  if (player.active_items.every(item => item.filled)) stage_clear();
}
```
`gems_collected` and remaining tile count are not clear conditions — they are mid-game rewards only. `check_stage_clear()` is called in exactly two places: after `item_collect()` completes.

### Grid Type Resolution
`final_type` is computed from `col_type × row_type` at board generation. Rules: NULL wins over all; BLOCK wins over BOX; BOX only when both axes are BOX. This single rule produces all five stage shapes from CSV config alone — no per-cell overrides needed.

### 3D Layer Architecture
```
// src/board.js — PlaneGeometry only, never BoxGeometry
y =  0.000  hidden BOX      color:0xeeeeee  + EdgesGeometry (z=0.005)
y = -0.005  revealed ITEM   single plane covering full item footprint, CanvasTexture emoji
y = -0.010  revealed hole   color:0xfaf8f5  + EdgesGeometry (z=0.001)
```
Camera: `OrthographicCamera`, size = `Math.max(cols, rows) + 1.5`, pointing straight down. Set `camera.up = (0, 0, -1)` before `lookAt(0,0,0)` — without this, a straight-down camera has an undefined orientation (up vector anti-parallel to look direction), breaking pointer-to-world coordinate mapping so that only the center tile registers clicks.

Each tile creates **four** Three.js objects: `sand` (Mesh), `edges` (LineSegments), `hole` (Mesh), `holeEdges` (LineSegments). All four must be stored in `tileObjects` by name and removed from the scene together on stage transition. Removing only the two Meshes leaves orphaned `LineSegments` in the scene; they persist visually into the next stage as ghost grid lines.

Item texture is one large plane placed below all sand tiles — digging reveals it progressively through the holes.

### Item Mapping
```javascript
// src/ui.js — only these IDs are valid
const itemEmojis = {
  1001: '🏺', 1002: '🗝️', 1003: '⚔️',
  1004: '🪖', 1005: '👑', 1006: '🛠️'
};
```
`stage_config.item_ids` controls which items appear per stage. Items outside this mapping must never be generated. On mapping failure, use `'💎'` as fallback only.

### Animations
| ID | Trigger | Spec |
|---|---|---|
| HT-ANI-001 | dig click | `#custom-cursor` rotates −45° + translateY 15px, 150ms |
| HT-ANI-002 | tile destroyed | 10 cube particles scatter with gravity + camera x/z shake |
| HT-ANI-003 | item completed | text popup at item center, 0.5s hold |
| HT-ANI-004 | after ANI-003 | emoji rotates 360° → flies to slot, 0.8s |
| HT-ANI-005 | stage_clear | slots fly to door 0.4s apart → door scales up + emoji changes |
| HT-ANI-006 | GEM / EMPTY_REWARD | float text `+1 💎` or `🪙` rises and fades |

### Stage Balance
| Stage | BOX tiles | gem_count | item_ids |
|---|---|---|---|
| 1 | 25 (5×5) | 2 | 1001 |
| 2 | 36 (6×6) | 2 | 1002, 1003 |
| 3 | 49 (7×7) | 3 | 1004, 1006 |
| 4 | 56 (8×7) | 4 | 1004, 1005, 1006 |
| 5 | 100 (10×10) | 5 | 1004, 1005, 1006 |

### DOM Elements
| ID | Role |
|---|---|
| `#custom-cursor` | `⛏️` follows pointer; canvas area sets `cursor:none` |
| `#ui-pickaxe` | pickaxe counter, updates on every dig |
| `#ui-gem-counter` | `💎 N / M`, updates on GEM dig |
| `#ui-item-slots` | slot bar — empty=dotted border, filled=golden glow |
| `#stage-clear-modal` | shown on stage_clear; z-index 200; player tap required |
| `#reset-btn` | calls reset_game() |
| `.stage-progress` | chest icons — done / active states; active line has gold flow animation |

### LocalStorage
```
ht_player_state        → { pickaxe_count, stage, gems_collected, active_items, event_completed }
ht_board_state_stage_N → [{ index, row, col, final_type, content, item_instance_id, state }]
```

## Content Guidelines

**New stage** — Add one row to `ht_stage_config.csv`. Set `col_1`–`col_10` and `row_1`–`row_10`. Verify BOX count ≥ item tile sum + `gem_count`. Keep `approx_box_tiles` increasing.

**New item** — Add one row per tile to `ht_item_config.csv`. Add the new `item_id` to `itemEmojis` in `src/ui.js`. Use SINGLE / HORIZONTAL / VERTICAL / SQUARE shapes only.

**Tuning** — Edit `gem_count` and `item_ids` in `ht_stage_config.csv`. Never set `empty_reward_ratio` below 0.10.

**CSV quoting rule (critical)** — `item_ids` uses RFC 4180 quoting when it contains multiple IDs: `"1002,1003"`. The surrounding double-quotes are part of the CSV cell, not the value. Any CSV parser reading `ht_stage_config.csv` **must** handle quoted fields; a naive `line.split(',')` treats the comma inside the quotes as a column separator, silently shifting every column after `item_count` (making `empty_reward_ratio` receive the second item ID string, `reward_bundle_id` receive `0.15`, etc.). This breaks all stages with 2+ items (stages 2–5) without any visible parse error.

## Anti-Patterns

**[CRITICAL] Putting game logic in index.html** — `index.html` is a mount point only. All logic lives in `src/`. Single-file implementations are rejected.
**[CRITICAL] Tinting hidden tiles by content** — All hidden BOX tiles render as `color:0xeeeeee`. No exceptions. Differentiating GEM, ITEM, or EMPTY_REWARD tiles before reveal destroys the core tension.
**[CRITICAL] Wrong clear condition** — `check_stage_clear` uses `active_items.every(filled)` only. Do not substitute `tiles_remaining == 0` or `gems_collected >= gem_count`.
**[CRITICAL] Generating unlisted items** — Only `item_ids` from `stage_config` are placed. Items not in `itemEmojis` (e.g. 🌍) must never appear on the board.
**Using BoxGeometry** — Tiles are `PlaneGeometry` only. 3D depth on tiles breaks the sketch aesthetic.
**Resetting on pickaxe exhaustion** — `board_state` is never cleared when `pickaxe_count` reaches 0.
**Auto-advancing stage** — `#stage-clear-modal` is mandatory. Player tap is required before `generate_board` is called.
**Skipping HT-ANI-004 or HT-ANI-005** — These are the primary reward moments. Replacing them with a simple fade or snap is not acceptable.

**[CRITICAL] Naive CSV comma-split on `item_ids`** — Cells like `"1002,1003"` are RFC 4180 quoted fields. A bare `line.split(',')` splits the inner comma into a second token, shifting `empty_reward_ratio`, `reward_bundle_id`, `description`, and `approx_box_tiles` by one column for every stage that has 2+ items. The parse silently succeeds with wrong values: `empty_reward_ratio` becomes `NaN`, no EMPTY_REWARD tiles are placed, and only the first item ID is read. Use a quoted-field-aware parser (track `inQuote` state while iterating characters).

**[CRITICAL] Incomplete Three.js scene cleanup on stage transition** — Each BOX tile creates four objects: `sand` (Mesh), `edges` (LineSegments), `hole` (Mesh), `holeEdges` (LineSegments). If only the two Meshes are removed from the scene, the two LineSegments remain as invisible-but-rendered geometry. On the next stage they appear as a ghost grid overlaid on top of the new board, making old tile boundaries visible through the new layout. Store all four references in `tileObjects[index]` and remove all four in the cleanup loop.

**[CRITICAL] Wrong OrthographicCamera up vector for top-down view** — A camera at `(0, 10, 0)` calling `lookAt(0, 0, 0)` with the default up vector `(0, 1, 0)` produces a degenerate orientation because the look direction `(0, -1, 0)` is anti-parallel to up. Three.js silently produces an arbitrary rotation matrix; pointer-to-world raycasting maps all screen coordinates to approximately the same world point (the board center), so only the center tile ever registers a dig. Fix: set `camera.up.set(0, 0, -1)` before calling `lookAt`.
