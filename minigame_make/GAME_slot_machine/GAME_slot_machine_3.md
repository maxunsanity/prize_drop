---
identity:
  name: "1라인 슬롯머신"
  id: slot_machine
  genre: "확률/연출형"
  platform: "mobile-first web"
  theme: "Blank Paper Sketch — 손그림 스케치 스타일, 종이 질감, 잉크 선"
  renderer: "Canvas 2D (단일 파일 가능)"
  color:
    background: "#faf8f5"
    ink: "#222222"
    reel_bg: "#ffffff"
    highlight: "#f5c842"
    win_flash: "#f5c842"
    lose_dim: "#cccccc"

implementation:
  bundler: vite
  entry: src/main.js
  index_html: "mount point only — no game logic"
  structure:
    src/main.js: "진입점 — 초기화, 이벤트 바인딩"
    src/game.js: "게임 상태 관리, 스핀 루프"
    src/reel.js: "릴 스크롤 애니메이션, 심볼 렌더링"
    src/mechanics.js: "weighted_random, 결과 판정, 보상 계산"
    src/ui.js: "DOM 업데이트, 코인 카운터, 당첨 연출"
    src/data.js: "symbol_config, paytable CSV 파싱"
  ai_directives:
    read_order:
      - "1. Advanced Implementation Specs 섹션을 가장 먼저 읽는다"
      - "2. Anti-Patterns 섹션을 읽고 과거 버그를 숙지한다"
      - "3. implementation.structure 순서대로 파일을 분리한다"
      - "4. UI Architecture HTML 구조를 토씨 하나 틀리지 않고 반영한다"
    completion_checklist:
      - "스핀 버튼 탭 → 릴 3개 순서대로 정지되는가"
      - "결과가 spin() 호출 전에 선결정되는가"
      - "당첨 시 하이라이트 + 코인 증가 연출이 실행되는가"
      - "코인 0개 → 스핀 불가 처리되는가"
      - "릴이 목표 심볼에 정확히 정지하는가"
    rule: "위 5개 중 하나라도 실패 시 완료 선언 금지. 즉시 수정할 것."

components:
  reel:
    index: integer          # 0, 1, 2 (좌→중→우)
    symbols: list           # 현재 표시 심볼 배열 (위아래 3개 = 총 9개)
    target_symbol: string   # 결과 선결정된 최종 심볼
    speed: float            # 현재 스크롤 속도 (px/frame)
    state: enum             # IDLE / SPINNING / STOPPING / STOPPED
    offset_y: float         # 현재 스크롤 오프셋

  player_state:
    coins: integer          # 보유 코인
    bet: integer            # 현재 베팅액 (1 / 5 / 10)
    total_spins: integer    # 누적 스핀 횟수
    last_result: string     # WIN / LOSE / JACKPOT

entities:
  symbol:
    id: string              # cherry / lemon / bar / seven / wild
    emoji: string           # 🍒 🍋 📊 7️⃣ ⭐
    weight: integer         # 출현 가중치
    payout_multiplier: float  # 베팅액 × 배율 = 보상

mechanics:
  actions:
    spin:
      preconditions:
        - "player_state.coins >= player_state.bet"
        - "모든 릴 state == IDLE"
      effects:
        - "coins -= bet"
        - "result = weighted_random(symbol_config) 선결정 (3릴 각각)"
        - "릴 0 → 0ms SPINNING 시작"
        - "릴 1 → 200ms 후 SPINNING 시작"
        - "릴 2 → 400ms 후 SPINNING 시작"
        - "릴 0 → 600ms 후 STOPPING"
        - "릴 1 → 1000ms 후 STOPPING"
        - "릴 2 → 1400ms 후 STOPPING (전체 시퀀스 약 1.5초)"
        - "각 릴 target_symbol 가운데 칸(2번째 슬롯)에 정확히 정지"
        - "모든 릴 STOPPED → check_result() 호출"

    check_result:
      preconditions:
        - "모든 릴 state == STOPPED"
      effects:
        - "3릴 심볼 조합 판정"
        - "WIN → payout 지급 + win_animation()"
        - "JACKPOT (7-7-7) → jackpot_animation()"
        - "LOSE → dim_animation()"
        - "player_state.last_result 업데이트"
        - "UI 코인 카운터 즉시 갱신"

    change_bet:
      preconditions:
        - "모든 릴 state == IDLE"
      effects:
        - "bet 순환: 1 → 5 → 10 → 1"

  loops:
    - "스핀 → 결과 → 연출 → IDLE 복귀 → 다음 스핀"

  goals:
    primary: "코인을 유지하며 최대한 오래 플레이"
    jackpot: "7-7-7 조합으로 잭팟 달성"

