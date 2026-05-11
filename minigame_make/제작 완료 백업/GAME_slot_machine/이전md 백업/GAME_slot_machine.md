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
        - "릴 0 → SPINNING 시작"
        - "릴 1 → 500ms 후 SPINNING"
        - "릴 2 → 1000ms 후 SPINNING"
        - "각 릴 target_symbol에 맞춰 STOPPING → STOPPED"
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

**Blank Paper Sketch** — 모든 UI는 손그림 스케치 느낌. 릴 테두리는 잉크 선, 심볼은 이모지 기반, 배경은 종이색. 화려한 3D 효과 없이 단순하고 명확하게.

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
- 릴 표시 영역: 심볼 1개만 보임 (단일 라인)
- 스크롤 속도: 시작 8px/frame → 목표 심볼 2개 전부터 감속 → 정지
- 목표 심볼 위치 계산: `target_offset = symbol_index × 80px`
- 감속 공식: `speed = max(1, speed × 0.92)` (목표 근접 시)

### 결과 판정
- 3릴 모두 같은 심볼 → WIN (각 심볼 배율 적용)
- wild 포함 → wild가 어떤 심볼로도 대체
- 3릴 모두 다른 심볼 → LOSE

### 애니메이션 명세
- HT-ANI-001 릴 스핀: 8px/frame 등속 → 감속 구간 진입 → 1px/frame → 정지
- HT-ANI-002 WIN 하이라이트: 라인 배경 #f5c842, 0.3s fade in → 1s 유지 → 0.3s fade out
- HT-ANI-003 코인 팝업: "+N 코인" 텍스트, 위로 40px 이동, opacity 0→1→0, 1s
- HT-ANI-004 JACKPOT 플래시: 전체 화면 #f5c842, 3회 점멸 (100ms ON/OFF), 코인 카운터 롤업
- HT-ANI-005 LOSE dim: 심볼 opacity 1→0.4, 0.3s, 0.5초 후 복귀

## UI Architecture

```html
<!-- index.html 고정 구조 — ID/클래스명 수정 금지 -->
<body>
  <div id="app">
    <div id="ui-top">
      <span id="ui-coins">💰 50</span>
      <span id="ui-bet">BET: 1</span>
    </div>
    <div id="reel-container">
      <div class="reel" id="reel-0"><canvas></canvas></div>
      <div class="reel" id="reel-1"><canvas></canvas></div>
      <div class="reel" id="reel-2"><canvas></canvas></div>
    </div>
    <div id="payline"></div>
    <div id="ui-bottom">
      <button id="btn-bet">BET: 1</button>
      <button id="btn-spin">SPIN</button>
      <button id="btn-add-coins" class="debug">+50코인</button>
    </div>
    <div id="ui-result"></div>
  </div>
</body>
```

CSS 규칙:
- `#app`: width 390px, height 844px, margin auto, overflow hidden
- `#reel-container`: display flex, gap 8px, justify-content center
- `.reel`: width 100px, height 80px, overflow hidden, border 2px solid #222
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

1. **Canvas 크기 동기화**:
   - 각 `.reel` canvas 크기는 부모 div의 실제 `clientWidth/clientHeight`로 설정할 것
   - `canvas.width = canvas.offsetWidth` 방식 사용 — `style.width`와 `canvas.width`는 다름
   - `window.addEventListener('resize')`로 캔버스 크기 재동기화 필수

2. **릴 심볼 배열 무한 루프 구조**:
   - 심볼 배열은 순환(circular) 구조로 구현 — 배열 끝에서 처음으로 자연스럽게 이어져야 함
   - `symbol_index = (symbol_index + 1) % symbols.length` 패턴 사용
   - 배열 끝에서 끊기면 릴이 순간 점프하는 버그 발생

3. **감속 후 정확한 심볼 정렬**:
   - 릴 정지 시 `offset_y`가 `target_offset`에 정확히 맞아야 함
   - 감속 후 `offset_y = target_offset`로 강제 스냅 처리 필수
   - 부동소수점 오차로 심볼이 반 칸 밀릴 수 있음

4. **DOMContentLoaded 이후 초기화**:
   - Canvas 초기화는 반드시 `DOMContentLoaded` 이후에 실행
   - `#reel-0`, `#reel-1`, `#reel-2` DOM이 존재한 후 canvas context 획득할 것

5. **completion_checklist 1번 통과 기준**:
   - "릴 3개 순서대로 정지" = 화면에서 실제로 릴이 돌고 멈추는 것을 눈으로 확인
   - 콘솔 에러 없음만으로 통과 선언 금지

## Anti-Patterns

[CRITICAL] 결과를 릴 물리로 결정하면 안 됨
- 릴이 어디서 멈추는지로 결과를 계산하는 구조 금지
- 반드시 spin() 시작 시 weighted_random()으로 선결정 후 릴을 그 위치로 유도

[CRITICAL] 릴 3개 동시 정지 금지
- 반드시 릴 0 → 500ms → 릴 1 → 500ms → 릴 2 순서로 정지
- 동시 정지는 슬롯머신의 핵심 긴장감을 제거함

[CRITICAL] 코인 차감을 결과 판정 후에 하면 안 됨
- spin() 호출 즉시 bet 차감
- 결과와 무관하게 먼저 차감

[CRITICAL] 스핀 중 중복 탭 허용 금지
- 릴 state가 IDLE이 아닌 경우 spin() 호출 차단
- btn-spin을 disabled 처리할 것

HT-ANI-003 (코인 팝업) 생략 금지 — 보상 피드백 핵심 연출
btn-add-coins 디버그 버튼 반드시 구현 — 테스트 필수
