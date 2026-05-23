# Project Double Down — Developer Spec
> 게임 규칙 — GAME.md | 디자인 규격 — DESIGN.md

---

## 1. Tech Stack

| 항목 | 값 |
|---|---|
| 번들러 | Vite 6 |
| 언어 | TypeScript |
| UI 프레임워크 | React 19 |
| 선언 HUD | @json-render/core + @json-render/react |
| 3D 렌더러 | Three.js r172 (OrthographicCamera, 탑다운 뷰) |
| 데이터 | CSV (public/) + localStorage |

---

## 2. 부팅 순서

1. React App 컴포넌트 마운트. StateProvider · ActionProvider · VisibilityProvider로 GameJsonHud 감싸기
2. 150ms 지연 후 bootstrapGame() 호출 (Provider 안정화 대기)
3. bootstrapGame()이 CSV 3개 fetch 로드 (dd_stage_config, dd_block_config, dd_blocker_config)
4. BoardCore 인스턴스 생성. 생성자 내부에서 Three.js 씬 · 보드 메시 · 입력 핸들러 초기화
5. localStorage 진행 상태 있으면 복원 후 게임 재개. 없으면 dd-entry-modal 표시
6. bootstrapGame() 완료 시 isLoaded = true. 로딩 오버레이 제거

---

## 3. 게임 구조

**BoardCore** — 퍼즐 상태 머신 전체 관리. 블록 스왑 판정, 매치 탐색, 특수 블록 생성, 블로커 타격 처리, 낙하/스폰, 콤보 루프, 아이템 처리, 보너스 타임, 보상 지급, 세션 저장/복원.

**createBoard3D (BoardMount)** — Three.js 보드 렌더링 전담. 블록 메시 생성·이동·파괴, 파티클 시스템, 특수 블록 emissive 애니메이션, CSS2D 콤보 레이블, OrthographicCamera 탑다운.

**createParticleSystem** — 블록 파괴 시 Points 메시 생성·수명 관리. 블록 타입별 컬러·파티클 형태 분기 처리.

**createSpecialFX** — 줄무늬 레이저, 봉지 폭탄 카메라 쉐이크, 미러볼 스파크 아크 전담 이펙트 시스템.

**createInputHandler** — Three.js Raycaster 기반 블록 탭/드래그 감지. pointerdown/pointermove/pointerup → BoardCore.requestSwap() 또는 BoardCore.requestItemUse() 연결.

**hudExternalStore (hudStore)** — flat path 상태 스토어. BoardCore가 syncHud() 호출 시 React HUD 갱신.

**data** — CSV 파싱, localStorage read/write, 보상 이력 관리.

**gameControlBridge** — React 버튼 액션을 BoardCore 메서드로 연결.

---

## 4. json-render HUD 구조

```
BoardCore (Three.js + 게임 로직)
  → syncHud() → hudStore.update({...})
  ↓
hudStore (flat path 스토어)
  ↓ $state 바인딩
GameJsonHud (json-render Renderer)
```

Provider 3개 래핑:
StateProvider → ActionProvider → VisibilityProvider → GameJsonHud

---

## 5. CSV 파일 목록

| 파일 | 내용 |
|---|---|
| dd_stage_config.csv | 스테이지별 미션 타입·무브수·난이도·블로커 레이아웃·별점 기준 |
| dd_block_config.csv | 블록 5종 Theme_ID · 파티클 스펙 참조 |
| dd_blocker_config.csv | 블로커 4종 HP · 작동 규칙 |

---

## 6. 수치 상수 (기획 승인 없이 변경 금지)

| 상수 | 값 | 비고 |
|---|---|---|
| BOARD_SIZE | 9 | 격자 크기 (9×9) |
| BLOCK_UNIT | 1.0 | Three.js world unit 블록 크기 |
| SWAP_LERP_MS | 120 | 블록 스왑 lerp 시간 |
| SWAP_BACK_MS | 150 | 스왑 복귀 Ease-Out-Back 시간 |
| DROP_LERP_MS | 200 | 블록 낙하 lerp 시간 |
| DRAG_SNAP_RATIO | 0.35 | 드래그 스냅 확정 비율 (블록 크기의 35%) |
| DESTROY_TOTAL_MS | 180 | 블록 파괴 총 연출 시간 |
| STRIPED_FX_MS | 220 | 줄무늬 레이저 총 발동 시간 |
| WRAPPED_SECOND_MS | 350 | 봉지 2차 폭발 딜레이 |
| COLOR_BOMB_STAGGER_MS | 16.6 | 미러볼 순차 폭발 stagger (1 frame) |
| CONTINUE_COST_COINS | 100 | 이어하기 코인 비용 |
| CONTINUE_ADD_MOVES | 5 | 이어하기 무브 추가 수 |
| LOW_MOVES_WARNING | 5 | 무브 경고 임계치 (빨간 깜빡임) |
| COMBO_LABEL_DURATION_MS | 1000 | 콤보 레이블 표시 시간 |

