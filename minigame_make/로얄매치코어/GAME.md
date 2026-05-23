---
identity:
  name: "Project Double Down"
  genre: [puzzle, match3, casual]
  platform: [mobile-ios, mobile-android, web]
  players: 1
  pitch: >
    카지노 카드 문양 블록을 3개 이상 연결해 파괴하는 9×9 3매치 퍼즐.
    줄무늬·봉지·컬러밤 특수 블록과 카드 테이블 테마 블로커 4종이 얽혀
    전략과 시각적 카타르시스를 동시에 제공한다.

components:
  block_state:
    type:
      type: enum
      values: [BLOCK_01, BLOCK_02, BLOCK_03, BLOCK_04, BLOCK_05,
               STRIPED_H, STRIPED_V, WRAPPED, COLOR_BOMB,
               CHIP_RACK, POKER_CARD, DEALERS_SAFE, ROULETTE_WHEEL,
               JELLY_TILE]
      note: >
        BLOCK_01=Spade/Blue, 02=Diamond/Red, 03=Clover/Green,
        04=Heart/Yellow, 05=Star/Purple.
        STRIPED_H/V=가로·세로 줄무늬, WRAPPED=봉지폭탄, COLOR_BOMB=미러볼.
        블로커 4종은 별도 blocker_state 컴포넌트 참조.
    base_type:
      type: enum
      values: [BLOCK_01, BLOCK_02, BLOCK_03, BLOCK_04, BLOCK_05]
      note: "특수 블록의 원본 컬러 참조용 (COLOR_BOMB 시너지 색 판별에 사용)"
    row: { type: int, range: [0, 8] }
    col: { type: int, range: [0, 8] }

  blocker_state:
    blocker_type:
      type: enum
      values: [CHIP_RACK, POKER_CARD, DEALERS_SAFE, ROULETTE_WHEEL]
    row: { type: int }
    col: { type: int }
    hp:
      type: int
      note: "CHIP_RACK=2, POKER_CARD=2, DEALERS_SAFE=3, ROULETTE_WHEEL=4"
    face_revealed:
      type: bool
      default: false
      note: "POKER_CARD 전용. 1타 후 앞면 공개 여부."
    revealed_type:
      type: enum_or_null
      values: [null, BLOCK_01, BLOCK_02, BLOCK_03, BLOCK_04, BLOCK_05]
      note: "POKER_CARD 전용. 공개된 문양 타입."

  jelly_tile:
    row: { type: int }
    col: { type: int }
    hp: { type: int, range: [1, 2], default: 2 }
    cracked: { type: bool, default: false, note: "1타 후 균열 텍스처 오버레이 여부" }

  session_state:
    board:
      type: array
      note: "81칸 배열. 각 요소는 block_state 또는 blocker_state 또는 null."
    jelly_board:
      type: array_or_null
      note: "81칸 배열. 젤리 타일 스테이지에서만 사용. null이면 젤리 없음."
    moves_remaining: { type: int }
    score: { type: int, default: 0 }
    combo_count: { type: int, default: 0 }
    collected_targets:
      type: object
      note: "{ block_type: count } 형태. BLOCK_COLLECTION 미션에서 수집 현황."
    tiles_broken:
      type: int
      default: 0
      note: "TILE_BREAK 미션에서 파괴된 젤리 타일 수."
    puzzle_phase:
      type: enum
      values: [INIT, IDLE, SWAP, SWAP_BACK, MATCH_CHECK,
               EXPLODE, DROP_SPAWN, COMBO_CHECK, BONUS_TIME,
               RESULT_CHECK, SUCCESS, FAIL]
    active_item:
      type: enum_or_null
      values: [null, PLIERS, CLAW, SLICER]
    item_claw_first:
      type: object_or_null
      note: "트럼프 클로 1단계 선택 블록 { row, col }. 2단계 탭 대기 중."
    reward_granted: { type: bool, default: false }

  stage_config:
    stage_id: { type: int }
    mission_type:
      type: enum
      values: [SCORE_TARGET, BLOCK_COLLECTION, TILE_BREAK]
    target_score: { type: int_or_null }
    target_block_type:
      type: enum_or_null
      values: [null, BLOCK_01, BLOCK_02, BLOCK_03, BLOCK_04, BLOCK_05]
    target_block_count: { type: int_or_null }
    target_tile_count: { type: int_or_null }
    moves_given: { type: int }
    difficulty:
      type: enum
      values: [easy, normal, hard]
      note: "easy: α=-3 | normal: α=0 | hard: α=4 (페이월 무브 공식)"
    star_thresholds:
      type: array
      note: "[1성 점수, 2성 점수, 3성 점수]"
    blocker_layout:
      type: array
      note: "[ { blocker_type, row, col } ] 배열"
    jelly_layout:
      type: array_or_null
      note: "[ { row, col, hp } ] 배열. TILE_BREAK 미션에서만 사용."

