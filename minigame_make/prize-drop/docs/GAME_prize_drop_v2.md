---
identity:
  name: Prize Drop Arcade
  genre: [casual, arcade, physics]
  platform: [web, mobile-web]
  players: 1
  pitch: 구슬을 원하는 위치에서 드롭해 핀·범퍼를 통과시키고 하단 슬롯에 착지시켜 번개 에너지를 누적하는 물리 기반 아케이드 게임.

components:
  physics_body:
    restitution:
      type: float
      range: [0.0, 5.0]
    friction_air:
      type: float
      range: [0.0, 1.0]
    friction:
      type: float
      range: [0.0, 1.0]

  reward:
    reward_type:
      type: enum
      values: [Coin, Dice, None]
    reward_amount:
      type: int
      range: [0, 9999999]

entities:
  Ball:
    components: [physics_body]
    states: [airborne, settled]
    attributes:
      restitution: 0.8
      friction_air: 0.001
      friction: 0.0
      spawn_offset_range: 10    # px, 드롭 위치 랜덤 오프셋
      initial_force: 2.0        # 초기 하향 가속력

  Slot:
    count: 7
    components: [reward]
    attributes:
      slot_index: int           # 0~6, 중앙(3)이 잭팟
      reward_lightning: int
      is_jackpot: bool
      weight: int               # 가중치 — 높을수록 착지 확률 높음
      slot_color: string
    # SSoT: game_data/01_slot_lightning.csv

  RewardCircle:
    count: 3
    components: [physics_body, reward]
    attributes:
      restitution: 3.5
      velocity_boost: 1.2       # 충돌 시 구슬 속도 즉시 1.2배 증폭
      radius: int               # 좌(90,150)→30px / 중(180,100)→28px / 우(270,150)→30px
    # SSoT: game_data/04_board_obstacle.csv (type=circle)

  Pin:
    components: [physics_body]
    attributes:
      restitution: 0.6
      radius: 5
    # SSoT: game_data/04_board_obstacle.csv (type=pin)

  TriangleBumper:
    components: [physics_body]
    attributes:
      radius: 32
      base_multiplier: 2.0      # 밑변 = radius × 2 × base_multiplier
      position: wall_flush      # 보드 좌우 외벽에 밀착 배치
    # SSoT: game_data/04_board_obstacle.csv (type=triangle)

  Diamond:
    components: [physics_body]
    attributes:
      radius: 5
    # SSoT: game_data/04_board_obstacle.csv (type=diamond)

  DropButton:
    count: 5
    attributes:
      center_x: int             # SSoT: 30, 105, 180, 255, 330
      size_px: 28

  MultiplierButton:
    count: 4
    attributes:
      level: int                # 1~4
      value: int                # 1, 2, 5, 10
      token_cost: int           # 배수 값과 동일
      visual_style: enum
      values: [normal, bronze, silver, gold]
    # SSoT: game_data/02_multiplier.csv

  BallCount:
    attributes:
      count: int                # 현재 보유 공 수 (기본값 10)
    # SSoT: src/game/gameStore.ts
    # 공이 0개일 때 드롭 버튼 비활성화 + 경고 토스트 표시

  Bumper:
    components: [physics_body]
    attributes:
      type: rect
      radius: int               # 실제 크기 = radius × 2 (10×10px)
      position: above_separator # 슬롯 구분선 상단 끝에 맞춤 배치
    # SSoT: game_data/04_board_obstacle.csv (type=rect)
    # 슬롯 구분선 6개 위 각각 1개씩, 총 6개 (bump_0~5)

  LightningMeter:
    attributes:
      accumulated: int          # 누적 번개 에너지 (기본값 0)
      current_multiplier: int   # 현재 선택된 배수 (기본값 1)

  Milestone:
    count: 5
    components: [reward]
    attributes:
      step: int                 # 1~5
      threshold_lightning: int  # 100, 200, 300, 400, 500 (균등 100 간격)
      reward_type: enum
      values: [Dice]
      reward_amount: int        # 10, 20, 30, 40, 60
      cleared: bool             # 달성 여부
    # SSoT: game_data/03_milestone.csv

