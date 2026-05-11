# GAME_roulette_wheel.md

````md
---
identity:
  name: "컬러 돌림판"
  id: roulette_wheel
  genre: [probability, event-minigame, reward]
  platform: [mobile-ios, mobile-android, web]
  renderer: canvas-2d
  players: 1
  theme: "Blank Paper Sketch"
  pitch: "제한된 기회를 사용하여 룰렛을 돌리고 다양한 보상을 획득하는 확률 기반 이벤트 미니게임. 결과는 물리 랜덤이 아닌 CSV 기반 weighted_random()으로 선결정된다."

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — game logic absolutely prohibited"
  files:
    src/main.js: "게임 초기화, CSV 로드, resize 이벤트 바인딩, resume()"
    src/game.js: "상태 머신 관리, spin loop, save/load"
    src/wheel.js: "Canvas 2D 룰렛 렌더링, 회전 애니메이션"
    src/mechanics.js: "weighted_random(), 결과 검증, 목표 각도 계산"
    src/ui.js: "DOM 업데이트, reward popup, button state"
    src/layout.js: "모바일 화면 비율 대응, DPR 대응"
    src/data.js: "CSV parser, RFC4180 parsing, config validation"
    src/style.css: "Blank Paper Sketch 스타일"
  data_files:
    - roulette_section_config.csv
    - probability_config.csv
    - roulette_visual_config.csv
    - roulette_event_config.csv
  ai_directives:
    read_order:
      - "1. Advanced Implementation Specs 먼저 읽기"
      - "2. Anti-Patterns 읽고 실패 사례 숙지"
      - "3. UI Architecture 구조 그대로 구현"
      - "4. completion_checklist 통과 전 완료 선언 금지"
    completion_checklist:
      - "게임 실행 → 룰렛과 버튼 정상 표시"
      - "SPIN 탭 → weighted_random() 즉시 실행"
      - "룰렛이 목표 슬롯에 정확히 정지"
      - "보상 팝업 + 하이라이트 연출 실행"
      - "chance == 0 → 리셋 없이 진행 동결"
      - "브라우저 로드 즉시 섹션이 색상+라벨 포함 Canvas에 그려지는가 (흰 화면 = draw() 미호출)"
      - "DevTools Elements에서 #wheel-canvas에 style.transform 속성이 없는가 (있으면 CSS 회전 오구현)"
      - "브라우저 콘솔 오류 0개 (특히 'is not defined', 'Cannot read properties' 오류 확인)"
      - "applyReward 반환값이 객체인가 — typeof result === 'object' && 'tokens' in result"
    rule: "위 9개 중 하나라도 실패 시 완료 선언 금지. 즉시 수정할 것."

components:
  wheel:
    sections: list
    current_angle: float
    target_angle: float
    speed: float
    state:
      type: enum
      values:
        - IDLE
        - PREDETERMINING
        - ACCELERATING
        - SPINNING
        - DECELERATING
        - BOUNCE
        - RESULT
        - REWARD_MODAL
        - LOCKED
    total_rotation: float
    predetermined_slot: string
    visual_stop_slot: string

  player_state:
    chances: int
    total_spins: int
    last_result: string
    rewards_collected: int

entities:
  section:
    components:
      - slot_id
      - label
      - reward_type
      - reward_value
      - icon
      - color
      - weight
    count: 10

mechanics:
  actions:

    spin:
      actor: player
      preconditions:
        - "player_state.chances > 0"
        - "wheel.state == IDLE"
      effects:
        - "player_state.chances -= 1"
        - "wheel.state = PREDETERMINING"
        - "predetermined_slot = weighted_random(probability_config.csv)"
        - "target_angle = calculate_target_angle(predetermined_slot)"
        - "wheel.total_rotation = current_angle + (5~7 rotations) + target_angle"
        - "save_state()"
        - "start_spin_animation()"

    calculate_target_angle:
      effects:
        - "slot_angle = 360 / section_count"
        - "slot_center_angle = (slot_index * slot_angle) + (slot_angle / 2)"
        - "pointer_angle = -90deg"
        - "target_angle = pointer_angle - slot_center_angle"

    verify_result:
      preconditions:
        - "wheel.state == RESULT"
      effects:
        - "visual_stop_slot = angle_to_slot(current_angle)"
        - "if visual_stop_slot != predetermined_slot -> force_snap(predetermined_slot)"
        - "trigger reward popup"
        - "save_state()"

  loops:
    - "IDLE → PREDETERMINING → ACCELERATING → SPINNING → DECELERATING → BOUNCE → RESULT → REWARD_MODAL → IDLE"