---

## 7. DOM 필수 ID 목록

| ID | 역할 |
|---|---|
| `dd-entry-modal` | 입장 모달 |
| `dd-game-screen` | 인게임 화면 |
| `dd-success-modal` | 성공 결과 모달 |
| `dd-fail-modal` | 실패 결과 모달 |
| `dd-board-canvas` | Three.js 캔버스 (pointer-events: auto) |
| `dd-lane-labels` | CSS2D 렌더러 레이어 |
| `mission-display` | 미션 목표 표시 (타입별 아이콘 + 수치) |
| `moves-info` | 제한 이동 횟수 표시 |
| `start-game-btn` | 게임 시작 버튼 (♥️ x1 소모) |
| `wallet-entry` | 하트·코인 표시 (입장 모달) |
| `pause-btn` | 일시정지 버튼 |
| `moves-display` | 남은 무브 수 |
| `target-display` | 미션 타겟 현황 |
| `score-display` | 현재 점수 |
| `score-bar` | 스타 게이지 프로그레스 바 |
| `item-pliers` | 플라이어 아이템 버튼 |
| `item-claw` | 트럼프 클로 버튼 |
| `item-slicer` | 카드 슬라이서 버튼 |
| `finish-banner` | 클리어 배너 (보너스 타임 중 표시) |
| `success-title` | 성공 모달 제목 |
| `star-slots` | 별점 슬롯 (1~3개 순차 연출) |
| `final-score` | 최종 점수 |
| `reward-coins` | 획득 코인 |
| `next-stage-btn` | 다음 스테이지 해금 버튼 |
| `fail-title` | 실패 모달 제목 |
| `remaining-target` | 잔여 미션 수치 |
| `continue-btn` | 이어하기 버튼 (코인 부족 시 비활성) |
| `quit-btn` | 포기 버튼 |

---

## 8. 세션 저장 (localStorage)

| 키 | 구조 |
|---|---|
| `dd_board_state` | `{ board, jelly_board, moves_remaining, score, collected_targets, tiles_broken, puzzle_phase, stage_id }` |
| `dd_wallet_coins` | number |
| `dd_wallet_hearts` | number |
| `dd_reward_ledger` | 보상 이력 배열 |
| `dd_max_stage` | number (해금된 최고 스테이지 ID) |

---

## 9. Three.js 보드 구조

**카메라:** OrthographicCamera 탑다운 뷰
```
position: (0, 0, 10)
lookAt:   (0, 0, 0)
up:       (0, 1, 0)   ← REG-002 필수
```

**블록 좌표 변환 (grid → world)**
```typescript
x = (col - 4) * BLOCK_UNIT   // col 0~8 → x -4~+4
y = (4 - row) * BLOCK_UNIT   // row 0~8 → y +4~-4
z = 0                         // 기본 레이어
```

**렌더 레이어 Z 순서 (renderOrder)**
```
renderOrder 0 : 보드 배경 메시
renderOrder 1 : 젤리 타일 메시
renderOrder 2 : 일반 블록 메시
renderOrder 3 : 특수 블록 메시
renderOrder 4 : 드래그 중인 블록 (z + 0.5 임시 상승)
renderOrder 5 : 파티클 FX Points 메시
renderOrder 6 : CSS2D 레이블 (콤보 텍스트)
```

**Raycaster 입력 처리**
```typescript
// pointerdown → swipeStart: 블록 메시 탐지
raycaster.setFromCamera(pointer, camera);
const hits = raycaster.intersectObjects(blockMeshes);

// pointermove → 드래그 벡터 계산
// 이동량 > DRAG_SNAP_RATIO × BLOCK_UNIT → 방향 확정 → swipeEnd

// 방향 4방향 중 최대 투영 방향 선택 (상/하/좌/우)
```

---

## 10. 퍼즐 상태 머신

