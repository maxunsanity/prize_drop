# 로얄매치코어 — 안티그래비티 인수인계 가이드

> **작성 기준**: 2026-05-23  
> **목적**: 이펙트/디자인 작업 담당자가 프로젝트를 이해하고 안전하게 작업하기 위한 문서  
> **담당 범위**: 비주얼 이펙트, 파티클, 블록 텍스처 디자인, FX 연출 타이밍

---

## 1. 프로젝트 개요

**Project Double Down** — 9×9 3매치 퍼즐 게임  
카지노 카드 테이블 테마. 카드 문양(♠♦♣♥★) 블록 5종 + 특수 블록 4종 + 블로커 4종.

```
기술 스택: Vite 6 + TypeScript + React 19 + Three.js r172 + json-render 0.19
개발 서버: npx vite --port 5173
빌드:      npm run build
```

---

## 2. 디렉토리 구조

```
src/
  game/               ← ⛔ 건드리지 말 것 (게임 로직)
    BoardCore.ts        상태 머신 핵심 (1,223줄)
    bootstrapGame.ts    CSV 로드 + 초기화
    data.ts             타입 정의 / CSV 파싱
    gameControlBridge.ts React ↔ 게임 브리지
    hudExternalStore.ts  HUD 상태 스토어
    progressStore.ts    진행 저장

  three/              ← ✅ 주 작업 영역
    board3d.ts          Three.js 렌더러 + FX (1,239줄)
    blockMaterial.ts    블록/특수블록 Canvas2D 텍스처 (864줄)
    particles.ts        파티클 풀 시스템 (190줄)
    specialFX.ts        레이저/폭탄 FX (396줄)
    ambientSystem.ts    배경 앰비언트 파티클 (185줄)
    boardFrame.ts       보드 프레임 골드 테두리
    inputHandler.ts     터치/마우스 입력 (건드리지 말 것)

  jsonRender/
    GameJsonHud.tsx     ⛔ HUD 레이아웃 (건드리지 말 것)

  audio/
    audioSystem.ts      ⛔ Web Audio API (건드리지 말 것)

public/
  dd_block_config.csv   블록 5종 설정
  dd_stage_config.csv   스테이지 설정
  dd_blocker_config.csv 블로커 설정
```

---

## 3. 좌표계 & 상수

```typescript
// 그리드 → 월드 좌표 변환
gridToWorld(row, col) = [(col - 4) * BLOCK_UNIT, (4 - row) * BLOCK_UNIT]

GRID_ROWS  = 9
GRID_COLS  = 9
BLOCK_UNIT = 1.0   // 블록 1칸 = 월드 유닛 1.0
BLOCK_SCALE = 0.88 // 실제 블록 크기 (88% 스케일)

// Z축 레이어 (렌더 순서)
배경 앰비언트  z = 0.01~0.05
블록 메시      z = 0.05,  renderOrder = 2
특수 오라 링   renderOrder = 1
파티클 풀      renderOrder = 5
레이저 빔      z = 0.6,   renderOrder = 12
콤보 링        renderOrder = 13
카메라         z = 10
```

---

## 4. 블록 시스템

### 4-1. 일반 블록 5종

| 블록 ID | 문양 | 배경색 | 파티클A | 파티클B |
|---|---|---|---|---|
| BLOCK_01 | heart (♥) | `#FF2233` | `#FF6677` | `#FFAABB` |
| BLOCK_02 | star (★) | `#FFCC00` | `#FFDD44` | `#FFEE88` |
| BLOCK_03 | circle (●) | `#00BB44` | `#44DD88` | `#88FFCC` |
| BLOCK_04 | diamond (♦) | `#1166FF` | `#55AAFF` | `#AADDFF` |
| BLOCK_05 | triangle (▲) | `#AA22EE` | `#CC66FF` | `#EЕAAFF` |

### 4-2. 특수 블록 4종

| 블록 | 외형 | 배경색 | 생성 조건 | 효과 |
|---|---|---|---|---|
| STRIPED_H | 가로 메탈릭 로켓 → | `#0A1865` (딥 네이비) | 4개 직선(가로) | 가로 한 줄 전체 레이저 |
| STRIPED_V | 세로 메탈릭 로켓 ↑ | `#0A1865` | 4개 직선(세로) | 세로 한 줄 전체 레이저 |
| PROPELLER | 4날개 메탈릭 로터 | `#003344` (딥 틸) | 2×2 정사각형 | 인접 4개 즉시 제거 + 원거리 1개 비행 제거 |
| TNT | 클래식 폭탄 구체 | `#2A0000` (다크 크림슨) | L/T자 5개+ 교차 | 5×5 범위 폭발 |
| COLOR_BOMB | 프리즘 에너지 오브 | `#0D0020` (코스믹 퍼플) | 5개 직선 | 같은 색 전체 순차 파괴 |

