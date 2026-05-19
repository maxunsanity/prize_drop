---
identity:
  name: "Monopoly Board"
  genre: [casual, board-game, resource-collection, event-minigame]
  platform: [mobile-ios, mobile-android, web]
  players: 1
  pitch: >
    주사위를 굴려 40칸 보드를 순환하며 타일별 보상을 획득하는 1인 보드 게임.
    배수를 선택해 보상을 키우고, 주사위가 소진될 때까지 반복한다.

components:
  game_state:
    phase:
      type: enum
      values: [idle, rolling, moving, result, ended]
      default: idle
    dice:
      type: int
      default: 1000
      note: "보유 주사위 총량. 굴림마다 선택 배수의 dice_cost만큼 차감."
    money:
      type: int
      default: 1000000
    pos:
      type: int
      range: [0, 39]
      default: 0
    stage_id:
      type: int
      range: [1, 10]
      default: 1
    jail_attempts:
      type: int
      range: [0, 3]
      default: 0
      note: "0이면 감옥 상태 아님. 1~3이면 탈출 시도 횟수 남음."
    multiplier_value:
      type: int
      default: 1
      note: "현재 선택 배수. 보상·차감에 곱함."
    dice_cost:
      type: int
      note: "현재 선택 배수의 1회 굴림 소모량."

  tile:
    tile_index: { type: int, range: [0, 39] }
    tile_type:
      type: enum
      values: [GO, LAND_S1, LAND_S2, LAND_S3, LAND_S4, LAND_S5, LAND_S6, LAND_S7, LAND_S8,
               STATION, CHANCE, COMMUNITY, UTILITY_1, UTILITY_2,
               CORNER_VISIT, CORNER_PARK, CORNER_JAIL, TAX_LOW, TAX_HIGH]
    base_reward: { type: int }
    display_name: { type: string }
    icon: { type: string }

entities:
  board:
    components: [tile]
    count: 40
    note: "반시계 방향. 0번 칸(GO)에서 시작해 순환."
  player:
    components: [game_state]
    count: 1

mechanics:
  turn_structure: phase-based

  actions:
    roll_dice:
      actor: player
      preconditions:
        - "phase == idle"
        - "dice >= dice_cost"
      effects:
        - "phase = rolling"
        - "dice -= dice_cost"
        - "d1, d2 랜덤 결정 → roll = d1 + d2"
        - "타임라인이 roll칸만큼 500ms 간격으로 순차 이동"
        - "마지막 칸 도달 시 타일 처리 실행"

    resolve_tile:
      actor: system
      effects:
        - "pos = (pos + roll) % 40"
        - "GO 통과 시 go_reward 자동 지급"
        - "타일 종류에 따라 보상 또는 이벤트 처리"
        - "200ms 후 결과 모달 표시 → phase = result"

    confirm_result:
      actor: player
      preconditions:
        - "phase == result"
      effects:
        - "money와 dice에 결과 반영"
        - "dice >= dice_cost → phase = idle"
        - "dice < dice_cost → phase = ended"

    cycle_multiplier:
      actor: player
      preconditions:
        - "phase == idle"
      effects:
        - "배수를 ×1 → ×2 → ×3 → ×5 → ×10 → ×20 → ×30 → ×50 → ×100 → ×1 순으로 순환"
        - "현재 dice로 감당 불가한 배수는 비활성"

  tile_effects:
    LAND:
      formula: "base_reward × stage.scale × multiplier_value"
    STATION:
      description: "50% 확률로 셧다운 분기, 나머지는 소·중·대 강탈 중 하나"
    CHANCE:
      description: "가중치 카드 뽑기 → 돈·워프·주사위 중 하나"
    COMMUNITY:
      description: "가중치 카드 뽑기 → 돈·주사위·GO이동·정거장이동 중 하나"
    CORNER_JAIL:
      description: "jail_attempts = 3. 더블 성공 시 탈출, 실패 시 벌금 차감. 3회 실패 시 강제 탈출."
    TAX:
      formula: "MIN(tax_value × multiplier, money × 0.3)"
    UTILITY:
      formula: "roll_sum × base_reward × stage.scale × multiplier_value"
    GO:
      formula: "go_reward × stage.scale × multiplier_value"

  loops:
    - name: main_loop
      description: >
        idle → 굴리기 → 타임라인 이동 → 타일 처리 → 결과 모달 → idle.
        주사위 소진 시 ended 전환.
    - name: jail_loop
      description: >
        CORNER_JAIL 착지 시 진입. 더블 성공까지 반복.
        jail_attempts 소진 시 강제 탈출.
    - name: auto_loop
      description: >
        AUTO 토글 ON 상태에서 자동 반복 굴림.
        주사위 부족 또는 공지 모달 진입 시 중단.

goals:
  win:
    - condition: "없음 — 주사위 소진 시 ended로 전환."
  score:
    - metric: money
      formula: "누적 획득 money 총액"
    - metric: total_turns
      formula: "굴린 횟수"
---

## 게임 개요

Monopoly Board는 **주사위를 소비해 40칸 보드를 순환하는 1인 보드 게임**이다.