entities:
  board:
    size: [9, 9]
    note: "좌상단 (0,0) ~ 우하단 (8,8). 총 81 슬롯."
  blocks:
    types: 5
    source: "dd_block_config.csv"
    note: "Theme_ID 변수로 스프라이트 시트 전환 가능. 이벤트 테마 대응."
  special_blocks:
    types: 4
    note: >
      STRIPED_H/V(로켓), TNT, PROPELLER(프로펠러), COLOR_BOMB(라이트볼).
      매칭 형태에 따라 자동 생성. 탭 클릭으로 즉시 발동 가능.
      구버전 WRAPPED = TNT로 변경됨 (Royal Match 기준 정렬).
  blockers:
    types: 4
    source: "dd_blocker_config.csv"
    note: "CHIP_RACK, POKER_CARD, DEALERS_SAFE, ROULETTE_WHEEL."
  stages:
    source: "dd_stage_config.csv"

mechanics:
  turn_structure: turn_based

  actions:
    swap_blocks:
      actor: player
      preconditions:
        - "puzzle_phase == IDLE"
        - "active_item == null"
        - "두 블록이 상하좌우 인접 1칸"
        - "블로커 칸은 스왑 불가"
      effects:
        - "puzzle_phase = SWAP"
        - "두 블록 Three.js lerp 교환 (SWAP_LERP_MS)"
        - "puzzle_phase = MATCH_CHECK"
        - "매치 없음 → puzzle_phase = SWAP_BACK (원위치 lerp, Ease-Out-Back)"
        - "매치 있음 → moves_remaining -= 1 → puzzle_phase = EXPLODE"

    use_item_pliers:
      actor: player
      preconditions:
        - "puzzle_phase == IDLE"
        - "active_item == PLIERS"
        - "대상 칸이 null 아님"
      effects:
        - "대상 블록/블로커 HP -1 즉시 격파 (무브 소모 없음)"
        - "active_item = null"
        - "DROP_SPAWN → COMBO_CHECK"

    use_item_claw:
      actor: player
      preconditions:
        - "puzzle_phase == IDLE"
        - "active_item == CLAW"
      effects:
        - "1단계: item_claw_first = { row, col } 저장, 블록 highlight"
        - "2단계: 거리 무관 두 블록 강제 스왑 (무브 소모 없음)"
        - "MATCH_CHECK → 매치 있으면 EXPLODE, 없어도 SWAP_BACK 없이 확정"

    use_item_slicer:
      actor: player
      preconditions:
        - "puzzle_phase == IDLE"
        - "active_item == SLICER"
      effects:
        - "지정 행 전체 + 열 전체 블록 즉시 파괴 (무브 소모 없음)"
        - "교차점(동일 칸) 중복 처리 방지"
        - "DROP_SPAWN → COMBO_CHECK"

    create_special_block:
      actor: system
      preconditions:
        - "MATCH_CHECK 완료 — 특수 블록 생성 조건 충족"
      effects:
        - "4개 직선(가로) → STRIPED_H (매칭 중심)"
        - "4개 직선(세로) → STRIPED_V (매칭 중심)"
        - "2×2 정사각형 4개 → PROPELLER (좌상단)"
        - "L자·T자 5개 이상 교차 매칭 → TNT (교차점)"
        - "5개 이상 직선 → COLOR_BOMB (매칭 중심)"
        - "감지 우선순위: TNT(교차) > COLOR_BOMB(5직선) > STRIPED(4직선) > PROPELLER(2×2)"

    activate_special_block:
      actor: player
      preconditions:
        - "puzzle_phase == IDLE"
        - "대상 칸이 특수 블록"
      effects:
        - "탭 클릭 한 번으로 즉시 발동 (스왑 불필요)"
        - "moves_remaining -= 1"

    trigger_special_effect:
      actor: system
      preconditions:
        - "특수 블록이 EXPLODE 범위에 포함됨 또는 탭 발동"
      effects:
        - "STRIPED_H 발동 → 해당 행 전체 파괴 (레이저 빔 연출)"
        - "STRIPED_V 발동 → 해당 열 전체 파괴 (레이저 빔 연출)"
        - "TNT 발동 → 3×3 범위 폭발 (폭발 링 연출)"
        - "PROPELLER 발동 → 랜덤 위치로 3회 날아가 타격 (발사체 연출)"
        - "COLOR_BOMB 발동 → 자신의 colorType과 같은 색 전체 거리 stagger 순차 파괴"

    trigger_special_synergy:
      actor: system
      preconditions:
        - "두 특수 블록이 인접 스왑"
      effects:
        - "STRIPED + STRIPED → 행 전체 + 열 전체 십자 파괴"
        - "STRIPED + TNT → 3행 + 3열 교차 파괴"
        - "TNT + TNT → 5×5 초대형 폭발"
        - "COLOR_BOMB + STRIPED → 동일 색 전체를 STRIPED로 변환 후 순차 발동"
        - "COLOR_BOMB + TNT → 동일 색 전체를 TNT로 변환 후 순차 발동"
        - "COLOR_BOMB + COLOR_BOMB → 전체 맵 제거"
        - "[미구현] PROPELLER + STRIPED → 다중 로켓 자동 생성"
        - "[미구현] PROPELLER + TNT → 다수 TNT 생성 후 폭발"
        - "[미구현] COLOR_BOMB + PROPELLER → 동일 색 전체를 PROPELLER로 변환"

    hit_blocker:
      actor: system
      preconditions:
        - "인접 매칭 파괴 또는 특수 블록 폭발 범위에 블로커 포함"
      effects:
        - "CHIP_RACK: 인접 매칭 or 특수 타격 → HP -1. HP=0 시 빈 공간 3곳에 STRIPED 스폰"
        - "POKER_CARD: 1타 → 앞면 공개 (face_revealed=true). 2타는 동일 문양 블록 인접 매칭 또는 특수 타격만 유효"
        - "DEALERS_SAFE: 인접 매칭 or 특수 타격 → HP -1. HP=0 시 주변 3×3 범위 블록 1단계 피해"
        - "ROULETTE_WHEEL: 특수 블록 폭발로만 HP -1. 일반 인접 매칭 타격 무효. 매 턴 타격 없으면 인접 빈 슬롯에 그린벨벳 타일(HP1) 1칸 증식"

    bonus_time:
      actor: system
      preconditions:
        - "미션 달성 성공 (puzzle_phase = SUCCESS 직전)"
        - "moves_remaining > 0"
      effects:
        - "moves_remaining만큼 무작위 일반 블록 1개씩 → STRIPED 강제 변환"
        - "순차 폭발 후 점수 추가 누적"
        - "모두 완료 후 SUCCESS 모달 표시"

  loops:
    - name: match_explode_loop
      description: >
        EXPLODE 상태에서 블록 파괴 → DROP_SPAWN (낙하+스폰) → COMBO_CHECK →
        추가 매치 있으면 combo_count += 1 후 EXPLODE 재진입.
        연쇄가 끝날 때까지 반복. 전 구간 유저 입력 완전 차단.
    - name: special_chain_loop
      description: >
        EXPLODE 범위 내 특수 블록 발동 → 추가 파괴 범위 확장 →
        새로 노출된 특수 블록도 같은 EXPLODE 단계에서 연쇄 발동.
        시너지 조합은 스왑 직후 우선 판별해 단일 폭발로 처리.
    - name: roulette_spread_loop
      description: >
        매 턴(유저 스왑 완료 시) ROULETTE_WHEEL 미타격 확인.
        타격 없으면 인접 빈 슬롯 1칸에 그린벨벳 타일 증식.
        RESULT_CHECK 이후에는 확산 중단.