mechanics:
  turn_structure: realtime

  actions:
    drop_ball:
      actor: Ball
      params:
        button_index: enum(0|1|2|3|4)
      preconditions:
        - "BallCount.count > 0 (공이 없으면 경고 토스트, 드롭 불가)"
      effects:
        - "선택한 DropButton.center_x ± random(10px) 위치에서 Ball 스폰"
        - "초기 하향 가속력 2.0 적용"
        - "비동기 생성 — 이전 구슬 진행 중 연사 가능"

    select_multiplier:
      actor: MultiplierButton
      params:
        level: enum(1|2|3|4)
      preconditions:
        - "MultiplierButton.token_cost 만큼 토큰 보유"
      effects:
        - "LightningMeter.current_multiplier = MultiplierButton.value"
        - "gameStore.setMultiplier(value) 호출"
        - "이후 슬롯 착지 시 획득 번개 = slot.reward_lightning × current_multiplier"

    collect_slot_reward:
      actor: Ball
      params:
        slot_index: enum(0|1|2|3|4|5|6)
      preconditions:
        - "Ball이 해당 Slot 영역에 충돌"
      effects:
        - "LightningMeter.accumulated += Slot.reward_lightning × current_multiplier"
        - "Slot.is_jackpot == true 이면 잭팟 연출 트리거"
        - "check_milestone 자동 실행"
        - "Ball 소멸"

    check_milestone:
      actor: LightningMeter
      params: {}
      preconditions:
        - "collect_slot_reward 이후 자동 실행"
      effects:
        - "accumulated >= Milestone.threshold_lightning 이고 cleared == false 인 단계 달성 처리"
        - "Milestone.reward_type(Dice) += Milestone.reward_amount"
        - "Milestone.cleared = true"
        - "달성한 모든 단계를 newlyCleared[] 배열로 수집 → rewardModalStore.enqueue() 순차 삽입"
        - "모든 단계 달성 시 complete 모달 마지막에 추가, cycleCount 증가 후 마일스톤 리셋"

  loops:
    - name: 구슬 드롭 루프
      description: >
        드롭 버튼 선택 (공 소비) → 구슬 스폰 → 핀/범퍼/보상원 통과 물리 시뮬레이션
        → 하단 슬롯 착지 → 번개 에너지 획득 → 마일스톤 체크.
        연사 지원으로 여러 구슬이 동시에 보드 위에 존재 가능.
    - name: 마일스톤 루프
      description: >
        번개 에너지 누적이 임계값(100/200/300/400/500)에 도달할 때마다
        주사위 보상(10/20/30/40/60) 지급. 단계는 순차 달성.
        전체 달성 시 "모든 이벤트 완료" 모달 → cycleCount 증가 → 마일스톤 리셋.
    - name: 공 관리 루프
      description: >
        BallCount 0 시 드롭 불가 + 경고 토스트. +10 버튼으로 공 추가.
        공 추가/소비는 gameStore를 통해 React HUD에 즉시 반영.

goals:
  win:
    - condition: "마일스톤 달성 시마다 보상 지급 — 게임 자체는 무한 루프, 세션 종료 없음"
  loss:
    - condition: "없음 — x1 배수는 항상 무료 드롭 가능"
  score:
    - metric: accumulated_lightning
      formula: "슬롯 착지마다 slot.reward_lightning × current_multiplier 누적합산"
---

## Design Pillars

**물리적 쾌감이 먼저** — 구슬이 핀을 튕기고 범퍼를 스치는 물리 반응이 모든 연출보다 우선한다. 수치 하나가 바뀌면 전체 체감이 무너진다.

**가볍고 반복 가능한 루프** — 한 드롭이 3~5초 안에 결과까지 이어지고, 결과를 보자마자 다시 드롭하고 싶어야 한다. 대기 시간이나 확인 단계를 추가하지 않는다.

**보상의 단계적 기대감** — 번개 에너지가 쌓여 마일스톤에 가까워질수록 드롭의 의미가 커진다. 잭팟 한 번으로 단계를 건너뛸 수 있는 가능성이 긴장감을 만든다.

## Mechanics in Depth

### 물리 핵심 수치 (기획 승인 없이 변경 금지)

수십 회 튜닝 끝에 확정된 값이다. 근거는 PRIZE_DROP_DEV_LOG.md 참조.

