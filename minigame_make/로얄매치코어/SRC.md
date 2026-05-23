# Project Double Down — Source Reference
> 구현 상세 모음. 변수명·함수명·클래스명·CSS 값·HTML ID·임포트명 등 소스 레벨 정보.
>
> ⚠️ 스펙 문서(DEV.md)가 정본. 구현 중 차이 발생 시 하단 '스펙 vs 실제 차이 기록'에 추가.

---

## CSS Custom Properties (src/style.css)

```css
:root {
  --felt:       #0e3d26;   /* 메인 배경 — 카지노 벨벳 */
  --felt-dark:  #051c11;   /* 배경 radial 그라데이션 끝 */
  --gold:       #f5a623;   /* 포인트 컬러 — 강조·버튼 */
  --gold-light: #fbbf24;   /* Gold 하이라이트·글로우 */
  --card:       #f0e6d3;   /* 블록 문양·텍스트 */
  --ink-dark:   #0f172a;   /* 팝업·모달 배경 */
  --slate:      #94a3b8;   /* 보조 텍스트·비활성 */
}
```

### 블록 컬러 (Three.js 직접 사용 — CSS Var 없음)

```typescript
const BLOCK_COLORS = {
  BLOCK_01: { bg: 0x1d4ed8, particleA: 0x0055FF, particleB: 0x00FFFF }, // Spade  Blue
  BLOCK_02: { bg: 0xdc2626, particleA: 0xFF0033, particleB: 0xFF6688 }, // Diamond Red
  BLOCK_03: { bg: 0x16a34a, particleA: 0x009933, particleB: 0x99FF33 }, // Clover Green
  BLOCK_04: { bg: 0xca8a04, particleA: 0xFFCC00, particleB: 0xFFFF66 }, // Heart  Yellow
  BLOCK_05: { bg: 0x7c3aed, particleA: 0x9900FF, particleB: 0xFF00FF }, // Star   Purple
} as const;
```

### 추가 컬러

```typescript
const EXTRA_COLORS = {
  BRONZE:   '#cd7f32',  // 1성 배지
  SILVER:   '#9b9b9b',  // 2성 배지
  GOLD:     '#f5a623',  // 3성 배지
  WARNING:  '#ef4444',  // 무브 5 이하 경고
} as const;
```

---

## 파일 구조

```
src/
  main.tsx                  진입점 — React 루트, Provider 래핑
  App.tsx                   150ms 딜레이 후 bootstrapGame()
  game/
    BoardCore.ts            퍼즐 상태 머신 — 스왑, 매치, 특수블록, 블로커, 아이템, 보상
    bootstrapGame.ts        CSV 로드 + BoardCore 생성
    gameControlBridge.ts    attachBoardGameHooks 브리지
    hudExternalStore.ts     flat path 스토어
    data.ts                 CSV 파싱, localStorage read/write
  three/
    board3d.ts              보드 메시 생성·이동·파괴, CSS2D 레이블 (createBoard3D)
    particleSystem.ts       블록 파괴 파티클 Points 생성·수명 관리
    specialFX.ts            줄무늬 레이저, 봉지 쉐이크, 미러볼 스파크 아크
    inputHandler.ts         Raycaster 탭·드래그 → BoardCore 연결 (createInputHandler)
  jsonRender/
    GameJsonHud.tsx         HUD Spec + Registry + ActionHandlers
    hudSync.ts              syncHud()
  style.css

public/
  dd_stage_config.csv
  dd_block_config.csv
  dd_blocker_config.csv
```

---

## HTML DOM ID 목록

