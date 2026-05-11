---
identity:
  name: "Prize Drop"
  id: prize_drop
  genre: "확률/연출형 (플링코)"
  platform: "mobile-first web"
  theme: "Blank Paper Sketch — 손그림 스케치 스타일, 종이 질감, 잉크 선"
  renderer: "Canvas 2D + 경량 물리 (자체 구현, Matter.js 불필요)"
  color:
    background: "#faf8f5"
    ink: "#222222"
    peg: "#222222"
    ball: "#222222"
    slot_highlight: "#f5c842"
    slot_bg: "#ffffff"

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — no game logic"
  structure:
    src/main.js: "진입점 — 초기화, 이벤트 바인딩"
    src/game.js: "게임 상태 관리, 투하 루프"
    src/board.js: "핀 배치 생성, Canvas 렌더링"
    src/ball.js: "공 물리 — 위치/속도/충돌 자체 구현"
    src/mechanics.js: "weighted_random, 목표 슬롯 선결정, Lerp 유도"
    src/ui.js: "DOM 업데이트, 슬롯 하이라이트, 보상 팝업"
    src/data.js: "slot_config CSV 파싱"
  ai_directives:
    read_order:
      - "1. Advanced Implementation Specs 섹션을 가장 먼저 읽는다"
      - "2. Anti-Patterns 섹션을 읽고 과거 버그를 숙지한다"
      - "3. implementation.structure 순서대로 파일을 분리한다"
      - "4. UI Architecture HTML 구조를 토씨 하나 틀리지 않고 반영한다"
    completion_checklist:
      - "투하 버튼 탭 → 공이 위에서 떨어지는가"
      - "결과 슬롯이 투하 전에 선결정되는가"
      - "공이 핀에 부딪히며 자연스럽게 튕기는가"
      - "공이 목표 슬롯 근처에서 Lerp로 유도되는가"
      - "슬롯 착지 → 하이라이트 + 보상 팝업이 실행되는가"
    rule: "위 5개 중 하나라도 실패 시 완료 선언 금지. 즉시 수정할 것."

components:
  ball:
    x: float                # 현재 x 위치
    y: float                # 현재 y 위치
    vx: float               # x 속도
    vy: float               # y 속도
    radius: float           # 공 반경 (8px)
    state: enum             # IDLE / FALLING / LERPING / LANDED
    target_slot: integer    # 선결정된 목표 슬롯 인덱스

  peg:
    x: float
    y: float
    radius: float           # 핀 반경 (5px)

  slot:
    index: integer          # 0~6 (7개 슬롯)
    x: float                # 슬롯 중앙 x
    label: string           # x1 / x2 / x3 / x10
    multiplier: float
    weight: integer

  player_state:
    tokens: integer
    bet: integer            # 1 / 5 / 10
    total_drops: integer
    last_result: string

entities:
  board:
    width: 320
    height: 480
    peg_rows: 7             # 핀 행 수
    peg_cols_start: 3       # 1행 핀 수 (아래로 갈수록 +1)
    slot_count: 7
    slots: list             # slot 엔티티 배열

mechanics:
  actions:
    drop:
      preconditions:
        - "player_state.tokens >= player_state.bet"
        - "ball.state == IDLE"
      effects:
        - "tokens -= bet"
        - "target_slot = weighted_random(slot_config) 선결정"
        - "공 초기 위치: x = board.width/2 + random(-20, +20), y = 20"
        - "초기 속도: vx = 0, vy = 2"
        - "ball.state = FALLING"
        - "물리 루프 시작"

    physics_update:
      preconditions:
        - "ball.state == FALLING or LERPING"
      effects:
        - "vy += 0.3 (중력)"
        - "각 핀과 충돌 체크 → 반발 계산"
        - "board 좌우 벽 반사"
        - "ball.y > board.height × 0.75 → state = LERPING"
        - "LERPING: x를 target_slot.x 방향으로 lerp(0.08)"
        - "ball.y >= slot_zone_y → state = LANDED → check_result()"

    check_result:
      preconditions:
        - "ball.state == LANDED"
      effects:
        - "착지 슬롯 하이라이트"
        - "보상 = bet × slot.multiplier"
        - "tokens += 보상"
        - "보상 팝업 표시"
        - "1.5초 후 ball.state = IDLE"

  loops:
    - "투하 → 물리 낙하 → Lerp 유도 → 착지 → 보상 → IDLE"

  goals:
    primary: "토큰을 유지하며 고배율 슬롯 달성"
    jackpot: "x10 중앙 슬롯 착지"

