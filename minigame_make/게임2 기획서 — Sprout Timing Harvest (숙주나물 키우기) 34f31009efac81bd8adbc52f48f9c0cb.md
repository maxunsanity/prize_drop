# 게임2 기획서 — Sprout Timing Harvest (숙주나물 키우기)

## 📋 게임 개요

| 항목 | 내용 |
| --- | --- |
| 장르 | 타이밍 방치/수집형 (Timing-based Clicker) |
| 핵심 목표 | 5개 슬롯에서 자라는 숙주나물의 완전 성장 타이밍을 포착해 수확, 목표치(20개) 달성 |
| 코어 펀 | 다중 슬롯 동시 진행 속 시각적 집중력 + 타임 매니지먼트 |
| LLE 연동 목적 | 미니게임 내부 누적 재화를 LLE 자원으로 정산하는 플로우 검증 |

---

## 🎮 핵심 메커니즘

### 조작

- 화면 터치 (다 자란 숙주 클릭)

### 성장 사이클 (5개 슬롯 동시 진행)

| 단계 | 상태 | 설명 |
| --- | --- | --- |
| 1 | 빈 땅 | 랜덤 대기 후 씨앗 발아 |
| 2 | 새싹 | 성장 중 |
| 3 | 중간 성장 | 성장 중 |
| 4 | **완전 성장** | 통통 튀는 애니메이션. **이 타이밍에 클릭 → 재화/카운트 획득** |
| 5 | 시든 상태 | 방치 시 시들어버림. 클릭해서 치워야 빈 땅으로 리셋. **보상 없음** |

### 승리 / 종료 조건

- 목표 수확량(기본 20개) 달성 시 게임 종료 및 결과 정산

---

## ⚙️ LLE 엔진 연동 설계

### 설계 방침

- 게임 내부에서 수확 시마다 골드를 누적 계산
- 종료 시 총합(`sprout_total_earned`)을 LLE 글로벌 변수로 반환
- LLE는 반환값을 받아 자원으로 정산만 담당 (내부 랜덤 로직은 게임 엔진 처리)
- 변수명에 하이픈(-) 미사용 — 언더바(_)만 사용 (LLE 수식 파싱 오류 방지)

### 글로벌 변수 (n-init 트리거)

| 변수명 | 초기값 | 설명 |
| --- | --- | --- |
| `sprout_target_harvest` | `20` | 목표 수확량 |
| `sprout_wither_time` | `4000` | 시들기까지의 시간(ms) — 난이도 조절용 |
| `sprout_total_earned` | `0` | 게임에서 반환되는 총 획득 골드 |
| `money_gain` | `0` | 보상 계산용 임시 변수 |

### 노드 플로우

```
entry
  └→ n-init (trigger)
       └→ n-play-sprout (action)             ← 미니게임 플레이. 목표 달성 후 sprout_total_earned 반환
            └→ n-calc-sprout-reward (trigger) ← money_gain = sprout_total_earned
                 └→ n-sprout-reward-gate (gate)  ← condition: money_gain > 0
                      ├─ [true]  → n-sprout-reward (reward) → n-res-gold (resource) → n-loop-gate
                      └─ [false] → n-loop-gate              ← 전량 시든 경우 (0원)
```

### 노드별 상세 스펙

**① n-init (trigger)**

```json
{
  "id": "n-init",
  "type": "trigger",
  "data": {
    "label": "초기화",
    "attributes": [
      { "key": "sprout_target_harvest", "type": "number", "value": "20" },
      { "key": "sprout_wither_time", "type": "number", "value": "4000" },
      { "key": "sprout_total_earned", "type": "number", "value": "0" },
      { "key": "money_gain", "type": "number", "value": "0" }
    ],
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**② n-play-sprout (action)**

```json
{
  "id": "n-play-sprout",
  "type": "action",
  "data": {
    "label": "숙주나물 키우기 플레이",
    "duration": "long",
    "difficulty": 3,
    "description": "5개 슬롯 동시 진행 타이밍 게임. 목표 수확량(sprout_target_harvest) 달성 시 종료. 총 획득 골드를 sprout_total_earned에 기록.",
    "sdtEffects": { "autonomy": 0, "competence": 1, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**③ n-calc-sprout-reward (trigger)**

```json
{
  "id": "n-calc-sprout-reward",
  "type": "trigger",
  "data": {
    "label": "보상 대입",
    "attributes": [
      { "key": "money_gain", "type": "number", "value": "sprout_total_earned" }
    ],
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**④ n-sprout-reward-gate (gate)** 🚨 1원 보정 함정 회피

```json
{
  "id": "n-sprout-reward-gate",
  "type": "gate",
  "data": {
    "label": "보상 유효 체크",
    "condition": "money_gain > 0",
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**⑤ n-sprout-reward (reward)**

```json
{
  "id": "n-sprout-reward",
  "type": "reward",
  "data": {
    "label": "숙주나물 수확 보상",
    "sdtEffects": { "autonomy": 0, "competence": 1, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**⑥ n-res-gold (resource)**

```json
{
  "id": "n-res-gold",
  "type": "resource",
  "data": {
    "label": "골드",
    "resourceId": "[프로젝트에서 생성한 gold 자원 ID]",
    "resourceKey": "gold"
  }
}
```

### 엣지 연결 목록

| id | source | target | type | 비고 |
| --- | --- | --- | --- | --- |
| e1 | n-entry | n-init | exec |  |
| e2 | n-init | n-play-sprout | exec |  |
| e3 | n-play-sprout | n-calc-sprout-reward | exec |  |
| e4 | n-calc-sprout-reward | n-sprout-reward-gate | exec |  |
| e5 | n-sprout-reward-gate | n-sprout-reward | exec | gateBranch: "true" |
| e6 | n-sprout-reward-gate | n-loop-gate | exec | gateBranch: "false" — 0원 케이스 reward 우회 |
| e7 | n-sprout-reward | n-res-gold | resource | resourceAmountExpression: "money_gain" |
| e8 | n-sprout-reward | n-loop-gate | exec |  |

---

## 🔗 두 게임 동시 통합 시 주의사항

두 미니게임이 하나의 LLE 플로우 내에 공존할 경우:

- `n-res-gold` 자원 노드는 **전체 캔버스에 1개만** 배치
- 게임1의 `n-dino-reward`와 게임2의 `n-sprout-reward` 양쪽에서 동일한 `n-res-gold`로 엣지 수렴
- 중복 배치 시 LLE 오류: `"유저 식별자 경로가 중복됩니다"`

```
n-dino-reward  ──┐
                 ├──→ n-res-gold (1개) → ...
n-sprout-reward ─┘
```

---

## 🚨 LLE 엔진 주의사항

- `sprout_total_earned`는 게임 엔진(안티그래비티)에서 LLE 글로벌 변수로 직접 기록하는 구조
- 시든 케이스(0원)에서 false 분기가 reward 허브를 우회하지 않으면 1원 보정 함정 발동
- 변수명 하이픈 금지 — 현재 설계에서는 모두 언더바 사용으로 안전

---

## 📐 레이아웃 가이드 (LLE 캔버스)

| 노드 | x | y |
| --- | --- | --- |
| n-entry | 0 | 0 |
| n-init | 0 | 150 |
| n-play-sprout | 0 | 370 |
| n-calc-sprout-reward | 0 | 550 |
| n-sprout-reward-gate | 0 | 730 |
| n-sprout-reward | -300 | 900 |
| n-res-gold | -300 | 1080 |
| n-loop-gate | 400 | 150 |