goals:
  primary: "다양한 보상을 획득"
  jackpot: "희귀 보상 슬롯 획득"

---

## 🎨 Design Pillars

### 1. 결과 선결정 원칙
룰렛 결과는 반드시 spin() 시작 시 weighted_random()으로 선결정된다.
룰렛 회전은 순수 연출이며, 포인터 위치로 결과를 계산하면 안 된다.

### 2. Blank Paper Sketch
- 배경: #faf8f5
- 잉크색: #222
- 그라디언트 금지
- 두꺼운 스케치 라인
- border: 2px solid #222
- box-shadow: 2px 2px 0 #222

### 3. 모바일 우선
- 390x844 기준
- DPR 대응 필수
- resize 시 회전 상태 유지

---

## 🧭 User Flow

### 1. 진입
이벤트 배너 탭
  → RW-UI-001 메인 룰렛 표시
  → CSV 로드 완료
  → 룰렛 초기 렌더링

### 2. 대기 상태
SPIN 버튼 활성화
  → 플레이어 입력 대기

### 3. 회전 시작
SPIN 버튼 탭
  → chance -1
  → weighted_random() 실행
  → RW-ANI-001 회전 시작
  → 버튼 disabled

### 4. 감속 및 착지
remaining_angle < 120deg
  → RW-ANI-002 감속 시작
  → 목표 슬롯 착지
  → RW-ANI-003 포인터 bounce

### 5. 결과
당첨 슬롯 하이라이트
  → RW-ANI-004 reward popup
  → 플레이어 확인 버튼 탭
  → IDLE 복귀

### 6. 예외: chance 부족
chance == 0
  → RW-ANI-005 버튼 shake
  → "기회가 부족합니다"
  → 현재 상태 유지
  → 리셋 절대 금지

---

## 🎞 Animation Specifications

### RW-ANI-001 룰렛 회전
- 기본 5~7바퀴 회전
- duration: 3500ms
- easing: cubic-bezier(0.25, 0.1, 0.15, 1)

### RW-ANI-002 감속
- remaining_angle < 120deg 시작
- speed *= 0.97
- 역회전 금지

### RW-ANI-003 포인터 bounce
- +2deg → -2deg
- duration: 300ms

### RW-ANI-004 보상 팝업
- scale: 0.5 → 1.2 → 1
- opacity: 0 → 1
- particle: 15개
- radius: 100px
- duration: 600ms

### RW-ANI-005 버튼 거부
- X축 ±5px
- 4프레임
- duration: 200ms

---

## 🏗 UI Architecture