| 수치 | 값 | 이유 |
|---|---|---|
| RewardCircle restitution | 3.5 | 이 이하면 구슬이 흐릿하게 흘러 박진감 소멸 |
| RewardCircle velocity_boost | 1.2× | Matter.js 에너지 감쇄 한계 수동 보정 |
| Pin restitution | 0.6 | 0.8 이상이면 경로 예측 불가 |
| Ball restitution | 0.8 | 표준 탄성 |
| frictionAir | 0.001 | 부유하는 아케이드 느낌 |
| gravity | 0.6 | Floaty Arcade Style |
| TriangleBumper radius | 32 | 32 미만이면 사이드 틈새 탈출 발생 |
| TriangleBumper base_multiplier | 2.0 | 밑변 = 64px × 2 = 128px, 벽 완전 밀착 |

### 슬롯 보상 분포

슬롯 7개는 보드 하단에 균등 배치. 대칭 구조로 중앙일수록 보상이 높고 가중치가 낮다.

| 슬롯 | 위치 | 번개 | 잭팟 | 가중치 |
|---|---|---|---|---|
| 0, 6 | 양쪽 끝 | 1 | - | 30 |
| 1, 5 | 외측 | 10 | - | 100 |
| 2, 4 | 내측 | 20 | - | 60 |
| 3 | 중앙 | 100 | ✓ | 10 |

**확률 순서 (높음→낮음):** 10번개 > 20번개 > 1번개 > 100번개(잭팟)

가중치 합계(390) 기준 잭팟 실효 확률 약 2.6%. 1번개보다 10번개·20번개가 훨씬 흔하게 나오는 구조 (외측이 가장 넓은 착지 확률).

### 배수 시스템

드롭 전 배수(x1~x10) 선택 시 토큰 비용 발생. 배수는 획득 번개에 곱해진다.

| 레벨 | 값 | 토큰 비용 |
|---|---|---|
| 1 | ×1 | 1 |
| 2 | ×2 | 2 |
| 3 | ×5 | 5 |
| 4 | ×10 | 10 |

- 최대 기대값: 중앙 잭팟(100) × x10 = 1,000번개 → 마일스톤 5단계(500) 단번 초과
- **현재 구현 상태: 배수 버튼 UI + gameStore 연동 완료. 토큰 차감 로직은 Next Task**

### 마일스톤 시스템

번개 에너지가 누적될수록 단계별 임계값 도달 시 주사위 보상 지급.

| 단계 | 임계값 | 보상 | 성격 |
|---|---|---|---|
| 1 | 100 | 주사위 10 | 단기 (첫 세션) |
| 2 | 200 | 주사위 20 | 단기 |
| 3 | 300 | 주사위 30 | 중기 |
| 4 | 400 | 주사위 40 | 중기 |
| 5 | 500 | 주사위 60 | 목표 |

- 단계는 순차 달성 (step 2는 반드시 step 1 이후).
- **균등 간격 설계 의도:** 게이지가 시각적으로 20% 단위로 균등하게 채워진다.
- 5단계 전체 달성 시 "모든 이벤트를 진행하셨습니다!" 완료 모달 → cycleCount 증가 → 마일스톤 리셋 (cycleCount는 유지).
- 복수 단계 동시 달성 시 모달 큐에 순서대로 적재 (한 번에 1개씩 표시).

### 보드 장애물 레이아웃

보드: 360×396px. 슬롯 영역: 하단 25px. 구분선 두께: 8px. 전체 좌표 SSoT는 `game_data/04_board_obstacle.csv`.

```
 [버튼0] [버튼1] [버튼2] [버튼3] [버튼4]   ← X: 30/105/180/255/330
   X=30   X=105  X=180  X=255  X=330

△                 pin  pin                △    Y=30~60  상단 핀 6개 (분산)
△  pin  pin        ●(보상중)   pin  pin  △    Y=40~100 보상원(중앙)
△                                         △    Y=80/210/330 삼각범퍼(벽 밀착)
   ●(보상좌)                  ●(보상우)        Y=150 보상원(좌우)
         pin  pin      pin  pin               Y=210~280 중간 핀 6개
              ◆  ◆  ◆  ◆  ◆                 Y=320 다이아몬드 5개 (슬롯 직전 분기)
  ■ ■ ■ ■ ■ ■                             Y=366 범퍼 네모 6개 (슬롯 구분선 상단)
  [ 1 ] [ 10] [20] [잭팟100] [20] [10] [1 ]  하단 슬롯 7개 (25px 높이)
```