---

## Design Pillars

**결과 선결정 원칙** — 릴이 돌기 전에 결과가 이미 정해진다. 릴 애니메이션은 순수 연출이다. weighted_random()은 spin() 호출 즉시 실행되어야 하며, 물리나 타이밍으로 결과가 바뀌어선 안 된다.

**순차 정지의 긴장감** — 릴 0 → 릴 1 → 릴 2 순서로 500ms 간격 정지. 마지막 릴이 정지할 때까지 결과를 모르는 느낌을 준다. 이것이 슬롯머신의 핵심 흥미 구조다.

**Blank Paper Sketch** — 모든 UI는 손그림 스케치 느낌. 릴 테두리는 잉크 선, 심볼은 이모지 기반, 배경은 종이색. 화려한 3D 효과 없이 단순하고 명확하게. 모든 주요 요소는 `4px solid #222` 테두리와 `4px 4px 0 #222` 블록형 그림자를 가진다.

## User Flow

### 진입
게임 로드 → 초기 코인 50개 지급 → 스핀 버튼 활성화

### 스핀
스핀 버튼 탭 → 베팅액 차감 → 릴 3개 순서대로 회전 시작 → 순서대로 정지 → 결과 판정

### 당첨
WIN → 라인 하이라이트 + 코인 증가 팝업 → IDLE 복귀
JACKPOT → 전체 플래시 + 대량 코인 팝업 → IDLE 복귀

### 낙첨
LOSE → 심볼 dim 처리 → 0.5초 후 IDLE 복귀

### 코인 소진
coins < bet → 스핀 버튼 비활성화 → "코인 부족" 표시 → 충전 버튼 표시

## Mechanics in Depth

### 심볼 가중치 및 배율
```
심볼      이모지  가중치  배율
cherry    🍒     40     2x
lemon     🍋     30     3x
bar       📊     15     5x
seven     7️⃣     10     10x
wild      ⭐      5     20x (잭팟: 세 개 모두 wild = 50x)
```

### 릴 스크롤 구현
- 심볼 높이: 80px
- 릴 표시 영역: **정확히 3개 심볼이 보여야 함** (릴 높이 = 80px × 3 = 240px)
- 당첨 심볼은 반드시 **가운데 칸(2번째 슬롯)**에 정지 — `target_offset = (symbol_index × 80) - 80`
- 스크롤 속도: 시작 8px/frame → 목표 심볼 2개 전부터 감속 → 정지
- 감속 공식: `speed = max(1, speed × 0.92)` (목표 근접 시)
- 당첨 라인 마커: 릴 영역 좌우 중앙에 삼각형 포인터(▶ ◀) 배치

### 릴 순차 타이밍 (정확히 준수)
```
시작: 릴0(0ms) → 릴1(200ms) → 릴2(400ms)
정지: 릴0(600ms) → 릴1(1000ms) → 릴2(1400ms)
전체 시퀀스: 약 1.4~1.5초
```

### 결과 판정
- 3릴 모두 같은 심볼 → WIN (각 심볼 배율 적용)
- wild 포함 → wild가 어떤 심볼로도 대체
- 3릴 모두 다른 심볼 → LOSE

### 애니메이션 명세
- SM-ANI-001 릴 스핀: 8px/frame 등속 → 감속 구간 진입 → 1px/frame → 정지
- SM-ANI-002 WIN 하이라이트: 릴 영역 전체 테두리 깜빡임 #f5c842, 0.3s fade in → 1s 유지 → 0.3s fade out
- SM-ANI-003 비행 코인 이펙트: 당첨 시 릴 중앙에서 🐾 이모지 15~30개 생성 → 곡선 궤적으로 하단 `#ui-coins`로 날아가 소멸 (당첨 금액 비례)
- SM-ANI-004 코인 팝업: "+N 코인" 텍스트, 화면 중앙에서 위로 50px 이동, opacity 0→1→0, 1s
- SM-ANI-005 JACKPOT 플래시: 전체 화면 #f5c842, 3회 점멸 (100ms ON/OFF), 코인 카운터 롤업
- SM-ANI-006 LOSE dim: 심볼 opacity 1→0.4, 0.3s, 0.5초 후 복귀