```html
<body>
  <div id="game-container">

    <div id="title-header">
      컬러 돌림판
    </div>

    <div id="wheel-container">

      <div id="wheel-shadow"></div>

      <canvas id="wheel-board"></canvas>

      <div id="wheel-highlight-overlay"></div>

      <div id="wheel-center">
        🏠
      </div>

      <div id="wheel-pin">
        📍
      </div>

    </div>

    <div id="bottom-controller">
      <button id="spin-btn">
        돌리기
      </button>

      <div id="chance-text">
        기회 1번 남음
      </div>
    </div>

    <div id="reward-modal"></div>

  </div>
</body>
````

---

## 📐 CSS Layout Rules

* #game-container

  * width: 100%
  * height: 100%
  * overflow: hidden
  * position: relative

* #wheel-container

  * width: 360px
  * height: 360px
  * position: absolute
  * top: 50%
  * left: 50%
  * transform: translate(-50%, -50%)

* #wheel-board

  * width: 100%
  * height: 100%
  * transform-origin: center center

* #wheel-pin

  * position: absolute
  * top: -10px
  * left: 50%
  * transform: translateX(-50%)
  * z-index: 10

* #wheel-center

  * position: absolute
  * width: 72px
  * height: 72px
  * left: 50%
  * top: 50%
  * transform: translate(-50%, -50%)
  * z-index: 9

---

## 🧩 Content Guidelines

### roulette_section_config.csv

```csv
slot_id,label,reward_type,reward_value,icon,color
s1,🍒10,COINS,10,cherry,#ffffff
s2,💎100,COINS,100,gem,#f0ede8
s3,🎟️1,TICKET,1,ticket,#ffffff
```

### probability_config.csv

```csv
slot_id,weight
s1,150
s2,10
s3,80
```

### roulette_visual_config.csv

```csv
key,value
spin_duration,3500
min_rotation,5
bounce_degree,2
particle_count,15
```

### roulette_event_config.csv

```csv
event_id,start_at,end_at,daily_chance
roulette_may,2026-05-01,2026-05-07,3
```

---

## 💾 LocalStorage Schema

```json
roulette_save_v1
{
  "chances": 3,
  "total_spins": 12,
  "last_result": "s3",
  "current_angle": 4820,
  "statistics": {}
}
```

---

## 🔊 SFX Trigger Table

| SFX ID     | Trigger      |
| ---------- | ------------ |
| RW-SFX-001 | spin start   |
| RW-SFX-002 | wheel tick   |
| RW-SFX-003 | slowdown     |
| RW-SFX-004 | reward popup |
| RW-SFX-005 | jackpot      |

---

## 🧠 Advanced Implementation Specs

### 1. 결과 선결정

weighted_random()은 spin() 시작 즉시 실행되어야 한다.

### 2. DPR 대응

```js
const dpr = window.devicePixelRatio || 1
canvas.width = rect.width * dpr
canvas.height = rect.height * dpr
ctx.scale(dpr, dpr)
```

### 3. requestAnimationFrame 필수

setInterval 금지.

### 4. 포인터 고정

wheel-board만 회전.
wheel-pin과 center-icon은 회전 금지.

### 5. transform-origin

반드시 center center.

### 6. resize 유지

resize 중 current_angle 유지.
회전 상태 초기화 금지.

### 7. Result Verification

predetermined_slot과 visual_stop_slot 비교 필수.

### 8. Weight Validation

probability_config.csv weight 합계는 반드시 1000.

### 9. 파일별 export interface (이 형식 정확히 지킬 것)

```
wheel.js    → export class Wheel
              필수 멤버: spin(targetIdx), update(), draw(), highlight(id),
                        clearHighlight(), resetToIdle(), onStopped: Function|null

game.js     → export const Game
              필수 멤버: init(canvas, sections), spin(), changeBet(), addTokens(), loop()

ui.js       → export const UI
              필수 멤버: updateTokens(n), updateBet(n), setSpinEnabled(bool),
                        showPopup(text, type), triggerPointerVibrate(), showJackpot(...)

mechanics.js → export function weightedRandom(sections) → section 객체
               export function applyReward(section, tokens, bet)
                 → { tokens: number, message: string, type: string }

data.js     → export async function loadSectionConfig() → Promise<section[]>
              export const Storage { save(state), load() → state|null }
```

### 10. Canvas 2D 그리기 루프 패턴 (반드시 이 구조로 구현)

```js
// wheel.js draw() 내부
draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((this.currentAngle % 360) * Math.PI / 180); // ← % 360 필수
  for (let i = 0; i < sections.length; i++) {
    // arc → fill → stroke → label 순으로 그리기
  }
  ctx.restore();
}