- **삼각형 범퍼 6개** (좌 X=0, 우 X=360 / Y=80, 210, 330): 좌우 벽 밀착, 구슬을 보드 안쪽으로 강제 유도
- **보상 원형 3개**: 좌(90,150) / 중(180,100) / 우(270,150) — 모두 주사위 20
- **상단 핀 6개**: top_L/R_1~3 (Y: 30~60) — 드롭 후 초기 방향 분산
- **중간 핀 6개**: mid_L/R_2~4 (Y: 210~280) — 하단 진입 조절
- **다이아몬드 5개**: Y=320 라인 (X: 100~260) — 슬롯 직전 최종 분기
- **네모 범퍼 6개 (신규)**: bump_0~5, X: 51/103/154/206/257/309, Y=366, 크기 10×10px — 슬롯 구분선 상단 끝에 배치해 공이 구분선을 타고 내려가는 현상 방지

### 멀티볼

비동기 생성으로 연사(spam) 가능. 여러 구슬이 동시에 보드 위에 존재할 수 있으며, 각 구슬은 독립적으로 슬롯 착지 시 보상을 계산한다.

## Content Guidelines

**슬롯 보상 수정 시**
- `game_data/01_slot_lightning.csv` 수정. slot_index는 0~6 고정 (슬롯 수 변경은 보드 레이아웃 전면 재설계 필요).
- `is_jackpot: true`는 반드시 1개만 존재.
- 가중치 합계가 변경되면 실효 확률이 변함 — 기획 승인 필요.

**장애물 추가/수정 시**
- `game_data/04_board_obstacle.csv` 수정. boardBuilder.ts가 type을 읽어 물리 바디를 생성하므로 코드 수정 없이 CSV만으로 추가 가능.
- type은 `pin / circle / triangle / diamond / rect` 중 하나만 허용.
- **새 type 추가 시 반드시 `loadGameData.ts` Zod enum에도 추가** — 누락 시 게임 전체 블랙스크린.
- `rect` 타입: radius 값이 실제 반변(half-size). 10×10px 원하면 radius=5.
- `rect` 렌더링은 `boardBuilder.ts` + `PrizeDrop.ts` 양쪽에 핸들러 필요.
- 삼각형 범퍼 위치 변경 시 반드시 좌우 대칭 유지.
- **장애물 변경 후 시뮬 재실행 필수:** `rm -rf game_data/bank/*.json && node scripts/simulationRunner.mjs 20`

**마일스톤 추가 시**
- `game_data/03_milestone.csv` 수정. step은 순차 정수.
- threshold_lightning은 이전 단계보다 반드시 높아야 함.
- 새 reward_type 추가 시 collect_slot_reward 효과에 처리 로직 추가 필요.

**배수 레벨 추가 시**
- `game_data/02_multiplier.csv` 수정. level은 정수 순차.
- visual_style이 기존 5종 외 추가되면 안티그래비티 디자인 에셋 요청 필요.

**시각 테마 (BPS 유지 원칙)**
- Background: `#f0f0e8` (Vintage Paper) / Ink: `#1a1a1a` / Accent: `#c8c8b8`
- 손그림 느낌 유지 — CanvasTexture 기반 선(Waves, Lines) 사용 권장.
- 새 컴포넌트 추가 시 BPS 컬러 팔레트 내에서 선택.

## Anti-Patterns

**물리 수치 임의 변경 금지** — restitution 3.5 / velocity_boost 1.2× / pin 0.6 / gravity 0.6은 수십 회 튜닝 결과. 변경 시 반드시 기획자 승인 후 PRIZE_DROP_DEV_LOG.md에 기록.

**TriangleBumper radius 32 미만 설정 금지** — 보드 사이드 틈새로 구슬 탈출 발생. base_multiplier 2.0 미만도 동일 문제.

**슬롯 수 7개 변경 금지 (기획 확정 전)** — 슬롯 수가 바뀌면 보드 레이아웃, CSV, HUD 슬롯 표시 전면 재설계 필요.