```
모달/화면:
  dd-entry-modal       입장 모달
  dd-game-screen       인게임 화면
  dd-success-modal     성공 결과 모달
  dd-fail-modal        실패 결과 모달

Three.js:
  dd-board-canvas      Three.js 캔버스 (pointer-events: auto ← 변경 금지)
  dd-lane-labels       CSS2D 렌더러 레이어

입장 모달:
  mission-display      미션 목표 표시 (타입별 아이콘 + 수치)
  moves-info           제한 이동 횟수
  start-game-btn       게임 시작 버튼 (♥️ x1 소모)
  wallet-entry         하트·코인 표시

인게임 HUD:
  pause-btn            일시정지 버튼
  moves-display        남은 무브 수
  target-display       미션 타겟 현황
  score-display        현재 점수
  score-bar            스타 게이지 프로그레스 바
  item-pliers          플라이어 버튼
  item-claw            트럼프 클로 버튼
  item-slicer          카드 슬라이서 버튼
  finish-banner        클리어 배너

성공 모달:
  success-title        STAGE CLEARED!
  star-slots           별점 슬롯 (1~3개 순차 팝)
  final-score          최종 점수
  reward-coins         획득 코인
  next-stage-btn       다음 스테이지 해금 버튼

실패 모달:
  fail-title           OUT OF MOVES!
  remaining-target     잔여 미션 수치
  continue-btn         이어하기 (🪙 100 Coin, 부족 시 비활성)
  quit-btn             포기 버튼
```

---

## Provider 래핑 순서 (main.tsx)

```tsx
<StateProvider store={hudExternalStore}>
  <ActionProvider handlers={actionHandlers}>
    <VisibilityProvider>
      <GameJsonHud />
    </VisibilityProvider>
  </ActionProvider>
</StateProvider>
```

---

## $state 경로 (hudExternalStore.ts)

```typescript
'/hud/movesRemaining'    // 남은 무브 수 (number)
'/hud/lowMoves'          // 무브 5 이하 경고 (boolean)
'/hud/targetDisplay'     // 미션 타겟 현황 텍스트 (예: "12/30")
'/hud/scoreDisplay'      // 현재 점수 (number)
'/hud/scoreBarPct'       // 스타 게이지 퍼센트 0~100 (number)
'/hud/activeItem'        // 활성 아이템 (null | 'pliers' | 'claw' | 'slicer')
'/hud/walletCoins'       // 보유 코인 (number)
'/hud/walletHearts'      // 보유 하트 (number)
'/hud/continueEnabled'   // 이어하기 버튼 활성 여부 (boolean, 코인 100+ 체크)
```

---

## gameControlBridge 훅 이름 (고정 — 변경 금지)

```typescript
attachBoardGameHooks({
  startGame:    () => boardCore.startGame(),
  pauseGame:    () => boardCore.pauseGame(),
  resumeGame:   () => boardCore.resumeGame(),
  activateItem: (type: ItemType) => boardCore.activateItem(type),
  claimReward:  () => boardCore.claimReward(),
  continueGame: () => boardCore.continueGame(),
  quitGame:     () => boardCore.quitGame(),
});
```

---

## 카탈로그 액션 이름

```
ddStartGame       — 게임 시작 (하트 소모)
ddPause           — 일시정지
ddResume          — 재개
ddActivateItem    — 아이템 활성화 (payload: { type: 'pliers'|'claw'|'slicer' })
ddContinue        — 이어하기 (100코인 소모)
ddClaimReward     — 보상 확인 후 로비 복귀
ddQuit            — 포기 후 로비 복귀
```

---

## 수치 상수 (BoardCore.ts)

```typescript
const BOARD_SIZE              = 9;      // 격자 크기
const BLOCK_UNIT              = 1.0;    // Three.js world unit
const SWAP_LERP_MS            = 120;    // 블록 스왑 lerp
const SWAP_BACK_MS            = 150;    // 스왑 복귀 Ease-Out-Back
const DROP_LERP_MS            = 200;    // 블록 낙하 lerp
const DRAG_SNAP_RATIO         = 0.35;   // 드래그 스냅 확정 비율
const DESTROY_TOTAL_MS        = 180;    // 블록 파괴 총 연출
const STRIPED_FX_MS           = 220;    // 줄무늬 레이저 총 발동
const WRAPPED_SECOND_MS       = 350;    // 봉지 2차 폭발 딜레이
const COLOR_BOMB_STAGGER_MS   = 16.6;   // 미러볼 stagger (1 frame)
const CONTINUE_COST_COINS     = 100;
const CONTINUE_ADD_MOVES      = 5;
const LOW_MOVES_WARNING       = 5;
const COMBO_LABEL_DURATION_MS = 1000;
```

---

## Three.js 카메라 규칙 (REG-001, REG-002)