goals:
  win:
    - condition: "SCORE_TARGET: score >= target_score (이동 소모 중 언제든)"
    - condition: "BLOCK_COLLECTION: collected_targets[target_block_type] >= target_block_count"
    - condition: "TILE_BREAK: tiles_broken >= target_tile_count"
  loss:
    - condition: "moves_remaining == 0 && 미션 미달성"
  score:
    - metric: "획득 별 (1~3개)"
      formula: "score를 stage_config.star_thresholds[0~2]와 비교. 3성 = 최고 코인 보상."
    - metric: "코인 보상"
      formula: "기본 50 Coin + 별 1개당 10 Coin 추가. 3성 = 80 Coin."
---

## Design Pillars

**카타르시스 우선** — 특수 블록 연쇄와 콤보가 터지는 순간의 시각·청각 폭발이 핵심 재미다. 줄무늬 레이저, 봉지 2차 폭발, 미러볼 순차 폭발 세 연출 모두 이 순간을 위해 설계된다.

**수학적 난이도 통제** — 운이 아닌 설계로 승패가 결정된다. Choke-Point 지형과 블로커 HP 합산 공식으로 아이템 소비를 유도한다. 어려움 스테이지는 아이템 없이 수학적으로 클리어 불가.

**카드 테이블 테마** — ♠️ ♦️ ♣️ ♥️ 🌟 5종 블록과 칩랙·포커카드·금고·룰렛 블로커가 카지노 분위기를 완성한다. 블로커는 단순 장애물이 아니라 테마 스토리를 가진다.

---

## Mechanics in Depth

**특수 블록 생성 조건 정리**