---

## Design Pillars

**결과 선결정 + Lerp 유도** — 공이 떨어지기 전에 목표 슬롯이 정해진다. 물리는 시각적 재미를 위한 연출이며, 하단 75% 구간부터 공을 목표 슬롯 방향으로 부드럽게 유도한다. 플레이어는 자연스러운 물리처럼 느낀다.

**자체 물리 구현** — Matter.js 불필요. 단순 AABB 원형 충돌 + 중력으로 충분하다. 핀 충돌 시 반발벡터 계산, 좌우 벽 반사만 구현한다.

**Blank Paper Sketch** — 핀은 작은 잉크 원, 슬롯은 흰 박스에 잉크 텍스트, 공은 단색 원. 화려한 이펙트 없이 충돌과 낙하 자체가 재미.

## User Flow

### 진입
게임 로드 → 보드 + 핀 표시 → 초기 토큰 50개 → 투하 버튼 활성화

### 투하
투하 버튼 탭 → 베팅 차감 → 공 상단 중앙에서 생성 → 낙하 시작 → 핀 충돌 → 하단 슬롯 착지

### 착지
슬롯 하이라이트(0.5s) → "+N 토큰" 팝업 → 토큰 업데이트 → 공 사라짐 → 1.5초 후 IDLE

### 토큰 소진
tokens < bet → 투하 버튼 비활성화 → 충전 버튼 표시

## Mechanics in Depth

### 핀 배치 (삼각형 그리드)
```
행 1: 핀 3개 (x 간격 60px)
행 2: 핀 4개 (행 1 대비 30px 오프셋)
행 3: 핀 5개
...
행 7: 핀 9개
핀 간격: 수직 50px, 수평 60px
```

### 슬롯 구성 (7개, 대칭)
```
인덱스  라벨   가중치  배율
0      x1     30     1
1      x2     25     2
2      x3     20     3
3      x10    5      10
4      x3     20     3
5      x2     25     2
6      x1     30     1
```

### 충돌 계산
```javascript
// 공-핀 충돌
dist = distance(ball, peg)
if (dist < ball.radius + peg.radius):
  normal = normalize(ball.pos - peg.pos)
  dot = vx×normal.x + vy×normal.y
  vx -= 2 × dot × normal.x × 0.7  // 반발계수 0.7
  vy -= 2 × dot × normal.y × 0.7
```

### Lerp 유도
```javascript
if (ball.y > board.height × 0.75):
  ball.state = LERPING
  ball.vx = lerp(ball.vx, (target_slot.x - ball.x) × 0.08, 0.1)
  // 자연스럽게 유도, 순간이동 금지
```

### 애니메이션 명세
- ANI-001 공 낙하: 중력 0.3px/frame², 핀 충돌 반발계수 0.7
- ANI-002 슬롯 하이라이트: fill #f5c842, 0.3s fade in → 1s 유지 → fade out
- ANI-003 보상 팝업: "+N 토큰" 위로 40px, opacity 0→1→0, 1.2s
- ANI-004 공 착지: 공 scale 1→1.3→0, 200ms (터지는 효과)
- ANI-005 고배율(x10): 슬롯 3회 점멸 + 보상 팝업 크게

## UI Architecture

```html
<!-- index.html 고정 구조 — ID/클래스명 수정 금지 -->
<body>
  <div id="app">
    <div id="ui-top">
      <span id="ui-tokens">🪙 50</span>
      <span id="ui-bet">BET: 1</span>
    </div>
    <div id="board-container">
      <canvas id="board-canvas" width="320" height="480"></canvas>
    </div>
    <div id="ui-result"></div>
    <div id="ui-bottom">
      <button id="btn-bet">BET: 1</button>
      <button id="btn-drop">DROP</button>
      <button id="btn-add-tokens" class="debug">+50토큰</button>
    </div>
  </div>
</body>
```

