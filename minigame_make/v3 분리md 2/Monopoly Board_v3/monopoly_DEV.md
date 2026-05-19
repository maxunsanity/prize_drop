# Monopoly Board — Implementation Spec

> 이 파일은 AI가 코드를 구현할 때 읽는 기술 명세서다.
> 게임 규칙은 `GAME.md`, 비주얼 시스템은 `DESIGN.md` 참조.

---

## 기술 스택

| 항목 | 값 |
|---|---|
| 번들러 | Vite ^6 |
| UI 프레임워크 | React ^18 + TypeScript |
| 3D 렌더러 | Three.js r172 (주사위 전용) |
| 선언 UI | @json-render/core ^0.19.0 |
| 데이터 | CSV (game_data/) + localStorage |
| 스타일 | src/wireframe.css |

**스택 정책:** React + TypeScript + Three.js r172 + json-render ^0.19.0 + Vite. 스택 변경 금지.

---

## json-render 아키텍처

`@json-render/core`는 공개 npm 라이브러리가 아니다. **이 프로젝트 전용 선언형 UI 프레임워크**다. 일반 React 컴포넌트로 대체하거나 임의 확장하지 말 것.

### 4레이어 구조

```
[1] Catalog   컴포넌트 타입·액션 등록
              src/catalog/monopolyCatalog.ts
              → 어떤 컴포넌트가 존재하는지 선언

[2] Spec      UI 트리 선언 (JSON)
              src/jsonRender/GameJsonMonopoly.tsx
              → 어떻게 화면에 배치하는지 선언

[3] State     HUD 상태 스토어 ($state 경로)
              src/game/hudExternalStore.ts
              → /hud/diceChip, /hud/modalOpen 등 flat path

[4] Runtime   실제 게임 로직
              src/game/MonopolyGame.ts
              → 게임 상태 변경 → syncMonopolyHud → State 갱신
```

### 데이터 흐름 (단방향)

```
MonopolyGame.ts (상태 변경)
  → syncMonopolyHud.ts
  → hudExternalStore.update({ "/hud/diceChip": "1,000" })
  → Spec의 { $state: "/hud/diceChip" } 가 자동 반영
  → 화면 업데이트
```

### 핵심 규칙

- **$state 경로 수정 시 3곳 동시 패치** — hudExternalStore + Spec $state 문자열 + syncMonopolyHud update 키
- **카탈로그에 타입 추가 시 registry JSX 동시 패치** — 누락 시 렌더 null
- **z.any() 금지** — props는 hudBindProp 좁은 타입만 사용
- **props:{} 누락 금지** — resolveBindings(undefined) → TypeError
- **일반 React 컴포넌트로 대체 금지** — json-render 가시성 엔진 비동기 마운트 특성 있음

---

## 파일 구조

```
src/
  main.tsx                          진입점 — React 루트, CSV 부트
  wireframe.css                     전 UI 스타일 SSoT (DESIGN.md 토큰 구현)
  bootstrapGame.ts                  loadBootstrapData → MonopolyGame 팩토리
  MonopolyShell.tsx                 게임 셸 — Context Provider, HUD 브리지
  playUiContext.tsx                  autoRoll 상태 공유
  MonopolyGameContext.tsx            MonopolyGame React Context
  SeasonEndOverlay.tsx               시즌 종료 오버레이
  RootErrorBoundary.tsx              에러 폴백

  game/
    MonopolyGame.ts                  게임 상태 머신
    tileResolver.ts                  타일 분기·보상 계산
    stageSync.ts                     stage_id → StageRuntime 변환
    loadBoardData.ts                 CSV 로드 + validateBoardGraph
    validateBoardGraph.ts            board_tile_config ↔ 04_board_cells 정합 검증
    gameDataPaths.ts                 CSV 파일명 SSoT
    hudExternalStore.ts              HUD $state 스토어
    gameControlBridge.ts             json-render 액션 ↔ MonopolyGame 연결
    syncMonopolyHud.ts               스냅샷 → HUD 스토어 동기화
    textCopyIds.ts                   07_text_strings text_id 상수
    textFormat.ts                    {key} 템플릿 치환
    types.ts                         모든 타입 정의

  catalog/
    monopolyCatalog.ts               defineCatalog() 진입점
    monopolyCatalogOperationalUi.ts  HUD·타임라인·모달 레지스트리
    monopolyCatalogStubsAndMaterials.ts  CSV 재료 컴포넌트
    monopolyCatalogShared.ts         공통 유틸 (hudBindProp 등)

  jsonRender/
    GameJsonMonopoly.tsx             플레이 Spec — HUD·패널·버튼·주사위·타임라인

game_data/
  00_flow_meta.csv
  01_simulation_defaults.csv
  02_tile_entities.csv
  02b_entity_design_samples.csv
  03_board_stage_economy.csv
  04_board_cells.csv
  05_random_branch_rules.csv
  06_project_resources.csv
  07_text_strings.csv
  08_event_deck_stub.csv
  board_tile_config.csv
  dice_multiplier_config.csv
  player_resources.csv
```