## UI Architecture

```html
<!-- index.html 고정 구조 — ID/클래스명 수정 금지 -->
<body>
  <div id="app">
    <!-- 머신 프레임 — 마스코트, 타이틀, 릴, 하단 UI 포함 -->
    <div class="machine-frame">
      <!-- 상단 중앙 마스코트 — 프레임 테두리에 걸쳐 배치 -->
      <div id="mascot">🐶</div>
      <div id="machine-title">LUCKY DOG</div>

      <!-- 릴 영역 — 좌우 당첨 라인 마커 포함 -->
      <div id="reel-container-wrapper">
        <div class="payline-marker left">▶</div>
        <div id="reel-container">
          <div class="reel" id="reel-0"><canvas></canvas></div>
          <div class="reel" id="reel-1"><canvas></canvas></div>
          <div class="reel" id="reel-2"><canvas></canvas></div>
        </div>
        <div class="payline-marker right">◀</div>
      </div>

      <!-- 하단 UI — SPIN(원형 대형) + BET(소형) + 코인카운터(하단 중앙) -->
      <div id="ui-bottom">
        <button id="btn-spin">SPIN</button>
        <button id="btn-bet">BET: 1</button>
        <button id="btn-add-coins" class="debug">+50코인</button>
      </div>
      <div id="ui-coins">💰 50</div>
    </div>

    <div id="ui-result"></div>
  </div>
</body>
```

CSS 규칙:
- `#app`: width 390px, height 844px, margin auto, overflow hidden, background #faf8f5
- `.machine-frame`: border 4px solid #222, box-shadow 4px 4px 0 #222, position relative
- `#mascot`: position absolute, top -40px, left 50%, transform translateX(-50%), width 80px, height 80px, border 4px solid #222, border-radius 50%, background #faf8f5, display flex, align-items center, justify-content center, font-size 40px
- `.reel`: width 100px, **height 240px** (심볼 3개 × 80px), overflow hidden, border-right 4px solid #222
- `.reel:last-child`: border-right none
- `.payline-marker`: font-size 20px, color #222, align-self center
- `#btn-spin`: width 130px, height 130px, border-radius 50%, border 4px solid #222, box-shadow 4px 4px 0 #222, font-size 20px, font-weight 900
- `#btn-bet`: width 70px, height 70px, border-radius 50%, border 4px solid #222, box-shadow 4px 4px 0 #222
- `#ui-coins`: background #faf8f5, border 4px solid #222, border-radius 999px, padding 8px 20px, font-weight 900 (알약형)
- `pointer-events: none` on `#ui-result`
- `pointer-events: auto` on buttons

## Content Guidelines

### symbol_config.csv 구조
```
symbol_id, emoji, weight, payout_multiplier
cherry, 🍒, 40, 2
lemon, 🍋, 30, 3
bar, 📊, 15, 5
seven, 7️⃣, 10, 10
wild, ⭐, 5, 20
```

### 로컬 저장
- `localStorage.setItem('sm_coins', coins)` — 세션 간 코인 유지
- 게임 시작 시 localStorage 복구, 없으면 50코인으로 초기화

## Advanced Implementation Specs (AI Directives)
Canvas 2D 기반 슬롯머신 구현 시 반드시 지켜야 할 사항. 과거 시행착오에서 도출된 규칙:

1. **Canvas 크기 동기화 (CRITICAL — 가장 자주 틀리는 부분)**:
   - Canvas 2D는 Three.js와 다르게 `canvas.width/height` attribute를 직접 설정해야 함
   - 반드시 아래 패턴으로만 초기화할 것:
   ```javascript
   window.addEventListener('DOMContentLoaded', () => {
     document.querySelectorAll('.reel').forEach(reelDiv => {
       const canvas = reelDiv.querySelector('canvas');
       canvas.width = reelDiv.clientWidth;    // attribute 설정 (렌더 해상도)
       canvas.height = reelDiv.clientHeight;  // = 240px (심볼 3개)
       // style.width/height는 CSS에서 100%로 이미 처리됨 — 건드리지 말 것
     });
   });
   ```
   - `canvas.style.width = '100px'` 직접 설정 금지 — CSS가 처리
   - `window.innerWidth` 사용 금지 — 반드시 `clientWidth/clientHeight`