---

## 5. 이펙트 시스템 구조

### 5-1. 파티클 풀 (`particles.ts`)

```typescript
MAX_PARTICLES = 400   // 전체 파티클 풀 크기
GRAVITY = 0.0015      // 프레임당 중력

// 버스트 호출
burstAtBlock(particlePool, wx, wy, colorA, colorB, count)
// count: 일반 블록 18개, 특수 블록 22개, COLOR_BOMB 체인 14개
```

- **단일 `THREE.Points` 메시** — 드로우콜 최소화
- 위치/컬러/사이즈 `Float32Array` 직접 조작
- 매 프레임 `tickParticlePool(pool, dt)` 호출 필수

### 5-2. 구멍 이펙트 (`board3d.ts` → `_spawnHoleEffect`)

블록이 소멸한 자리에 자동 스폰되는 3단 이펙트:
1. **어두운 보이드 원** — 검은 원이 빠르게 나타났다 소멸 (z=0.01)
2. **컬러 림 글로우 링** — 블록 고유 파티클 색상으로 테두리 발광, 안→밖 확장 (z=0.02)
3. **잔불 스파크 3개** — 블록 컬러 불씨가 위로 떠오르며 페이드 (z=0.15)

지속 시간: **380ms** (새 블록 낙하 직전 소멸)  
호출 위치: `_animExplode` + `_animColorBombChain` 양쪽에서 호출

### 5-3. 레이저 FX (`specialFX.ts`)

```
3-레이어 구성:
  코어: 두께 0.04, 흰색, opacity 0.95
  글로우: 두께 0.18, 블록색, opacity 0.50
  소프트: 두께 0.36, 블록색, opacity 0.20

duration: 0.22초 (220ms)
애니메이션: 0~30% 등장 / 30~70% 유지 / 70~100% 소멸
```

### 5-4. TNT 폭발 FX (`board3d.ts` → `_animTNTFire`)

```
폭발 링 3겹 (70ms 간격):
  1번 링: #FF6600, targetR × 2.4 (5×5 커버)
  2번 링: #FF3300
  3번 링: #FFAA00

중심 플래시: 흰색 원형 섬광 (180ms)
카메라 쉐이크: intensity 0.22
```

### 5-5. 프로펠러 FX (`board3d.ts` → `_animPropellerFire`)

```
Phase 0 (즉시): 발동 위치 스핀 링 + 버스트 파티클
Phase 1 (400ms후): 발사체 비행 애니메이션 (0.28초, ease-out-cubic)
  - 발사체: 청록색 원 (0x00ddff)
  - 꼬리 잔상: 살짝 뒤따라오는 작은 원
  - 착탄: burstAtBlock 18개
```

### 5-6. 특수 블록 오라 (`board3d.ts` 메인 루프)

```typescript
// specialMeshIds Set으로 O(특수 수)만 순회 (최적화)
opacity = (Math.sin(elapsed * 2.6 + id * 0.43) * 0.5 + 0.5) * 0.55 + 0.06
```

---

## 6. 블록 텍스처 드로잉 (`blockMaterial.ts`)

텍스처 해상도: **256 × 256px** (Canvas 2D)

```typescript
// 핵심 헬퍼
drawSphere3D(ctx, cx, cy, r, baseColor, midColor, darkColor)
// → 오프셋 중심 radial gradient + 상단 하이라이트 + 하단 반사광

// 특수 블록 드로잉 함수 (교체 가능)
drawStripedH()   // 가로 로켓 (날개+창문+엔진화염+스피드라인)
drawStripedV()   // 세로 로켓 (H를 -90° ctx.rotate)
drawPropeller()  // 4날개 로터 (모션블러 고스트 + 메탈릭 날개 + 3D 허브)
drawTNT()        // 클래식 폭탄 (메탈릭 구체 + 적도밴드 + 심지+스파크)
drawColorBomb()  // 프리즘 오브 (8방향 빔 + 무지개 구체 + 렌즈 플레어 십자)
```

**ShaderMaterial 구조:**
```glsl
// Fragment Shader 핵심
float mask = roundRectMask(vUv, 0.16);     // 모서리 라운딩
vec4 symColor = texture2D(uSymbol, vUv);   // 텍스처
vec3 blockBg = uBlockColor * ...           // 배경색 + 그라디언트
// highlight arc + 하단 그림자 + 합성
```

---

## 7. 애니메이션 타이밍 테이블