---

## DOM Required IDs

HTML에 반드시 존재해야 하는 id 목록. 임의 추가/변경 금지.

```
screens:
  game-screen
  season-end-screen

hud:
  jr-hud
  jr-result-modal
  roll-btn
  timeline-wrap
  timeline-track
  dice-canvas
  dice-three-mount
  timeline-current-arrow
```

---

## $state 경로 (json-render HUD)

HUD 스토어와 Spec이 공유하는 상태 경로. 수정 시 3곳 동시 패치 필수:
`hudExternalStore.ts` + `Spec $state 문자열` + `syncMonopolyHud.ts update 키`

| 경로 | 타입 | 설명 |
|---|---|---|
| /hud/diceChip | string | 보유 주사위 (toLocaleString) |
| /hud/stageLine | string | 현재 스테이지 표시 |
| /hud/moneyChip | string | 보유 머니 (toLocaleString) |
| /hud/diceStageBody | string | 주사위 무대 텍스트 |
| /hud/rollBtnLabel | string | 굴리기 버튼 레이블 |
| /hud/rollDisabled | boolean | 버튼 비활성화 조건 |
| /hud/rollTitle | string | 굴리기 버튼 title |
| /hud/modalOpen | boolean | 결과 패널 표시 여부 |
| /hud/modalTitle | string | 모달 제목 |
| /hud/modalSubtitle | string | 모달 부제 |
| /hud/modalMoneyLine | string | 모달 머니 행 |
| /hud/modalDiceLine | string | 모달 주사위 행 |

---

## CSV 스키마

### board_tile_config.csv
40칸 타일 정의. tile_index 0~39 연속 필수.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| tile_index | int | 0~39 |
| tile_type | enum | 19종 (GAME.md 타일 종류 참조) |
| base_reward | int | 기본 보상 수치 |
| display_name | string | 타임라인 표시 이름 |
| icon | string | 타임라인 글리프 |

### 03_board_stage_economy.csv
스테이지 10단계 경제 수치. GAME.md 스테이지 표와 항상 동기화.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| stage_id | int | 1~10 |
| scale | float | 보상 전체 배율 |
| shutdown_base_reward | int | 셧다운 기본 보상 |
| shutdown_hit_rate | float | 셧다운 성공 비율 |
| shutdown_blocked_rate | float | 셧다운 막힘 비율 |
| heist_reward_small/medium/large | int | 강탈 소·중·대 보상 |
| heist_rate_small/medium/large | float | 강탈 소·중·대 확률 |
| chance_dice_base | int | 복불복 주사위 보급량 |

### dice_multiplier_config.csv
배수 9단계 프리셋. is_default=true는 반드시 1개만.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| multiplier_id | int | 식별자 |
| multiplier_value | int | 배율 (1/2/3/5/10/20/30/50/100) |
| display_label | string | UI 표시 (×N) |
| dice_cost | int | 1회 굴림 소모 |
| is_default | bool | 기본 선택 (1개만) |

---

## 핵심 구현 규칙

### rollDisabled 수식
```typescript
rollDisabled =
  phase === "rolling" ||
  phase === "moving" ||
  (phase === "ended" && modal == null) ||
  (phase === "idle" && dice < dice_cost && modal?.kind !== "notice")
```

### 타임라인 칸 단위 이동
```typescript
// ✅ 올바른 구현 — 500ms 간격 순차 이동
for (let i = 0; i < roll; i++) {
  currentPos = (currentPos + 1) % 40;
  updateTimelineOffset(currentPos);
  await sleep(500);
}
// ❌ 잘못된 구현 — 한 번에 전체 슬라이드
updateTimelineOffset(finalPos);
```

### GO 통과 — 모듈러 arithmetic
```typescript
// ✅ 올바른 구현 — worldSlot 단조 증가
worldSlot += 1;
if (worldSlot % 40 === 0) grantGoPassReward();

// ❌ 잘못된 구현 — 단순 subtraction (역방향 버그)
const offset = (newPos - oldPos) * TILE_WIDTH;
```

### stageSync 호출 타이밍
```typescript
// ✅ 항상 resolve_tile 시작 시 먼저
const stageRuntime = stageRowToRuntime(findStageRow(stages, stage_id));
const outcome = resolveTileLanding(tile, cell, stageRuntime, ...);
```

### React 18 외부 스토어
```typescript
// ✅ useSyncExternalStore 필수
const hudState = useSyncExternalStore(
  hudStore.subscribe,
  hudStore.getSnapshot,
);
// ❌ useState로 외부 스토어 연동 금지 — 외부 변경 미반영
```

### 연쇄 굴림 조건
```typescript
// ✅ modal == null 반드시 확인
if (phase === "idle" && modal == null && dice > 0 && dice >= dice_cost) {
  requestMonopolyRollDice();
}
```

---

## Anti-Patterns

### 🎥 Three.js / Camera