CSS 규칙:
- `#app`: width 390px, height 844px, margin auto, overflow hidden
- `#board-container`: width 320px, height 480px, margin auto, position relative
- `pointer-events: none` on `#ui-result`
- Canvas 초기화: DOMContentLoaded 이후, board-container clientWidth 기준

## Content Guidelines

### slot_config.csv 구조
```
slot_index, label, weight, multiplier, x_position
0, x1, 30, 1, 23
1, x2, 25, 2, 69
2, x3, 20, 3, 115
3, x10, 5, 10, 160
4, x3, 20, 3, 205
5, x2, 25, 2, 251
6, x1, 30, 1, 297
```

### 로컬 저장
- `localStorage.setItem('prizeDrop_tokens', tokens)`
- 시작 시 복구, 없으면 50토큰 초기화

## Advanced Implementation Specs (AI Directives)
Canvas 2D 자체 물리 기반 Prize Drop 구현 시 반드시 지켜야 할 사항:

1. **Canvas 크기 동기화**:
   - `canvas.width`와 `canvas.height`는 `#board-container`의 실제 `clientWidth/clientHeight` 기준
   - `style.width`와 `canvas.width`는 다름 — 반드시 attribute로 설정
   - `window.addEventListener('resize')`로 캔버스 크기 재동기화 필수

2. **DOMContentLoaded 이후 초기화**:
   - Canvas context는 반드시 `DOMContentLoaded` 이후 획득
   - `#board-canvas` DOM이 존재한 후 물리 루프 시작

3. **물리 루프 requestAnimationFrame 사용**:
   - `setInterval` 금지 — `requestAnimationFrame` 사용
   - `ball.state == IDLE`일 때 물리 루프 일시정지 (불필요한 연산 방지)

4. **핀 충돌 감지 정확도**:
   - 공 속도가 빠를 때 핀을 통과(tunneling)하는 버그 발생 가능
   - 매 프레임 이동 거리가 `ball.radius + peg.radius`보다 클 경우 서브스텝으로 분할 처리

5. **Lerp 유도 강도 조절**:
   - 유도가 너무 강하면 공이 직선으로 날아가 부자연스러움
   - `lerp factor 0.08` 유지 — 더 강하게 설정 금지
   - 유도 시작 y 위치(`board.height × 0.75`) 변경 금지

6. **completion_checklist 통과 기준**:
   - "공이 핀에 부딪히며 자연스럽게 튕기는가" = 화면에서 실제 튕김을 눈으로 확인
   - "Lerp 유도" = 공이 하단에서 목표 방향으로 자연스럽게 흘러가는 것 확인
   - 콘솔 에러 없음만으로 통과 선언 금지

## Anti-Patterns

[CRITICAL] 물리로 결과 결정 금지
- 공이 실제로 어느 슬롯에 들어가는지로 결과를 계산하면 안 됨
- 반드시 drop() 시작 시 weighted_random()으로 선결정 후 Lerp로 유도

[CRITICAL] Lerp 대신 순간이동 금지
- `ball.x = target_slot.x` 직접 대입 금지
- 반드시 `lerp(ball.vx, target_direction × 0.08, 0.1)` 방식으로 부드럽게 유도

[CRITICAL] Matter.js 사용 금지
- 단순 원형 충돌 + 중력으로 자체 구현
- Matter.js는 이 게임에 과도함. 로드 시간 낭비

[CRITICAL] Canvas 초기화 타이밍
- DOMContentLoaded 이전 canvas 접근 금지
- board-container clientWidth 기준으로 canvas 크기 설정

[CRITICAL] 투하 중 중복 탭 차단
- ball.state != IDLE인 경우 drop() 차단
- btn-drop disabled 처리 필수

ANI-004 공 착지 폭발 효과 생략 금지 — 착지 피드백 핵심
btn-add-tokens 디버그 버튼 반드시 구현