**배수 버튼을 visual만으로 활성화 금지** — 실제 베팅 로직 연결 전까지 x1 이외 배수 UI를 활성화하면 플레이어 혼선 발생.

**구슬 생성을 동기 방식으로 변경 금지** — 연사 UX를 깨뜨림. 비동기 볼 생성 구조 유지 필수.

**CSV 수정 없이 장애물 하드코딩 금지** — 모든 장애물 좌표는 04_board_obstacle.csv가 SSoT. 코드에 직접 좌표를 박으면 추후 튜닝 시 불일치 발생.

**loadGameData.ts Zod enum과 CSV type 비동기화 금지** — CSV에 새 type 추가 시 Zod enum 미업데이트 → 파싱 실패 → 게임 전체 블랙스크린 (에러 UI 없음). type 추가 3-step: CSV → Zod enum → boardBuilder.ts+PrizeDrop.ts 핸들러.

**simulationRunner.mjs 상수를 boardBuilder.ts와 따로 관리 금지** — 두 파일이 독립적으로 상수를 가짐. 하나만 수정하면 시뮬 경로가 실제 보드와 불일치. 항상 동시 수정 필수.

**구분선 위 범퍼(rect) 삭제 금지** — 얇은 구분선만 있을 경우 공이 구분선 표면을 타고 슬라이딩하는 현상 발생. bump_0~5는 이 문제를 해결하는 필수 충돌체.

**separator_pin 렌더링 복원 금지** — 슬롯 구분선 최상단 핀은 physics body는 유지하되 렌더링을 제거(`label: 'separator_pin'` 필터). 렌더링하면 토큰 영역과 겹쳐 시각 노이즈 발생.

**모달 show() 직접 호출 금지** — 복수 마일스톤 달성 시 show() 연속 호출하면 마지막 것만 표시됨. 반드시 enqueue() 사용.

---

## Implementation

**기술 스택**

| 항목 | 값 |
|---|---|
| 물리 엔진 | Matter.js 0.19 |
| 렌더러 | Three.js 0.160 |
| 선언 UI | @json-render/core + @json-render/react 0.19 |
| 언어 | TypeScript / Vite |
| 유효성 검사 | Zod 3.23 |

**핵심 파일**

| 파일 | 역할 |
|---|---|
| `src/game/PrizeDrop.ts` | 게임 코어 — 보드 시각화, 슬롯 결정(CSV 가중치), BankPlayer 재생, 마일스톤/모달 트리거 |
| `src/game/boardBuilder.ts` | CSV → Matter.js 물리 바디 생성 (rect 포함). 시각화용 좌표 참조에만 사용 (런타임 물리 없음) |
| `src/game/bankPlayer.ts` | 서버 결정 슬롯에 맞는 keyframe JSON 재생. y-flip: `BOARD_CONSTANTS.HEIGHT - y`. fallback: 같은 슬롯 다른 drop_position |
| `src/game/loadGameData.ts` | CSV 파싱 + Zod 유효성 검사 |
| `src/game/runnerDataPaths.ts` | CSV 경로 SSoT (`/game_data/...`) |
| `src/game/hudExternalStore.ts` | `createStateStore` 기반 flat path 스토어 — json-render `$state` 바인딩 공급원 |
| `src/game/milestoneStore.ts` | 마일스톤 게이지 상태 facade (내부적으로 hudStore에 push) |
| `src/game/rewardModalStore.ts` | 보상 모달 큐 (enqueue/dismiss). dismiss → 180ms 후 다음 모달 자동 표시 |
| `src/game/gameStore.ts` | 공 수·배수 상태. `setMultiplier()` → hudStore에 push |
| `src/game/gameControlBridge.ts` | `registerGameInstance` / `dispatchGameAction` — React HUD → 게임 메서드 연결 |
| `src/game/bootstrapGame.ts` | 게임 초기화 진입점 (CSV 로드 → PrizeDrop 생성 → bridge 등록) |
| `src/jsonRender/GameJsonHud.tsx` | **HUD 전체**: json-render ComponentRegistry + Spec + ActionHandlers 통합 파일 |
| `src/catalog/prizedropCatalog.ts` | json-render 카탈로그 정의 (컴포넌트 + 4개 액션 등록) |
| `src/style.css` | BPS 테마 스타일 전체 — HUD 레이아웃 클래스 포함 |
| `src/main.tsx` | React 루트 — StateProvider + ActionProvider + VisibilityProvider 래핑 후 GameJsonHud 렌더링 |
| `scripts/simulationRunner.mjs` | 오프라인 Matter.js 물리 시뮬 → bank JSON 생성 (20경로/조합) |
| `src/components/RewardModal.tsx` | 레거시 컴포넌트 (현재 미사용 — GameJsonHud.tsx의 RewardModalImpl로 대체됨) |