- **DiceRenderer에 게임 로직 삽입 금지** — 착지 콜백은 d1, d2 전달만
- **resize 시 window.innerWidth/Height 사용 금지** — #dice-canvas getBoundingClientRect() 기준
- **updateProjectionMatrix() 누락 금지** — camera 수치 변경 후 항상 호출

### ⚙️ 게임 로직

- **phase == rolling 중 roll_dice 재호출 금지** — rollDisabled 수식 준수
- **resolve_tile 전 stageSync 누락 금지** — S1 수치로 잘못 계산됨
- **jail_attempts 감소 누락 금지** — 무한 감옥 루프 발생
- **CHANCE 워프 후 pos_old 갱신 금지** — GO 통과 이중 보상 발생
- **AUTO 중 감옥 분기에서 setAutoRoll(false) 호출 금지** — 감옥 탈출 후 AUTO 비작동
- **tryRollDiceIfReadyAfterAck에서 modal null 미확인 금지** — 주사위 부족 notice에서 오굴림

### 📊 데이터 / CSV

- **gameDataPaths.ts 파일명만 수정 금지** — Catalog Zod literal + loadBoardData 헤더 검증 3곳 동시 패치
- **is_default=true 배수 행 2개 이상 금지** — 부트 검증 throw
- **03_board_stage_economy 컬럼 추가 시 StageRow 타입 미패치 금지**

### 🖼️ UI / Layout

- **결과 패널을 전체화면 dim 오버레이로 구현 금지** — 인플로우 패널
- **인라인 style로 레이아웃 결정 금지** — wireframe.css에서만
- **타임라인 전체 거리를 한 번에 슬라이드 금지** — 500ms 순차 이동
- **굴리기 버튼 크기 임의 변경 금지** — 144×144px 고정

### 🔗 json-render

- **$state 경로 수정 시 3곳 미동시 패치 금지**
- **카탈로그에 타입 추가 시 registry JSX 미패치 금지** — 렌더 null
- **z.any() 금지** — props는 hudBindProp 좁은 타입 사용
- **props:{} 누락 금지** — resolveBindings TypeError

### ⚛️ React 18

- **외부 스토어 연동 시 useSyncExternalStore 미사용 금지** (REG-007~009)
  - getSnapshot은 변경 시에만 새 참조 생성
  - 스토어 메서드는 화살표 함수로 선언 (this 바인딩 고정)

### 🎮 Monopoly Board 고유

- **배수 변경 시 idle 외 phase에서 호출 금지**
- **감옥 탈출 시도에 별도 dice_cost 적용 금지** — 현재 선택 배수와 동일
- **타임라인 링 버퍼: GO 통과 시 단순 subtraction 금지** — worldSlot 단조 증가

---

## 버그 기록 (agent_audit_log)

| 버그 | 원인 | 해결 |
|---|---|---|
| GO 통과 시 역방향 타임라인 슬라이드 | 단순 subtraction offset | worldSlot 단조 증가 + bufferOrigin 보정 |
| S1 수치로 보상 계산됨 | stageSync 호출 누락 | resolve_tile 시작 시 stageSync 먼저 |
| 무한 감옥 루프 | jail_attempts -= 1 누락 | 탈출 시도마다 감소 보장 |
| CSV 경로 수정 후 부트 throw | gameDataPaths.ts만 수정 | 3곳 동시 패치 규칙 적용 |
| 모달 닫힘 후 연쇄 굴림 오작동 | modal null 미확인 | tryRollDiceIfReadyAfterAck 조건 강화 |
| AUTO 감옥 진입 후 루프 중단 | setAutoRoll(false) 호출 | 감옥 분기에서 호출 제거 |

---

## 완료 체크리스트

코드 작성 전:
- [ ] Anti-Patterns 전 항목 읽었는가
- [ ] game_data/ CSV 13개 있는가
- [ ] json-render 4레이어 구조 이해했는가

구조 완료 후:
- [ ] npm run dev 정상 구동
- [ ] #game-screen 첫 화면 표시 (콘솔 에러 없음만으로 불충분 — 육안 확인)
- [ ] validateBoardGraph 부트 검증 통과

로직 완료 후:
- [ ] roll_dice → 타임라인 칸 단위 이동 → 결과 패널 표시
- [ ] confirm_result → money/dice 갱신 → phase = idle
- [ ] dice < dice_cost → phase = ended → season-end-screen
- [ ] CORNER_JAIL → jail_loop 동작
- [ ] AUTO 토글 → 자동 굴림 루프 동작

완료 전:
- [ ] npm run build 통과
- [ ] 일반 착지·감옥·AUTO·배수 순환·연쇄 굴림 전체 확인

---

## 세션 저장

| 키 | 구조 |
|---|---|
| monopoly_game_state | `{ phase, dice, dice_multiplier_current_id, money, pos, roll, d1, d2, stage_id, jail_attempts }` |

---

## 실행 명령

```bash
npm install
npm run dev      # localhost:5173
npm run build    # dist/
npm run preview
```
