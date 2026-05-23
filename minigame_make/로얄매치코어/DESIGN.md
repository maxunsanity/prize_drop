# Project Double Down — Design System
> 게임 규칙 — GAME.md

**테마:** 다크 — Casino Felt (카지노 벨벳 그린)

짙은 카지노 벨벳 펠트 위에서 카드 문양 블록이 빛나는 구조. 골드 포인트가 화려함을 더하고, 블록 파괴 시 파티클이 어둠 속에서 폭발적으로 터진다. 빛나는 특수 블록과 어두운 배경의 대비가 시각적 카타르시스를 극대화한다. 그라데이션·블러 금지.

---

## Colors

| 이름 | HEX | 역할 |
|---|---|---|
| Felt Green | #0e3d26 | 메인 배경 — 카지노 벨벳 |
| Felt Dark | #051c11 | 배경 radial 그라데이션 끝 |
| Gold | #f5a623 | 포인트 컬러 — 강조·버튼·Gold 테두리 |
| Gold Light | #fbbf24 | Gold 하이라이트·글로우 |
| Card White | #f0e6d3 | 블록 문양·텍스트 |
| Ink Dark | #0f172a | 팝업·모달 배경 |
| Slate | #94a3b8 | 보조 텍스트·비활성 UI |

### 블록 고유 컬러

| 블록 | ID | 배경 HEX | 파티클 A | 파티클 B | 파티클 형태 |
|---|---|---|---|---|---|
| ♠️ Spade | BLOCK_01 | #1d4ed8 (Blue) | #0055FF | #00FFFF | 뾰족한 삼각형 8개 |
| ♦️ Diamond | BLOCK_02 | #dc2626 (Red) | #FF0033 | #FF6688 | 다이아 가루 12개 |
| ♣️ Clover | BLOCK_03 | #16a34a (Green) | #009933 | #99FF33 | 둥근 나뭇잎 6개 |
| ♥️ Heart | BLOCK_04 | #ca8a04 (Yellow) | #FFCC00 | #FFFF66 | 반쪽 하트 파편 8개 |
| 🌟 Star | BLOCK_05 | #7c3aed (Purple) | #9900FF | #FF00FF | 빛나는 별가루 16개 |

### 추가 컬러 (CSS Var 없음)

| 용도 | HEX |
|---|---|
| 1성 배지 | #cd7f32 (Bronze) |
| 2성 배지 | #9b9b9b (Silver) |
| 3성 배지 | #f5a623 (Gold) |
| 무브 경고 (5 이하) | #ef4444 (Red) |
| 블록 내부 테두리 | rgba(255,255,255,0.1) |

---

## Typography

**폰트:** 시스템 폰트 (웹폰트 없음)

```css
font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
```

| 영역 | 성격 |
|---|---|
| 무브 수·점수 큰 숫자 | 매우 굵게 (font-black), 즉시 인식 |
| 모달 제목 | 굵게, Gold 컬러 강조 |
| 코인·보상 수치 | 굵게, Gold Light 컬러 |
| 블록 문양 이모지 | 중앙 정렬, 블록 크기에 맞춤 |
| 보조 텍스트 | 작고 가늘게, Slate 컬러 |
| 콤보 텍스트 (CSS2D) | 굵게, 빠른 fade-out |

---

## Shape & Elevation

**블록 형태:** 정사각형 (Three.js PlaneGeometry). 블록 간 1px 간격.

**테두리 규칙:** 블록 — `rgba(255,255,255,0.1)` 미세 내부 테두리. 선택·활성 블록 — Gold 외곽 글로우 (emissive).

**섀도 규칙:** 블록에 블러 섀도 사용 금지. Three.js 메시 emissive로 발광 표현. DOM UI 요소(버튼·카드)는 하드 드롭 섀도 사용.

**반지름:**
- 모달·카드: 24px
- 버튼: 12px
- 배지·칩: 999px (pill)
- 아이템 슬롯: 12px

**버튼 눌림 상태:** `transform: translate(2px, 2px)` + 섀도 제거.

**모달:** 반투명 다크 배경 오버레이 (`rgba(0,0,0,0.85)`). 카드 패널 `border: 1px solid rgba(245,166,35,0.4)` + 24px 반지름.

---

## Layout

```
전체 화면 기준

[1] Entry Modal (#dd-entry-modal)
    중앙 카드 (최대 400px)
    .modal-eyebrow   (스테이지 번호)
    .modal-title     (STAGE N)
    #mission-display (미션 목표 — 타입별 아이콘 + 수치)
    #moves-info      (제한 이동 횟수 표시)
    #wallet-entry    (하트 수 + 코인 수)
    #start-game-btn  (게임 시작 — ♥️ x1 소모)

[2] In-Game Screen (#dd-game-screen)
    전체 화면
    #dd-board-canvas   (Three.js 캔버스, pointer-events: auto — Raycaster)
    #dd-lane-labels    (CSS2D 렌더러 — 콤보 텍스트 등 보드 위 레이블)
    .game-hud-top      (상단 HUD — 일시정지 | 무브 수 | 미션 타겟)
    .game-hud-bottom   (하단 HUD — 스타 게이지 바 | 아이템 슬롯 3종)

[3] Success Modal (#dd-success-modal)
    중앙 카드 (최대 400px)
    #success-title     (STAGE CLEARED!)
    #star-slots        (별점 1~3개 순차 팝 연출)
    #final-score       (최종 점수)
    #reward-coins      (🪙 획득 코인)
    #next-stage-btn    (다음 스테이지 해금 버튼)

[4] Fail Modal (#dd-fail-modal)
    중앙 카드 (최대 400px)
    #fail-title        (OUT OF MOVES!)
    #remaining-target  (잔여 미션 수치 표시)
    #continue-btn      (이어하기 — 🪙 100 Coin 소모)
    #quit-btn          (포기 — 로비 복귀)
```