| 이벤트 | 지속 시간 | 비고 |
|---|---|---|
| 블록 스왑 | 160ms | `SWAP_ANIM_MS` |
| 블록 소멸 | 180ms | squash → 팽창 → 수축 |
| 블록 낙하 | 240ms | ease-in-out, 열당 60ms 스태거 |
| 새 블록 스폰 | 240ms | 행당 90ms 스태거 (아래→위) |
| 구멍 이펙트 | 380ms | 소멸 타이밍과 정확히 맞춤 |
| 레이저 FX | 220ms | 3-레이어 동시 |
| TNT 폭발 | 400ms | 링 3겹 70ms 간격 |
| 프로펠러 비행 | 280ms | Phase 1, ease-out-cubic |
| COLOR_BOMB 체인 | 18ms 간격 | 거리 기반 stagger |
| 콤보 슬로우모션 | 4콤보+ → timeScale 0.38 | 380+combo×70ms |

**DROP_SPAWN 딜레이 (폭발 → 블록 채우기):**
```
일반 매치:    380ms
STRIPED:      380ms
PROPELLER:    700ms
COLOR_BOMB:  2200ms
```

---

## 8. ⛔ 절대 건드리지 말아야 할 것들

### 8-1. 게임 로직 파일
```
src/game/BoardCore.ts        — 상태 머신 전체. 이 파일 수정 시 게임 로직 붕괴
src/game/bootstrapGame.ts    — 초기화 순서 변경 금지
src/game/hudExternalStore.ts — 경로 구조 변경 금지 (json-render 연동)
src/jsonRender/GameJsonHud.tsx — HUD 구조 변경 금지
src/three/inputHandler.ts    — 입력 처리 로직 변경 금지
```

### 8-2. Three.js 렌더 시스템 규칙

```typescript
// ❌ 절대 금지: renderer.setSize() 직접 호출
// ✅ 올바른 방법: ResizeObserver → _onResize() 통해서만

// ❌ 절대 금지: camera.up 변경
camera.up.set(0, 1, 0);  // 이 설정 변경 금지 (보드 뒤집힘 버그)

// ❌ 절대 금지: renderOrder 임의 변경
// 현재 레이어: 배경(0) → 블록(2) → 오라(1) → 파티클(5) → FX(11~13)

// ❌ 절대 금지: blockMeshes.delete() 직접 호출
// ✅ 올바른 방법: _removeMesh(blockId) 통해서만 (specialMeshIds 동기화)

// ❌ 절대 금지: CSS visibility:hidden 으로 Three.js 컨테이너 숨기기
// ✅ 올바른 방법: display:none 사용 (WebGL은 visibility 무시)
```

### 8-3. 파티클 풀 사용 규칙

```typescript
// ❌ 잘못된 사용: count를 너무 크게 설정
burstAtBlock(pool, wx, wy, colorA, colorB, 200);  // 풀 초과 → 다른 파티클 소멸

// ✅ 권장 범위: 8~30개
// MAX_PARTICLES = 400, 동시에 여러 폭발 발생 가능함을 고려

// ❌ 금지: particlePool을 새로 생성하거나 replace
// ✅ 항상 board3d.particlePool 참조 사용
```

### 8-4. 이벤트 시스템 규칙

```typescript
// board3d.ts 내부 모든 애니메이션은 boardCore.on(event) 리스너로만 트리거
// ❌ 금지: BoardCore 내부 상태를 board3d에서 직접 읽기
// ✅ 허용: board3d가 boardCore.on(e => ...) 이벤트만 수신

// 이벤트 종류:
EXPLODE          → _animExplode()           블록 파괴 애니메이션
COLOR_BOMB_CHAIN → _animColorBombChain()    COLOR_BOMB 체인 파괴
STRIPED_FIRE     → _animStripedFire()       레이저 발사
TNT_FIRE         → _animTNTFire()           폭발 이펙트
PROPELLER_FIRE   → _animPropellerFire()     프로펠러 비행
BLOCK_DROP       → _animDrop()              블록 낙하
BLOCK_SPAWN      → _animSpawn()             새 블록 생성
SWAP_START       → _animSwap()              스왑 애니메이션
SWAP_BACK        → _animSwapBack()          스왑 취소
SPECIAL_CREATE   → _animSpecialCreate()     특수 블록 생성 예고
```

---

## 9. ✅ 안전하게 수정 가능한 영역

### 9-1. 블록 텍스처 디자인 (`blockMaterial.ts`)