// game.js loop()
loop() {
  requestAnimationFrame(() => this.loop());
  this.wheel.update(); // update() 내부에서 draw() 호출
}
```

### 11. 오버슈트 방지 스냅 패턴 (update() 내 순서 고정)

```js
update() {
  const remaining = this.targetAngle - this.currentAngle;

  // [1단계] 스냅 체크 — 반드시 이동보다 먼저
  if (remaining <= this.speed) {
    this.currentAngle = this.targetAngle;
    this.state = 'STOPPED';
    this.draw();
    if (this.onStopped) { const cb = this.onStopped; this.onStopped = null; cb(); }
    return;
  }

  // [2단계] 감속
  if (remaining < 50) {
    this.speed = Math.max(0.3, this.speed * 0.97);
  }

  // [3단계] 이동
  this.currentAngle += this.speed;
  this.draw();
}
```

---

## 🚨 Anti-Patterns

[CRITICAL] 결과를 포인터 위치로 계산 금지

* spin 시작 시 weighted_random() 선결정 필수

[CRITICAL] 역회전 금지

* 감속 중 음수 rotation 진입 금지

[CRITICAL] DOMContentLoaded 이전 canvas 접근 금지

* canvas.getContext() 조기 호출 금지

[CRITICAL] resize 시 회전 초기화 금지

* current_angle 유지 필수

[CRITICAL] chance == 0 시 리셋 금지

* 상태 동결만 허용

[CRITICAL] reward modal 자동 종료 금지

* 플레이어 확인 탭 필수

[CRITICAL] probability_config 합계 오류

* weight 합계 != 1000 → 실행 중단

[CRITICAL] single file implementation 금지

* index.html 로직 구현 금지

[CRITICAL] spin 중 중복 입력 금지

* wheel.state != IDLE → input lock

[CRITICAL] requestAnimationFrame 중복 실행 금지

* RAF loop singleton 유지

[CRITICAL] canvas.style.transform 으로 휠 회전 금지
* `canvas.style.transform = 'rotate(Xdeg)'` 는 이미 그려진 픽셀을 통째로 돌릴 뿐
* Canvas 2D 휠은 반드시 매 프레임 `ctx.clearRect` → `ctx.rotate(currentAngle)` → 섹션 재그리기 방식으로 구현
* CSS transform 방식은 섹션 색상·라벨이 정적으로 굳어버려 하이라이트 애니메이션이 불가능해짐
* 올바른 패턴: `wheel.update()` → `wheel.draw()` 내부에서 `ctx.save(); ctx.rotate(rotRad); ... ctx.restore();`

[CRITICAL] drawWheel 전역 함수 선언 금지
* main.js 또는 game.js 에서 `function drawWheel() { ... }` 직접 정의 금지
* 반드시 wheel.js 의 Wheel 클래스 내부 `draw()` 메서드로 캡슐화
* 호출 패턴 고정: `game.loop()` → `requestAnimationFrame` → `wheel.update()` → 내부에서 `this.draw()` 호출
* 전역 drawWheel 패턴을 쓰면 resize 후 참조가 끊기거나 state와 분리되어 미정의 오류 발생

[CRITICAL] applyReward 문자열 직접 반환 금지
* `return '+10 토큰!'` 형태의 문자열 반환 금지
* 반드시 `{ tokens: number, message: string, type: string }` 객체 반환
* 문자열을 반환하면 game.js 에서 type 분기(JACKPOT/EMPTY/COINS)가 불가능해짐
* type 값은 반드시 reward_type 과 일치: 'COINS' | 'BONUS' | 'JACKPOT' | 'EMPTY'

[CRITICAL] 오버슈트(overshooting) 방지 패턴 누락 금지
* 감속 중 `remaining < speed` 상태에서 `currentAngle += speed` 를 그대로 실행하면 목표를 지나침
* 반드시 스냅 체크를 물리 업데이트보다 먼저 실행:
  ```js
  if (remaining <= this.speed) {
    this.currentAngle = this.targetAngle; // 강제 스냅
    this.state = 'STOPPED';
    return;
  }
  this.currentAngle += this.speed; // 스냅 체크 통과 후 이동
  ```

```
```