```
[INIT]
  | (보드 초기화 완료 — pre-match 차단 검증)
  v
[IDLE] <──────────────────────────────────────────┐
  | (유저 드래그 or 아이템 탭 감지)                 │
  v                                                │
[SWAP]                                            │
  | (lerp 120ms 완료)                              │
  v                                                │
[MATCH_CHECK]                                      │
  |── (매치 없음) ──→ [SWAP_BACK] ────────────────┤
  |                   (lerp 150ms 완료)            │
  v (매치 있음 / 아이템 사용)                       │
[EXPLODE]                                          │
  | (파괴 연출 180ms + 특수 블록 연쇄)              │
  v                                                │
[DROP_SPAWN]                                       │
  | (낙하 200ms + 신규 블록 스폰 완료)              │
  v                                                │
[COMBO_CHECK]                                      │
  |── (추가 매치 있음) ──→ combo_count++ ──→ [EXPLODE]
  |
  v (추가 매치 없음)
[RESULT_CHECK]
  |── (미션 달성 + 잔여 무브 > 0) ──→ [BONUS_TIME] ──→ [SUCCESS]
  |── (미션 달성 + 잔여 무브 = 0) ──→ [SUCCESS]
  |── (moves_remaining = 0 && 미달성) ──→ [FAIL]
  └── (진행 중) ────────────────────────────────────┘
```

---

## 11. 개발 유의사항

**ResizeObserver 기준 (REG-001)**
renderer.setSize()에 window 크기 사용 금지. container.getBoundingClientRect() 기준으로 설정. window 기준 사용 시 기하 팽창 루프 발생 → 씬 소멸. camera.updateProjectionMatrix()는 크기 변경 후 반드시 호출.

**camera.up 설정 (REG-002)**
OrthographicCamera up 벡터를 (0,1,0) 명시 설정. 설정 누락 시 LookAt Singularity 발생 → 화면 백화·NaN 크래시.

**dd-board-canvas pointer-events: auto 필수**
Sky Race와 달리 3매치는 캔버스 Raycaster로 블록을 탭·드래그한다. pointer-events: none 설정 절대 금지. 캔버스가 탭을 직접 수신해야 한다.

**puzzle_phase 입력 잠금 필수**
BoardCore.isLocked = true 상태에서 모든 입력 핸들러 즉시 return. SWAP · MATCH_CHECK · EXPLODE · DROP_SPAWN · COMBO_CHECK · BONUS_TIME 상태에서 isLocked = true. 예외: CLAW 2단계 대기 중은 isLocked = false 유지 (2단계 탭 대기 필요).

**블록 state와 Three.js 메시 분리 원칙**
board 배열 변경(null 처리)과 Three.js 메시 파괴 연출(180ms)을 동시 실행 금지. 연출 완료 콜백에서 state 변경 후 DROP_SPAWN 진입.

**COLOR_BOMB stagger 필수**
동시 폭발 금지. 미러볼 중심 world 좌표 기준 각 타겟 블록까지 거리 계산. 거리 오름차순 정렬 후 1프레임(16.6ms) 딜레이씩 분배.

**블록 스폰 시 초기 매치 방지**
신규 블록 스폰 전 해당 위치에서 3매치가 성립하지 않는 타입을 선택. 조건 만족 타입이 없을 때까지 재선택 루프.

**블로커 HP 변경 후 즉시 syncHud()**
블로커 시각 상태(균열 텍스처 등)는 Three.js 메시에서 직접 처리하나, HP 수치가 HUD에 노출되는 경우 syncHud() 즉시 호출.

**포커 카드 2타 조건 엄격 적용**
face_revealed = true 후에도 동일 문양 블록 인접 매칭 or 특수 블록 타격만 HP -1 처리. 일반 인접 매칭으로 HP -1 처리하면 기획 의도 붕괴.

**룰렛 휠 증식 타이밍**
매 유효 스왑(moves_remaining 차감되는 순간) 후 RESULT_CHECK 진입 전에 룰렛 휠 타격 여부 확인. BONUS_TIME · RESULT_CHECK 이후에는 증식 처리 중단.

**보상 중복 지급 방지**
reward_granted = true 확인 후 보상 처리. 이미 true이면 보상 건너뜀.

**트럼프 클로 취소 처리**
1단계 선택 후 동일 블록 재탭 또는 취소 버튼 → item_claw_first = null, active_item = null, highlight 제거.