2. **릴 심볼 배열 무한 루프 구조**:
   - 심볼 배열은 순환(circular) 구조로 구현 — 배열 끝에서 처음으로 자연스럽게 이어져야 함
   - `symbol_index = (symbol_index + 1) % symbols.length` 패턴 사용
   - 배열 끝에서 끊기면 릴이 순간 점프하는 버그 발생

3. **감속 후 정확한 심볼 정렬**:
   - 당첨 심볼은 반드시 **가운데 칸(2번째 슬롯)**에 정지
   - `target_offset = (symbol_index × SYMBOL_HEIGHT) - SYMBOL_HEIGHT` 공식 사용
   - 감속 후 `offset_y = target_offset`로 강제 스냅 처리 필수 (부동소수점 오차 방지)
   ```javascript
   if (Math.abs(offset_y - target_offset) < 0.5) {
     offset_y = target_offset; // 강제 스냅
     state = 'STOPPED';
   }
   ```

4. **릴 순차 타이밍 정확 준수**:
   - 시작: 릴0(0ms) → 릴1(200ms) → 릴2(400ms)
   - 정지: 릴0(600ms) → 릴1(1000ms) → 릴2(1400ms)
   - `setTimeout` 체이닝으로 구현 — 단순 delay 합산 금지
   ```javascript
   startReel(0);
   setTimeout(() => startReel(1), 200);
   setTimeout(() => startReel(2), 400);
   setTimeout(() => stopReel(0), 600);
   setTimeout(() => stopReel(1), 1000);
   setTimeout(() => stopReel(2), 1400);
   ```

5. **비행 코인 이펙트 좌표 계산**:
   - 출발점/도착점은 반드시 `getBoundingClientRect()`로 실시간 계산
   - 하드코딩된 픽셀값 사용 금지 — 화면 크기 변동 시 오발사 발생
   ```javascript
   const reelRect = document.getElementById('reel-container-wrapper').getBoundingClientRect();
   const coinRect = document.getElementById('ui-coins').getBoundingClientRect();
   const startX = reelRect.left + reelRect.width / 2;
   const startY = reelRect.top + reelRect.height / 2;
   const endX = coinRect.left + coinRect.width / 2;
   const endY = coinRect.top + coinRect.height / 2;
   // 각 코인마다 랜덤 곡선 offset 추가 (bezier curve 느낌)
   ```

6. **completion_checklist 통과 기준**:
   - "릴 3개 순서대로 정지" = 화면에서 실제로 릴이 돌고 멈추는 것을 눈으로 확인
   - "당첨 심볼 가운데 칸" = 당첨 라인 마커(◀ ▶)와 심볼이 정확히 수평으로 일치 육안 확인
   - "비행 코인" = 코인이 `#ui-coins`로 날아가는 것 육안 확인
   - 콘솔 에러 없음만으로 통과 선언 금지

## Anti-Patterns

[CRITICAL] 결과를 릴 물리로 결정하면 안 됨
- 릴이 어디서 멈추는지로 결과를 계산하는 구조 금지
- 반드시 spin() 시작 시 weighted_random()으로 선결정 후 릴을 그 위치로 유도

[CRITICAL] 릴 3개 동시 정지 금지
- 반드시 릴0(600ms) → 릴1(1000ms) → 릴2(1400ms) 순서로 정지
- 동시 정지는 슬롯머신의 핵심 긴장감을 제거함

[CRITICAL] 릴 심볼 2개만 보이는 현상 금지
- 릴 height는 반드시 SYMBOL_HEIGHT × 3 = 240px
- overflow hidden으로 정확히 3개만 표시
- 심볼이 짤리거나 2개만 보이면 target_offset 계산 오류

[CRITICAL] 코인 차감을 결과 판정 후에 하면 안 됨
- spin() 호출 즉시 bet 차감
- 결과와 무관하게 먼저 차감

[CRITICAL] 스핀 중 중복 탭 허용 금지
- 릴 state가 IDLE이 아닌 경우 spin() 호출 차단
- btn-spin을 disabled 처리할 것

[CRITICAL] 비행 코인이 엉뚱한 곳으로 날아가는 현상 금지
- 출발/도착 좌표는 반드시 getBoundingClientRect()로 실시간 계산
- 하드코딩된 픽셀값 사용 금지 — 화면 크기 변동 시 오발사 발생

SM-ANI-003 (비행 코인) 생략 금지 — 보상 피드백 핵심 연출
btn-add-coins 디버그 버튼 반드시 구현 — 테스트 필수