**데이터 SSoT**

| CSV | 내용 |
|---|---|
| `game_data/01_slot_lightning.csv` | 슬롯 7개 — 보상/잭팟/가중치/색상 |
| `game_data/02_multiplier.csv` | 배수 4단계 — ×1/×2/×5/×10 |
| `game_data/03_milestone.csv` | 마일스톤 5단계 — 100/200/300/400/500 |
| `game_data/04_board_obstacle.csv` | 장애물 32개 — 타입(pin/circle/triangle/diamond/rect)/좌표/반지름 |
| `game_data/bank/bank_slot{N}_drop{M}.json` | 슬롯별 사전 시뮬 경로 키프레임 (N=0~6, M=0~4, 총 35파일 × 20경로) |

> **Vite 정적 파일 서빙:** `public/game_data`는 `../game_data` 심링크. fetch(`/game_data/...`)가 개발 서버에서 작동하려면 이 심링크 필수. 새 환경 셋업 시 `mkdir public && ln -sf ../game_data public/game_data` 실행.

**보드 고정 치수 (변경 금지)**

```
전체 컨테이너:  366×646px  (#prize-drop-root)
HUD 레이아웃 (json-render 레이어, position: absolute inset: 0):
  ┌─ PrizedropHudTop     110px  ← 공 카운트 + 배수 + 드롭버튼
  ├─ PrizedropBoardSpacer 396px  ← pointer-events: none, 보드 공간 확보
  ├─ SlotLabels           50px
  └─ MilestoneBar         ~90px  (flex: 1, 남은 공간)
게임 보드 (Three.js, position: absolute top:110px left:3px):
  Width: 360px / Height: 396px
  Slot Area: 하단 25px / 구분선 두께: 8px
드롭 버튼 중심 X: 30, 105, 180, 255, 330 (300px 컨테이너, 양쪽 margin 30px)
  → 시뮬에서도 동일 공식: margin=(360-300)/2=30, x=30+posIndex*(300/4)
버튼 크기: 28px
```

## Next Tasks

| 우선순위 | 과제 | 내용 | 상태 |
|---|---|---|---|
| ✅ | json-render HUD 전환 | Spec/Registry/ActionHandlers/CSS 레이아웃 전체 구성 | **완료** |
| 1 | 배수 토큰 비용 연동 | select_multiplier 시 토큰(공) 차감, 잔액 부족 시 선택 불가 UI | 미완 |
| 2 | 보상 외부 시스템 연동 | 슬롯 착지/마일스톤 달성 시 실제 Dice 재화 서버 전송 | 미완 |
| 3 | 사운드 엔진 연동 | 충돌 이벤트 탄성 비례 효과음 트리거 | 미완 |
| 4 | 공 충전 UX 고도화 | 광고 시청 / 재화 구매 → 공 추가 플로우 연결 | 미완 |

---

## Dev Log

### V2 → V3 주요 변경 사항 (json-render HUD 전환)

**완료 시점:** 2026-05-15

**목적:** main.tsx 직접 React 컴포넌트 구조 → json-render 4-레이어 선언적 HUD 구조로 전환. 차기 AI가 동일한 패턴으로 UI를 추가/수정할 수 있도록 구조 표준화.

**주요 변경:**
- `GameJsonHud.tsx` 신설: Spec + ComponentRegistry + ActionHandlers 통합
- `prizedropCatalog.ts` 액션 4개 등록 (prizedropDropBall/AddBalls/CycleMultiplier/DismissModal)
- `main.tsx` → StateProvider + ActionProvider + VisibilityProvider 래핑 후 GameJsonHud만 렌더링
- HUD 레이아웃 CSS 4클래스 추가: `.prizedrop-hud-root / hud-top / controls-row / board-spacer`
- `public/game_data` 심링크 생성 (Vite 정적 파일 서빙)
- `MilestoneBar.tsx` / `RewardModal.tsx` 컴포넌트 GameJsonHud.tsx 내부로 통합

