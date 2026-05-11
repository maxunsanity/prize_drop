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
  index_html: "Strict UI layout structure defining flex containers, Z-indexes, and pointer-events"
  files:
    src/main.js:      "entry — load CSVs, init UI, setup event listeners, call resume() or generate_board()"
    src/game.js:      "Three.js init, OrthographicCamera, resize logic, render loop, camera shake"
    src/board.js:     "generate_board(), tile geometry creation, mesh placement, Three.js raycasting"
    src/ui.js:        "DOM updates, HT-ANI animations, custom cursor, emoji mapping"
    src/style.css:    "Blank Paper Sketch aesthetics, flexbox layout, pointer-events rules"
    src/data.js:      "CSV parsing, localStorage read/write"
  data_files: [ht_stage_config.csv, ht_item_config.csv, ht_event_config.csv]

  ai_directives:
    read_order:
      - "1. Advanced Implementation Specs 섹션을 가장 먼저 읽는다"
      - "2. Anti-Patterns 섹션을 읽고 과거 버그를 숙지한다"
      - "3. implementation.files 구조대로 모듈을 분리한다"
      - "4. UI Architecture HTML 구조를 토씨 하나 틀리지 않고 반영한다"
    completion_checklist:
      - "게임 실행 → 보드(타일)가 캔버스에 실제로 보이는가 (콘솔 에러 없음만으로 통과 불가)"
      - "타일 클릭 → 곡괭이 소모 + 파괴 애니메이션 실행되는가"
      - "아이템 발굴 → 슬롯으로 날아가는 애니메이션 실행되는가"
      - "스테이지 클리어 → 모달이 뜨고 다음 스테이지로 넘어가는가"
      - "곡괭이 소진 → 진행 동결되고 보드 리셋되지 않는가"
    rule: "completion_checklist 항목 중 하나라도 실패하면 완료 선언 금지 — 즉시 수정 후 재테스트"

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
    active_items:    { type: list, items: item_slots, default: [] }
    event_completed: { type: bool, default: false }

  item_slot_state:
    item_id:     { type: int }
    instance_id: { type: int }
    filled:      { type: bool, default: false }

entities:
  player:
    components: [player_state]
    states: [active, pickaxe_empty, event_done]
  board:
    components: [tile_slot, position]
    count: 100
  item_slots:
    components: [item_slot_state]
    count: 3

mechanics:
  turn_structure: realtime
  actions:
    dig:
      actor: player
      params: { tile: board }
      preconditions:
        - "player.pickaxe_count > 0"
        - "tile.final_type == BOX"
        - "tile.state == hidden"
        - "player.event_completed == false"
      effects:
        - "player.pickaxe_count -= 1"
        - "tile.state = revealed"
        - "check content -> trigger animation -> update UI"
        - "if content == ITEM -> check if all parts found -> trigger item_collect"
        - "save game state to localStorage"
        - "if all items for stage found -> trigger stage_clear"

    generate_board:
      actor: system
      effects:
        - "read ht_stage_config.csv for stage_id"
        - "compute final_type for 10x10 grid using col_type x row_type"
        - "place item tiles based on stage item_ids (must fit within BOX cells without overlap)"
        - "place gem_count GEMs into remaining empty BOX cells"
        - "render new 3D board scene"
        - "save board layout to localStorage"

---

## 🎨 Design Pillars: "Blank Paper Sketch"
This design is absolute and must be strictly adhered to. It ensures the UI remains intact regardless of the AI building it.
1. **Color Palette**: Background is `#faf8f5` (Paper white). Text, borders, and shadows are `#222` (Ink black). No gradients or soft shadows.
2. **Sketch Styling**: Buttons, UI panels, and interactive elements must have:
   `border: 2px solid #222;`
   `box-shadow: 2px 2px 0 #222;`
   `border-radius: 4px;`
3. **Typography**: Bold, clean sans-serif (e.g., `font-weight: 900`).
4. **Pointer Events**: Since the UI is HTML layered over a 3D Canvas, the root `#ui-layer` MUST have `pointer-events: none;`, while interactive child elements (buttons, top bar, modals) MUST explicitly set `pointer-events: auto;`. The `#canvas-container` MUST also have `pointer-events: auto;` to allow raycasting.

## 🏗️ UI Architecture & HTML Layout Specification
To prevent the layout from breaking, the `index.html` structure MUST follow this exact Flexbox hierarchy:

```html
<body>
  <div id="ui-layer" style="display:flex; flex-direction:column; width:100%; height:100%; position:absolute; top:0; left:0; pointer-events:none;">

    <!-- TOP SECTION -->
    <div class="top-section" style="display:flex; flex-direction:column; align-items:center; background:#faf8f5; pointer-events:auto; z-index:50;">
      <div class="top-bar" style="display:flex; justify-content:space-between; width:100%; padding:8px 12px;">
        <button id="cheat-btn" class="sketch-btn">+100 ⛏️</button>
        <div class="timer-badge">⏳ 숨겨진 사원</div>
        <button id="reset-btn" class="sketch-btn">리셋</button>
      </div>

      <!-- Door UI -->
      <div class="door-container">
        <div class="door-circle"><div class="door-inner">🚪</div></div>
      </div>

      <!-- Stage Progress Bar (Chests & Lines) -->
      <div class="stage-progress" style="display:flex; justify-content:center; align-items:center;">
        <div class="chest">I</div><div class="line"></div>
        <div class="chest">II</div><div class="line"></div>
        <!-- ... up to V -->
      </div>

      <!-- Resource Counters -->
      <div class="counter-container" style="display:flex; gap:12px;">
        <div class="pickaxe-counter">⛏️ 50</div>
        <div class="gem-counter">💎 0 / 2</div>
      </div>
    </div>

    <!-- MAIN AREA (Canvas + Bottom Slots) -->
    <div class="main-area" style="flex:1; display:flex; flex-direction:column; width:100%; position:relative;">

      <!-- Three.js Canvas Container -->
      <div id="canvas-container" style="flex:1; width:100%; pointer-events:auto; cursor:none; border-top:2px solid #222; border-bottom:2px solid #222;">
        <canvas id="game-canvas" style="width:100%; height:100%; outline:none;"></canvas>
      </div>

      <!-- Bottom Item Slots -->
      <div id="item-slot-bar" style="height:72px; display:flex; justify-content:center; align-items:center; gap:10px; pointer-events:auto; background:#faf8f5; flex-shrink:0;">
        <div class="item-slot"></div>
        <div class="item-slot"></div>
        <div class="item-slot"></div>
      </div>
    </div>

  </div>
</body>
```

### CSS Layout Rules for Stability
- `html, body`: `margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;`
- `.main-area`: Must use `flex: 1` to push the `#item-slot-bar` to the absolute bottom while allowing `#canvas-container` to fill the remaining middle space.
- `#canvas-container`: Must have `min-height: 0` to prevent canvas stretching beyond viewport.
- `.item-slot`: Fixed size `52x52px`, `border: 2px dashed #aaa`. When filled: `border: 2px solid #222; box-shadow: 3px 3px 0 #222; background: #fff;`

## ⚙️ Core Mechanics & Integration Details
1. **Canvas Resizing**: The Three.js renderer must attach to `#game-canvas` and explicitly sync its size to `#canvas-container` using a ResizeObserver or window `resize` event.
2. **Raycasting Overlay**: Mouse/Touch coordinates must be calculated relative to `#canvas-container`'s bounding client rect, NOT the `window`, because the top UI pushes the canvas down.
3. **No defeat, only pause**: Running out of pickaxes freezes progress but never resets the board. State is always synced to `localStorage`.
4. **State Management**:
   - Save: `localStorage.setItem('ht_player_state', JSON.stringify(state))`
   - Load: On `main.js` init, load from localStorage. If null, initialize default state and `generate_board(1)`.

## 🧩 Advanced Implementation Specs (AI Directives)
To ensure the game functions perfectly with full visual polish, the AI must implement the following advanced features WITHOUT prompt intervention. These are strict fixes to past trial-and-error failures:

1. **Robust CSV Parser (Quote-Aware)**:
   - The CSV parser MUST handle fields wrapped in double quotes `""` that contain commas `,` (e.g., stage 2's `item_ids: "1002,1003"`). Simple `split(',')` will corrupt data and break stage progression.

2. **Dynamic Camera Centering (Active Grid Bounds)**:
   - Do NOT just center the camera on a fixed 10x10 area.
   - Calculate the `minCol, maxCol, minRow, maxRow` of the active `BOX` and `BLOCK` tiles for the current stage.
   - Adjust `OrthographicCamera`'s `left, right, top, bottom` based on the active bounds and the viewport `aspect` ratio.
   - MUST use `renderer.setSize(w, h, false)` to prevent high-DPI (Retina) screens from pushing the canvas out of bounds to the bottom right.

3. **Multi-Tile Item CanvasTexture Rendering**:
   - Multi-tile items (e.g., 2x2 or 2x1) MUST NOT be rendered as separate individual emojis.
   - Calculate the center `(x, z)` and total `(width, height)` of all tiles comprising the item instance.
   - Create a single `PlaneGeometry` covering the entire item size.
   - Generate a `CanvasTexture` containing the item's emoji and map it onto the plane so it appears as one contiguous large item spanning multiple grid cells.

4. **3D Particles & Promise-Based Flying Animations**:
   - **Digging Effects**: When a tile breaks, spawn 3D particle cubes (`BoxGeometry`) with randomized velocities and a gravity effect (`vy -= 0.015`), coupled with a camera shake (`camera.position.x/z` random offset).
   - **Item Collection Fly-To**: When an item's tiles are fully revealed, spawn a DOM overlay emoji that uses a CSS transition to fly into the bottom `#item-slot-bar`.
   - **Stage Clear Sequence**: When all items are found, use `Promise.all` to stagger a sequence where all collected items in the bottom slots fly asynchronously into the top Door UI (`.door-inner`), triggering a pulse effect before transitioning to the next stage.

5. **Gap-Free Tile Rendering (No Peeking)**:
   - Cover tiles (`hidden` state) MUST be rendered at exactly `1.0 x 1.0` size (`PlaneGeometry(1.0, 1.0)`) with a grid spacing of `1.0` so they are exactly touching.
   - Do NOT use `0.95` or any size that creates gaps between tiles, as this exposes the hidden items underneath before they are dug up.
   - Use `EdgesGeometry` to draw the black sketch borders over the `1.0 x 1.0` tiles to distinguish the grid without creating physical gaps.

6. **Stage Clear Logic Isolation (Item Only)**:
   - Stage completion MUST trigger IMMEDIATELY when all `active_items` are fully dug and collected.
   - Do NOT require players to find all `GEM`s to clear a stage (Gems are optional bonuses).
   - Do NOT check `tiles_remaining > 0` as a condition for stage clear. If a player finds the final item piece on the very last available tile, the stage MUST clear successfully. Implement an `isStageClearing` boolean flag to prevent duplicate triggers instead.

7. **Popup CSS Coordinate Alignment**:
   - For UI popups (e.g., '+1 💎') appearing at the cursor or 3D projected coordinates, the CSS class (e.g., `.popup-anim`) MUST have `position: absolute;` and `transform: translate(-50%, -50%);` to accurately center the element. Omitting this causes the popup to float arbitrarily far from the intended coordinates.

8. **Three.js Canvas Initialization (Rendering Fix)**:
   - Three.js MUST be initialized AFTER `DOMContentLoaded` fires — never inline in a script tag before DOM is ready.
   - `renderer.setSize()` MUST use `#canvas-container`'s actual `clientWidth` and `clientHeight`, NOT `window.innerWidth/innerHeight`.
   - MUST attach a `ResizeObserver` to `#canvas-container` to keep renderer size in sync when layout changes.
   - Correct pattern (MUST follow exactly):
   ```javascript
   window.addEventListener('DOMContentLoaded', () => {
     const container = document.getElementById('canvas-container');
     renderer.setSize(container.clientWidth, container.clientHeight, false);
     new ResizeObserver(() => {
       const w = container.clientWidth;
       const h = container.clientHeight;
       renderer.setSize(w, h, false);
       // recalculate camera left/right/top/bottom here
     }).observe(container);
   });
   ```
   - completion_checklist item 1 ("보드가 정상 표시되는가") is ONLY passed when tiles are visually rendered on screen. Console error-free alone does NOT count as passing.

9. **OrthographicCamera Frustum vs World Coordinates (CRITICAL)**:
   - `camera.left/right/top/bottom`은 카메라 로컬 공간(뷰 공간) 기준 상대값. 월드 좌표 직접 대입 금지.
   - 월드 좌표를 절두체에 넣으면 모든 타일이 절두체 밖으로 클리핑되어 완전 빈 화면 발생.
   - 반드시 아래 패턴으로만 설정:
   ```javascript
   // 올바른 패턴 — 항상 0 중심 대칭
   camera.left   = -hW;
   camera.right  = +hW;
   camera.top    = +hH;
   camera.bottom = -hH;
   camera.position.set(cx, cy, 10);  // 월드 위치는 position으로만 처리
   camera.updateProjectionMatrix();
   // 절대 금지 패턴:
   // camera.left = cx - hW;  ← 월드 좌표 혼용 → 타일 전부 클리핑됨
   ```

10. **Item Slot Preview on Stage Start**:
    - 스테이지 시작 시 하단 슬롯에 수집 목표 아이템을 흐릿하게 미리보기로 표시 필수.
    - `resetSlots()` 호출 직후 반드시 `previewSlot()` 호출.
    - 미구현 시 플레이어가 뭘 찾아야 하는지 알 수 없는 UX 문제 발생.
    ```javascript
    // ui.js — previewSlot() 필수 구현
    export function previewSlot(index, emoji) {
      const slot = slots[index];
      if (!slot) return;
      slot.classList.remove('filled');
      slot.innerHTML = `<span style="font-size:30px;opacity:0.3;filter:grayscale(1);">${emoji}</span>`;
    }
    // startStage() 에서
    resetSlots();
    state.active_items.forEach((it, i) => previewSlot(i, getItemEmoji(it.item_id)));
    // resumeStage() 에서 — 저장 상태 복원 시
    state.active_items.forEach((it, i) => {
      if (it.filled) fillSlot(i, getItemEmoji(it.item_id), it.item_id);
      else previewSlot(i, getItemEmoji(it.item_id));
    });
    ```