플레이어는 배수를 선택하고 주사위를 굴린다. 주사위가 굴러가는 동안 타임라인이 칸 단위로 이동하며, 도착한 타일의 종류에 따라 보상이 결정된다. 결과를 확인하고 다시 굴리는 루프가 반복된다.

보상은 **스테이지 스케일(1.0~50.0) × 선택 배수(×1~×100)** 로 계산된다. 같은 타일이라도 스테이지가 높고 배수를 많이 쓸수록 보상이 커진다.

---

## 화면 구성

게임은 **단일 화면**으로 구성된다. 위에서 아래로:

```
┌──────────────────────────────────┐
│ HUD: 주사위 잔량 · 스테이지 · 머니 │
├──────────────────────────────────┤
│ 결과 패널 (착지 시 슬라이드업)      │
├──────────────────────────────────┤
│ 주사위 무대 (Three.js, 5:3 비율)  │
├──────────────────────────────────┤
│ AUTO 토글 │ 굴리기 버튼 │ 배수 버튼 │
├──────────────────────────────────┤
│ 타임라인: 40칸 스트립              │
└──────────────────────────────────┘
```

보드판은 렌더링하지 않는다. 현재 위치는 타임라인 스트립으로만 표현된다.

---

## 플로우

### 기본 루프

```
주사위 굴리기
  → Three.js 주사위 굴림 연출 (약 1.4초)
  → 타임라인이 500ms 간격으로 roll칸 순차 이동
  → 착지 타일 처리
  → 결과 패널 슬라이드업
  → 확인 탭 → 다시 idle
```

### 배수 선택

굴리기 전에 배수 버튼을 탭하면 ×1 → ×2 → ×3 → ×5 → ×10 → ×20 → ×30 → ×50 → ×100 → ×1 순으로 순환된다. 현재 주사위로 감당할 수 없는 배수는 비활성 상태로 표시된다.

### 감옥

CORNER_JAIL 칸에 착지하면 감옥 상태가 된다. 굴리기 버튼이 "탈출 시도"로 바뀐다.

- **더블 성공(d1 == d2):** 탈출 보상 지급 후 정상 흐름 복귀
- **더블 실패:** `jail_fine × multiplier` 차감, 시도 횟수 1 감소
- **3회 모두 실패:** 강제 탈출 (보상 없음)

### 주사위 소진

주사위가 현재 선택 배수의 dice_cost보다 적어지면 게임이 종료(ended)된다. 더 낮은 배수를 선택하면 같은 잔량으로도 계속 굴릴 수 있다.

### AUTO 모드

AUTO 버튼을 탭하면 자동 굴림이 활성화된다. 결과 확인 후 즉시 다음 굴림이 실행된다. 주사위 부족 또는 공지성 모달 진입 시 자동 중단된다.

---

## 타일 종류

| 종류 | 수량 | 효과 요약 |
|---|---|---|
| GO | 1 | 착지·통과 시 go_reward 지급 |
| LAND (S1~S8) | 22 | base_reward × scale × multiplier 지급 |
| STATION | 6 | 셧다운 or 강탈 분기 |
| CHANCE | 3 | 카드 뽑기 → 돈/워프/주사위 |
| COMMUNITY | 3 | 카드 뽑기 → 돈/주사위/GO이동/정거장이동 |
| UTILITY | 2 | 주사위 눈 합 × base_reward × scale × multiplier |
| CORNER_VISIT | 1 | 소액 보상 |
| CORNER_PARK | 1 | park_reward 지급 |
| CORNER_JAIL | 1 | 감옥 진입 (jail_attempts = 3) |
| TAX_LOW | 1 | 소액 세금 차감 |
| TAX_HIGH | 1 | 대액 세금 차감 |

---

## 스테이지 시스템

스테이지는 1~10단계로 구성되며 단계가 높을수록 보상 배율이 커진다.

| 스테이지 | scale | 스테이지 | scale |
|---|---|---|---|
| S1 | 1.0 | S6 | 5.0 |
| S2 | 1.2 | S7 | 8.0 |
| S3 | 1.5 | S8 | 12.0 |
| S4 | 2.0 | S9 | 20.0 |
| S5 | 3.0 | S10 | 50.0 |

> 수치 원본은 `game_data/03_board_stage_economy.csv`. 이 표와 CSV는 항상 동기화해야 한다.

---

## 데이터 파일

| 파일 | 내용 |
|---|---|
| board_tile_config.csv | 40칸 타일 정의 |
| 03_board_stage_economy.csv | 스테이지 10단계 경제 수치 |
| 04_board_cells.csv | 40칸 착지 분기 종류 |
| 01_simulation_defaults.csv | 튜닝값 (jail_fine, go_reward 등) |
| 05_random_branch_rules.csv | 정거장·복불복 확률 |
| 07_text_strings.csv | 모든 UI 문구 |
| 08_event_deck_stub.csv | CHANCE·COMMUNITY 카드 덱 |
| dice_multiplier_config.csv | 배수 9단계 프리셋 |
