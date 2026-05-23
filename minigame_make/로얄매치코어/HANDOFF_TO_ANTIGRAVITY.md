# 🔁 단군 → 안티그래비티 인수인계 (2026-05-24)

오빠의 지시로 이번 세션 작업 내용 전체를 정리해서 넘기는 문서야.

---

## ✅ 이번 세션에서 완료된 작업

### 1. 텍스처 캐시 버그 수정 (`blockMaterial.ts`)
- **문제**: `_texCache.set(shape, texture)`가 없어서 캐시가 항상 비어 있었음
  → 블록 생성마다 새 Canvas + CanvasTexture 무한 생성, 메모리 누수
- **수정**: `_texCache.set(shape, texture)` 추가 후 캐시 히트 정상 동작
- **추가**: `_removeMesh()`에서 shared 텍스처 dispose 제거 (공유 캐시 텍스처는 블록 단위로 dispose 금지)

### 2. SPECIAL_BG 색상 미완성 미션 완료 (`blockMaterial.ts`)
- STRIPED_H/V, COLOR_BOMB 배경색이 아직 기본값이었던 문제 처리
- **아론 무드 파스텔 계열로 확정:**
  ```
  STRIPED_H/V : 0x2E3E50  (더스티 딥 블루)
  PROPELLER   : 0x27443E  (딥 모스 그린)
  TNT         : 0x4E3029  (더스티 로즈우드)
  COLOR_BOMB  : 0x322442  (더스티 라벤더 퍼플)
  ```

### 3. COLOR_BOMB 라이트링 채우기 딜레이 단축 (`BoardCore.ts`)
- **문제**: 같은 색 블록 연쇄 파괴 후 새 블록 채워지는 시간이 너무 느림
- **수정**: `_explode` & `tapSpecial` 두 곳에서 `COLOR_BOMB delay 2200ms → 1100ms`

### 4. 폭탄(TNT)/STRIPED 쉐이크 후 블록 원위치 복원 버그 수정 (`board3d.ts`)
- **문제**: 쉐이크 종료 후 블록이 제자리로 못 돌아오는 현상
  - 원인 A: `position.y += offset` 가산법 → 누적 오프셋으로 드리프트
  - 원인 B: TNT 쉐이크 지속 시간(450ms)이 DROP 딜레이(380ms)보다 길어 충돌
- **수정**:
  - 절대 좌표 기반 복원: `m.position.y = userData['baseY'] + offset` (가산 → 절대값)
  - STRIPED 쉐이크: 350ms → **250ms** (DROP 380ms 이전 완료)
  - TNT 쉐이크: 450ms → **220ms** (DROP 380ms 이전 완료)
  - 쉐이크 종료 시 `userData['baseY']`로 정확 복원

### 5. 매치 우선순위 충돌 해결 (`BoardCore.ts` `_findAllMatches()`)
- **문제**: 블록 배치 패턴 충돌 시 하위 특수 블록이 생성되어야 할 상황에 상위 블록이 블록을 먼저 먹는 케이스 3종 발생
- **해결**: 실행 순서를 우선순위 내림차순으로 재설계

  **이전 순서 (버그 있음)**
  ```
  1. L/T 교차 → TNT
  2. 나머지 run (5+→COLOR_BOMB, 4→STRIPED, 3→NORMAL)
  3. 2×2 → PROPELLER
  ```

  **수정 후 순서 (확정)**
  ```
  1. 5+ 직선 run → COLOR_BOMB  ← 최우선
  2. L/T 교차 → TNT            ← 5+ run guard 추가 (5+ 이미 처리된 run skip)
  3. 2×2 정사각형 → PROPELLER  ← 4-직선 이전에 먼저 claim
  4. 4-직선 → STRIPED
  5. 3-직선 → NORMAL
  ```

  **해결된 충돌 케이스:**
  - Case A: 2×2 + 3-match 겹침 → PROPELLER 우선 생성
  - Case B: 5-straight + L/T 교차 → COLOR_BOMB 우선 생성
  - Case C: 2×2 + 4-straight 겹침 → PROPELLER 우선 생성

---

## ⚠️ 남아있는 작업 (안티그래비티가 이어서 처리)

### 🔴 필수: dd_stage_config.csv 운영 값으로 복원
- **현재 상태**: 테스트 모드로 되어 있음 (moves=99, target=9999)
- **파일 위치**: `public/dd_stage_config.csv`
- **현재 내용**:
  ```csv
  stage_id,mission_type,target_block_type,target_block_count,target_score,target_tile_count,moves_given,difficulty,star1,star2,star3
  1,BLOCK_COLLECTION,BLOCK_04,9999,,,99,easy,500,1000,1500
  2,BLOCK_COLLECTION,BLOCK_04,9999,,,99,normal,800,1500,2200
  3,SCORE_TARGET,,,9999999,,99,normal,1000,2000,3000
  ```
- **작업**: 실제 게임 밸런스에 맞는 수치로 교체 후 `double_down.zip` 재빌드 + git push

### 🟡 선택: 추가 튜닝 검토 항목
- **PROPELLER 발동 딜레이**: `tapSpecial` 기준 700ms — 실게임에서 체감 확인 필요
- **쉐이크 진동수**: STRIPED 24Hz / TNT 26Hz로 설정됨 — 더 빠르거나 느리게 조정 가능
- **PROPELLER 2단계 대기 시간**: `_explodePropeller`에서 phase1 → phase2 딜레이

---

## 🚫 절대 건드리지 말 것 (오빠 명령)

> "특히 연출은 지금이 좋으니깐..건드리지 말고"

- `board3d.ts` FX 연출 코드 (레이저/폭발/파티클/플래시)
- `specialFX.ts` (번개 아크)
- `ambientSystem.ts` (앰비언트 파티클)
- `blockMaterial.ts` 드로잉 로직 (블록 마크 디자인)

---

## 📁 관련 파일 목록

| 파일 | 역할 |
|------|------|
| `src/game/BoardCore.ts` | 게임 로직 (매치/특수블록/드롭) |
| `src/three/board3d.ts` | Three.js 렌더링/애니메이션 |
| `src/three/blockMaterial.ts` | 블록 텍스처 생성/캐시 |
| `src/three/specialFX.ts` | 번개 아크 FX |
| `src/three/ambientSystem.ts` | 배경 파티클/프레임 글로우 |
| `public/dd_block_config.csv` | 블록 색상/파티클 설정 |
| `public/dd_stage_config.csv` | 스테이지 미션/이동수 설정 ← ⚠️ 테스트값 |
| `double_down.zip` | 최신 프로덕션 빌드 |

---

## 🔖 최근 커밋 이력

```
7897d6c  refactor: _findAllMatches 우선순위 재설계
e40bc95  build: double_down.zip 빌드 파일 추가
d6d936f  fix: 셰이크 복원 누락 및 COLOR_BOMB 채우기 딜레이 단축
7b7d6d6  fix: 블록 생성 관련 버그 3종 수정
845e4a9  docs: 안티그래비티 팀 인수인계 가이드 추가 (ANTIGRAITY_GUIDE.md)
934ce15  feat(royal-match-core): 특수 블록 개선 및 퍼포먼스 최적화
```