```typescript
// REG-002: camera.up 설정 필수
camera.up.set(0, 1, 0);
// ❌ 설정 누락 → LookAt Singularity → 화면 백화·NaN 크래시

// REG-001: ResizeObserver 기준 (window 금지)
const { width, height } = container.getBoundingClientRect();
renderer.setSize(width, height);
camera.updateProjectionMatrix();
// ❌ window.innerWidth/Height → 기하 팽창 루프 → 씬 소멸
```

---

## Raycaster 입력 패턴

```typescript
// ✅ dd-board-canvas에서 직접 이벤트 수신 (pointer-events: auto)
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup',   onPointerUp);

// 블록 탐지
raycaster.setFromCamera(normalizedPointer, camera);
const hits = raycaster.intersectObjects(blockMeshGroup.children);
if (hits.length > 0) {
  const blockMesh = hits[0].object;
  // blockMesh.userData.row, blockMesh.userData.col
}

// ❌ Sky Race 방식(투명 DOM 레이어) 사용 금지 — 3매치는 Raycaster 필수
```

---

## puzzle_phase 입력 잠금 패턴

```typescript
// BoardCore 내부
get isLocked(): boolean {
  if (this.active_item === 'claw' && this.item_claw_first === null) {
    return false; // CLAW 1단계 대기 — 잠금 해제 예외
  }
  return this.puzzle_phase !== 'IDLE';
}

// 모든 입력 핸들러 첫 줄
if (boardCore.isLocked) return;
```

---

## COLOR_BOMB stagger 패턴

```typescript
// ✅ 거리 기반 딜레이 (미러볼 중심 기준)
const bombWorld = gridToWorld(bombRow, bombCol);
const targets = getColorTargets(absorbedType);

targets
  .map(t => ({ ...t, dist: gridToWorld(t.row, t.col).distanceTo(bombWorld) }))
  .sort((a, b) => a.dist - b.dist)
  .forEach((t, i) => {
    setTimeout(() => destroyBlock(t.row, t.col), i * COLOR_BOMB_STAGGER_MS);
  });

// ❌ 동시 폭발 — 카타르시스 소멸
targets.forEach(t => destroyBlock(t.row, t.col));
```

---

## 초기 매치 방지 스폰 패턴

```typescript
// 신규 블록 타입 선택 시
function getSpawnType(row: number, col: number): BlockType {
  const types: BlockType[] = ['BLOCK_01','BLOCK_02','BLOCK_03','BLOCK_04','BLOCK_05'];
  let type: BlockType;
  do {
    type = types[Math.floor(Math.random() * types.length)];
  } while (wouldCreateMatch(row, col, type));
  return type;
}
```

---

## Ease-Out-Back 공식

```typescript
// SWAP_BACK 탄성 복귀에 사용
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
```

---

## localStorage 키

```
dd_board_state      → { board, jelly_board, moves_remaining, score,
                         collected_targets, tiles_broken, puzzle_phase, stage_id }
dd_wallet_coins     → number
dd_wallet_hearts    → number
dd_reward_ledger    → 보상 이력 배열
dd_max_stage        → number (해금된 최고 스테이지 ID)
```

---

## CSS 핵심 클래스

```css
/* 모달·카드 */
border: 1px solid rgba(245,166,35,0.4);
border-radius: 24px;

/* 버튼 */
border: 2px solid var(--gold);
border-radius: 12px;
box-shadow: 2px 2px 0 var(--gold);

/* 버튼 눌림 */
transform: translate(2px, 2px);
box-shadow: none;

/* 배지·칩 */
border-radius: 999px;

/* 아이템 슬롯 활성 */
border: 2px solid var(--gold);
transform: scale(1.05);
```

---

## 패키지 버전

```json
{
  "@json-render/core": "^0.19.0",
  "@json-render/react": "^0.19.0",
  "react": "^19",
  "react-dom": "^19",
  "three": "r172",
  "typescript": "^5",
  "vite": "^6",
  "zod": "^4"
}
```
npm install 시 `--legacy-peer-deps` 필수.

---

## 스펙 vs 실제 차이 기록

| 항목 | 스펙 문서 | 실제 구현 |
|---|---|---|
| — | — | 개발 진행 중 차이 발생 시 여기에 기록 |