세 화면은 순차적으로 전환된다. 동시에 두 화면이 표시되지 않는다.

---

## Components

**Entry Modal**
스테이지 진입 전 미션 확인 화면. 다크 카지노 배경에 Gold 테두리 카드. 미션 타입별 아이콘과 목표 수치. 하트 0개 시 시작 버튼 비활성.

**보드 (Three.js)**
9×9 격자. 각 블록은 PlaneGeometry 메시 + 고유 컬러 MeshStandardMaterial. OrthographicCamera 탑다운 뷰. 블록 파괴 시 Points 파티클 폭발. 특수 블록은 emissive 글로우로 일반 블록과 시각적 구분.

**HUD Top**
```
[⏸ 일시정지]    [MOVES: 25]    [♥️ 0/30]
```
무브 5 이하: 숫자 빨간색 깜빡임. 미션 타겟 달성 시 체크 표시.

**HUD Bottom**
```
[⭐️────────⭐️────────⭐️]  ← 스타 게이지 바
[  🛠️ 플라이어  |  🐾 클로  |  🪓 슬라이서  ]
```
활성 아이템: Gold 테두리 + scale(1.05) 펄스 애니메이션.

**콤보 레이블 (CSS2D)**
COMBO_CHECK에서 combo_count >= 2 시 보드 중앙 Three.js 좌표 기준 "COMBO x2" 팝업. 1000ms 후 fade-out.

**성공 모달**
별점 연출: 통! 통! 통! 순차 Gold 팝 파티클 이펙트. 보너스 타임 점수 합산 후 최종 표시.

**실패 모달**
이어하기 버튼: 코인 100개 미만 시 비활성. 잔여 미션 수치로 유저 아쉬움 자극.

---

## Animations

| 이름 | 트리거 | 성격 |
|---|---|---|
| 블록 스왑 | 드래그 확정 (35% 이상 이동) | lerp 120ms, ease-out |
| 스왑 복귀 | 매치 없음 | Ease-Out-Back 150ms, 5px 초과 후 탄성 안착 |
| 블록 터치 수축 | pointerdown | Squash (X 1.1 / Y 0.9), 50ms |
| 블록 파괴 | EXPLODE 확정 | 수축 50ms → 파티클 버스트 70ms → 연기 60ms (총 180ms) |
| 블록 낙하 | DROP_SPAWN | lerp 200ms, ease-in-out |
| 블록 대기 (idle) | 타입별 루프 | 맥동·광택·회전 등 타입 고유 idle 애니메이션 |
| 줄무늬 레이저 | STRIPED 발동 | 진동 100ms → 레이저 관통 120ms (총 220ms) |
| 봉지 1차 폭발 | WRAPPED 발동 | 팽창 폭파 150ms + 카메라 쉐이크 |
| 봉지 2차 폭발 | 낙하 안착 후 350ms | 재폭파 150ms |
| 미러볼 순차 폭발 | COLOR_BOMB 발동 | 스파크 아크 150ms → 거리 기반 16.6ms stagger |
| 보너스 타임 | 미션 달성 + 잔여 무브 | STRIPED 변환 순차 → 폭발 |
| 별점 팝 | 성공 모달 등장 | 통!통!통! 순차 400ms 간격 Gold 이펙트 |
| 아이템 활성 펄스 | 아이템 버튼 탭 | Gold 테두리 + scale 1.05 pulse 루프 |

---

## Do / Don't

**Do**
- Three.js 블록 메시에 emissive 활용해 발광 표현 (블로커·특수 블록 구분)
- 파티클은 블록 고유 컬러로 일관되게 (BLOCK_01=Blue 계열, 등)
- 콤보 수 증가 시 파괴음 피치 +5% 누적
- `#dd-board-canvas`는 `pointer-events: auto` (Raycaster 탭·드래그 수신)
- CSS2D 렌더러로 콤보 텍스트 보드 좌표 연동
- 모든 스타일은 style.css에서만 정의
- 무브 5 이하 시 무브 수 빨간 깜빡임 적용

**Don't**
- 그라데이션·블러 섀도 블록에 적용 금지 (Three.js emissive로 대체)
- 인라인 style 작성 금지
- `puzzle_phase != IDLE` 상태에서 터치 이벤트 처리 금지 (트럼프 클로 2단계 제외)
- COLOR_BOMB 동시 폭발 금지 (거리 stagger 필수)
- 아이템 활성 중 다른 아이템 동시 활성 금지
- 승리·실패 연출 중 아이템 버튼 활성 금지
- Three.js 씬에 DOM 직접 추가 금지 (CSS2D 렌더러 사용)