| 매칭 형태 | 생성 특수 블록 | 스폰 위치 |
|---|---|---|
| 4연속 직선 (가로) | STRIPED_H | 매칭 중심 인덱스 |
| 4연속 직선 (세로) | STRIPED_V | 매칭 중심 인덱스 |
| L자·T자 5개 이상 교차 | WRAPPED | 교차 꼭짓점 |
| 5연속 직선 | COLOR_BOMB | 매칭 중심 인덱스 |

생성 우선순위: COLOR_BOMB > WRAPPED > STRIPED (동시 조건 충족 시 상위 우선)

**블로커 4종 상세**

- **칩 랙 (HP 2):** 낙하 차단형. 완전 격파 시 맵 빈 공간 3곳에 STRIPED 스폰 (아군 보상형 블로커). 인접 매칭 또는 특수 타격 유효.
- **포커 카드 (HP 2):** 통과형 (블록이 위로 흐름). 1타 후 앞면 공개 — 공개된 문양과 동일한 일반 블록 인접 매칭 또는 특수 블록 타격으로만 2타 처리.
- **딜러의 금고 (HP 3):** 고정형 낙하 차단. 3타 완파 시 주변 3×3 블록에 1단계 피해 (블록 파괴 또는 블로커 HP -1).
- **룰렛 휠 (HP 4):** 특수 블록 폭발 타격만 유효 — 일반 인접 매칭 타격 무효. 매 턴 타격 없으면 인접 빈 슬롯에 그린벨벳 타일(HP 1, 이동 제한 레이어) 1칸 증식.

**페이월 무브 공식**

```
Moves_Given = (Total_Target_HP / 1.4) - α

α = -3  →  쉬움  (평균보다 3턴 여유. 100% 자력 클리어 유도)
α =  0  →  보통  (딱 맞아떨어짐. 50% 클리어)
α =  4  →  어려움 (최소 4턴 부족. 시작 부스터 또는 인게임 아이템 소비 강제)
```

**보너스 타임**
미션 달성 직후 moves_remaining > 0이면 남은 무브 1개당 무작위 일반 블록 1개를 STRIPED로 강제 변환 → 순차 폭발. 추가 점수 누적 후 SUCCESS 모달.

---

## Content Guidelines

**블록 설정 수정 시**
dd_block_config.csv에서 Theme_ID와 파티클 스펙을 수정한다. 코드에 블록 타입을 하드코딩하지 않는다.

**스테이지 수정 시**
dd_stage_config.csv에서 mission_type, moves_given, difficulty, blocker_layout을 수정한다. 어려움 스테이지 α=4 공식을 준수한다.

**블로커 추가 시**
dd_blocker_config.csv에 행을 추가하고 BoardCore의 blocker hit dispatch를 함께 수정한다.

**보상 수정 시**
dd_stage_config.csv의 star_thresholds와 coin_amount를 수정한다. 코드에 코인 지급 값을 하드코딩하지 않는다.

---

## Anti-Patterns

**EXPLODE 중 입력 허용** — 연쇄 연출이 뭉개지고 board 배열과 Three.js 메시 위치가 불일치한다. puzzle_phase != IDLE이면 모든 입력을 차단한다.

**블록 타입 코드 하드코딩** — CSV 수정이 반영되지 않는다. BLOCK_TYPE enum은 CSV에서 로드한다.

**룰렛 휠 일반 매칭 타격 허용** — 기획 의도(특수 블록 강제 소비 유도)가 사라진다. 일반 인접 매칭은 룰렛 휠 HP에 영향을 주지 않는다.

**COLOR_BOMB 동시 폭발** — 미러볼 특성(거리 기반 순차 폭발)이 사라지고 카타르시스가 반감된다. 반드시 거리 기준 COLOR_BOMB_STAGGER_MS (16.6ms) 딜레이 stagger를 적용한다.

**특수 블록 스폰 위치 오류** — 매칭 시작 블록 위치에 스폰하면 유저가 결과를 예측하기 어렵다. 항상 매칭 중심(center index) 위치에 스폰한다.

**포커 카드 2타 조건 무시** — 앞면 공개 후 아무 타격으로 격파되면 퍼즐 난이도가 붕괴된다. 공개된 문양과 동일한 블록 인접 매칭 또는 특수 블록 타격만 2타로 처리한다.

**보상 중복 지급** — reward_granted 플래그 없이 보상 처리 시 연출 재생 등 중복 이벤트로 두 번 지급될 수 있다. 플래그를 먼저 확인한다.

**트럼프 클로 2단계에서 isLocked=true** — 1단계 선택 후 2단계 탭을 기다리는 동안 isLocked를 true로 만들면 2단계 탭이 차단된다. CLAW 2단계 대기 중에는 isLocked=false 유지.