**발견된 json-render 동작 규칙 (이 패키지 특이사항):**
1. `ComponentRenderProps`에는 `slots` 없음 — children 배열만 지원 (`children?: ReactNode`)
2. `emit: (event: string) => void` — 두 번째 인자 완전 무시. 런타임 파라미터는 dispatchGameAction 직접 호출로 우회
3. Spec 요소에 `props: {}` 미기입 시 `resolveBindings(undefined)` → `Object.entries(undefined)` TypeError
4. `Registry` 타입 노출 없음 → `ComponentRegistry` 사용. `ActionHandler`는 `@json-render/core`에서 임포트
5. `children` JSX에서 `unknown` 타입 직접 사용 불가 → `!!value` 또는 `Number(value)` 변환 필수

---

### V1 → V2 주요 변경 사항

**보드 레이아웃 개편**
- 슬롯 높이 50px → 25px (공이 슬롯 내부에서 튀는 현상 감소)
- 구분선 두께 2px → 8px (공이 얇은 선 표면을 타고 슬라이딩하는 현상 해결)
- 네모 범퍼(rect) 6개 추가: 구분선 상단에 충돌면 확보 → 공 흐름 자연스럽게 유도

**슬롯 확률 재조정**
- 기존: 1번개(가중치 100) > 10번개(50) > 20번개(30) > 잭팟(10) — 끝 슬롯이 너무 자주 나옴
- 변경: 10번개(100) > 20번개(60) > 1번개(30) > 잭팟(10) — 보상감 있는 중간 슬롯이 주력

**마일스톤 재설계**
- 기존: 80/100/120/140/800 — 불균등 간격, 5단계가 너무 멀어 완주 동기 약화
- 변경: 100/200/300/400/500 — 균등 100 간격, 게이지 20% 단위 균등 표시

**배수 축소**
- 기존: ×1/×5/×10/×50/×100 5단계 → 변경: ×1/×2/×5/×10 4단계
- 이유: ×100은 밸런스 파괴 수준. ×10이 긴장감과 보상감의 적정 상한선

**공 관리 시스템 추가**
- 드롭 1회당 공 1개 소비, 초기 10개 지급
- +10 버튼으로 충전, 0개 시 경고 토스트 + 드롭 불가

**보상 모달 시스템 추가**
- 슬롯 착지(잭팟 포함) + 마일스톤 달성 → 큐 기반 모달 순차 표시
- 전체 완주 시 완료 모달 (배경 클릭 닫기 비활성화)

### 핵심 버그 기록

| 버그 | 원인 | 해결 |
|---|---|---|
| 공이 핀을 뚫고 지나감 | bankPlayer.ts가 `this.viewHeight`(≈390) 사용, 핀은 `BOARD_CONSTANTS.HEIGHT`(396) 기준 | bankPlayer.ts 3곳 모두 BOARD_CONSTANTS.HEIGHT로 통일 |
| 게임 전체 블랙스크린 | loadGameData.ts Zod enum에 `rect` 누락 → 전체 파싱 실패 | Zod enum에 `rect` 추가 |
| 마일스톤 모달 스킵 | show() 연속 호출로 덮어쓰기 | enqueue() 큐 시스템으로 교체 |
| 게이지 첫 구간 절반 | 공식 `(step-0.5+seg)/total` 사용 | `(step+seg)/total` 올바른 공식으로 수정 |
| 배수 버튼 드롭 버튼 위 float | `.multiplier-circle`에 `position: absolute` | flex 인라인 배치로 변경 |
| 공이 구분선 타고 슬라이딩 | 구분선이 2px로 너무 얇아 충돌면 없음 | 두께 8px + 상단 rect bumper 추가 |

**json-render 전환 시 발생한 버그 (V3 작업 중)**