```typescript
// 이 5개 함수는 자유롭게 교체/수정 가능
drawStripedH(ctx, cx, cy)   // 가로 로켓 디자인
drawStripedV(ctx, cx, cy)   // 세로 로켓 디자인
drawPropeller(ctx, cx, cy)  // 프로펠러 디자인
drawTNT(ctx, cx, cy)        // 폭탄 디자인
drawColorBomb(ctx, cx, cy)  // 컬러밤 디자인

// 배경색도 변경 가능
export const SPECIAL_BG: Record<string, number> = {
  STRIPED_H:  0x0A1865,
  STRIPED_V:  0x0A1865,
  PROPELLER:  0x003344,
  TNT:        0x2A0000,
  COLOR_BOMB: 0x0D0020,
};

// 단, 함수 시그니처 (ctx, cx, cy) 는 유지 필수
// TEX = 256 (캔버스 해상도) 기준으로 좌표 계산
```

### 9-2. FX 연출 수정 (`board3d.ts`, `specialFX.ts`)

수정 가능한 함수들:
```typescript
_animTNTFire()          // 폭발 링 크기/색상/개수
_animPropellerFire()    // 비행 궤적/색상
_animStripedFire()      // 레이저 색상/두께
_spawnHoleEffect()      // 구멍 이펙트 모양/색
_spawnPropellerSpinFX() // 프로펠러 발동 스핀 링
_animColorBombChain()   // COLOR_BOMB 체인 파괴 연출
_animSpecialCreate()    // 특수 블록 생성 예고 연출
```

### 9-3. 앰비언트 시스템 (`ambientSystem.ts`)

```typescript
createAmbientParticles(scene, count = 40)  // 파티클 수 조절
tickAmbientParticles()                     // 이동 속도 조절
tickFrameGlow()                            // 보드 프레임 글로우
```

### 9-4. CSS 스타일 (`style.css`)

```css
:root {
  --felt:       #0e3d26;   /* 메인 배경 */
  --felt-dark:  #051c11;
  --gold:       #f5a623;   /* 강조색 */
  --gold-light: #fbbf24;
  --card:       #f0e6d3;
  --ink-dark:   #0f172a;
  --slate:      #94a3b8;
}
/* 이 변수들 자유롭게 수정 가능 */
```

---

## 10. 렌더 루프 구조

```typescript
// board3d.ts _loop() — 매 프레임 실행 순서
1. timeScale 슬로우모션 보간
2. specialMeshIds 오라 펄스 (Set만 순회, 최적화됨)
3. swapAnim 보간
4. dropAnims 낙하 처리 + 착지 squash
5. camShake 카메라 진동 감쇠
6. tickBlockMaterials() — 셰이더 uniform 업데이트
7. tickParticlePool()   — 파티클 물리/수명
8. specialFX.tick()     — 레이저/폭발 FX
9. ambientSystem.tick() — 배경 파티클 (2프레임 스킵 최적화)
10. boardFrame.tick()   — 프레임 글로우
11. renderer.render()   — WebGL 렌더
12. css2d.render()      — CSS2D 콤보 레이블
```

**성능 설정:**
```typescript
powerPreference: 'high-performance'   // GPU 고성능 모드
pixelRatio: Math.min(dpr, 1.5)        // 최대 1.5배 (레티나 최적화)
antialias: true
```

---

## 11. 현재 미완성 항목 (게임 로직팀 작업 예정)

| 항목 | 우선순위 | 비고 |
|---|---|---|
| PROPELLER+STRIPED 시너지 | 낮음 | 현재 3행+3열 임시 구현 |
| JELLY_TILE 시스템 | 추후 | 젤리/얼음 타일 레이어 |
| ROULETTE_WHEEL 그린벨벳 타일 | 낮음 | CHIP_RACK으로 임시 대체 |
| 블로커 배치 CSV 테스트 | - | dd_blocker_config.csv |

---

## 12. 테스트 환경 주의사항

현재 `dd_stage_config.csv`는 **테스트 모드**로 설정되어 있음:
```csv
moves_given = 99       # 무브 최대
target = 9999/9999999  # 클리어 불가 상태 (의도적)
```

**실제 배포 전에 반드시 정상 수치로 복구할 것.**

정상 수치 예시:
```csv
1,BLOCK_COLLECTION,BLOCK_04,20,,,25,easy,500,1000,1500
2,BLOCK_COLLECTION,BLOCK_04,30,,,28,normal,800,1500,2200
3,SCORE_TARGET,,,5000,,25,normal,1000,2000,3000
```

---

## 13. 로컬 실행 방법

```bash
cd /Users/max/minigame_make/로얄매치코어
npm install          # 최초 1회
npx vite --port 5173 # 개발 서버
# → http://localhost:5173/
```

---

*이 문서는 게임 로직(BoardCore.ts)을 수정하지 않고 비주얼/이펙트/디자인 작업만 진행하는 담당자를 위해 작성되었습니다.*