| 버그 | 원인 | 해결 |
|---|---|---|
| HUD 전체 미렌더링 ("안떠") | `slots.default` 접근 — `ComponentRenderProps`에 `slots` 없음. `slots.default` → TypeError | `{ children }` 으로 교체. Spec도 `slots.default` → `children` 배열로 변경 |
| 드롭 버튼 눌러도 무반응 | `overlayActionHandlers`에서 `(window as any).gameControl?.release_drop()` — window.gameControl은 어디서도 세팅 안 됨, `?.`로 조용히 실패 | `dispatchGameAction('release_drop', i)` 직접 호출로 교체 |
| HUD 일부 요소 크래시 | `props:{}` 없는 Spec 요소에서 `resolveBindings(undefined)` → `Object.entries(undefined)` TypeError | 모든 Spec 요소에 `props: {}` 필수 |
| 드롭이 항상 중앙(2번)만 | `emit('press', { buttonIndex: i })` — emit은 이벤트명만 받음. 두 번째 인자 완전 무시됨 | `DropButtonsImpl`에서 `dispatchGameAction('release_drop', i)` 직접 호출 |
| TS 빌드 에러 | `Registry` 타입은 `@json-render/react` 미노출. `ActionHandler`도 동일 | `ComponentRegistry` 사용. `ActionHandler`는 `@json-render/core`에서 임포트 |
| 마일스톤 마커 한 점에 집중 | `.ms-track`에 `width` 없음 + `align-items: center` 부모 → 내부 전부 absolute라 intrinsic width=0 | `width: calc(100%-22px); flex-shrink: 0` 추가 |

### json-render 아키텍처 (V3 — 전환 완료)

**구조 요약: 4-레이어**

```
① Catalog     src/catalog/prizedropCatalog.ts
               defineCatalog(schema, { components, actions })
               액션 4개: prizedropDropBall / prizedropAddBalls /
                         prizedropCycleMultiplier / prizedropDismissModal

② Spec/Registry  src/jsonRender/GameJsonHud.tsx
               mainHudSpec (Spec) — 트리 구조 선언
               prizedropRegistry (ComponentRegistry) — 컴포넌트 구현
               overlayActionHandlers (ActionHandler map)

③ State/Bridge  src/game/hudExternalStore.ts  ← createStateStore
               flat path: /hud/ball_count, /hud/multiplier,
                          /hud/session_lightning, /hud/milestone_step,
                          /hud/modal_visible 등
               PrizeDrop.ts / milestoneStore / rewardModalStore / gameStore가
               syncHud() / hudStore.update()로 상태 push

④ Runtime      src/game/PrizeDrop.ts + bankPlayer.ts (Three.js)
               json-render와 완전 분리 — bridge(gameControlBridge.ts)로만 연결
```

**HUD 상태 경로 목록 (hudExternalStore flat keys)**

| 경로 | 타입 | 공급원 |
|---|---|---|
| `/hud/ball_count` | number | gameStore |
| `/hud/multiplier` | number | gameStore |
| `/hud/show_warning` | boolean | gameStore |
| `/hud/session_lightning` | number | milestoneStore |
| `/hud/milestone_step` | number | milestoneStore |
| `/hud/milestone_thresholds` | number[] | milestoneStore |
| `/hud/last_gain` | number | milestoneStore |
| `/hud/show_gain` | boolean | milestoneStore |
| `/hud/cycle_count` | number | milestoneStore |
| `/hud/modal_visible` | boolean | rewardModalStore |
| `/hud/modal_type` | string | rewardModalStore |
| `/hud/modal_step` | number | rewardModalStore |
| `/hud/modal_reward_amount` | number | rewardModalStore |
| `/hud/modal_reward_type` | string | rewardModalStore |
| `/hud/modal_remaining` | number | rewardModalStore |
| `/hud/modal_cycle_count` | number | rewardModalStore |

**json-render 적용 경계 (이 게임 타입의 정답)**
- **HUD 레이어 (json-render 담당):** 공 카운트, 배수, 드롭 버튼, 슬롯 라벨, 마일스톤 바, 보상 모달
- **게임 코어 (Three.js 직접 담당):** 보드 시각화, 공 애니메이션, 물리 좌표 계산
- **연결:** `gameControlBridge.ts`(React→게임), `hudStore.update()`(게임→HUD)
- milestoneStore, rewardModalStore, gameStore는 json-render 외부의 수동 `useSyncExternalStore` 패턴. 이들은 hudStore에 값을 push하는 facade이며 직접 json-render에 연결하지 않음. 이 구조가 Three.js 게임의 적정 경계.
