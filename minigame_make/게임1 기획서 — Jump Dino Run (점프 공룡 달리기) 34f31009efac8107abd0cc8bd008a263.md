# 게임1 기획서 — Jump Dino Run (점프 공룡 달리기)

## 📋 게임 개요

| 항목 | 내용 |
| --- | --- |
| 장르 | 무한 스크롤 아케이드 (Endless Runner) |
| 핵심 목표 | 점점 빨라지는 스크롤 속도 속에서 장애물을 피해 최대한 오래 생존하여 높은 점수 획득 |
| 코어 펀 | 타이밍에 맞춘 원버튼(피지컬) 조작의 쾌감 |
| LLE 연동 목적 | 미니게임 액션 노드 → 점수 산출 → 재화 지급 플로우 검증 |

---

## 🎮 핵심 메커니즘

### 조작

- 화면 터치 또는 스페이스바 (원버튼 점프)

### 물리 / 이동

- 공룡(플레이어)은 제자리 고정 — 위/아래(점프/중력)로만 이동
- 배경과 장애물이 우→좌 방향으로 이동하여 달리는 속도감 제공

### 장애물 생성

- **지상 장애물 (선인장):** 기본 점프로 회피
- **공중 장애물 (새):** 타이밍에 맞춰 점프하거나 아래로 통과 대기
- 점수(생존 시간) 증가 → 스폰 간격 단축 + 이동 속도 증가

### 종료 조건

- 공룡 히트박스 ↔ 장애물 히트박스 충돌 시 즉시 게임 오버

---

## ⚙️ LLE 엔진 연동 설계

### 글로벌 변수 (n-init 트리거)

| 변수명 | 초기값 | 설명 |
| --- | --- | --- |
| `dino_speed_base` | `5` | 초기 이동 속도 |
| `dino_reward_multiplier` | `0.1` | 점수당 획득 재화 배율 (100점 = 10골드) |
| `money_gain` | `0` | 보상 계산용 임시 변수 |
| `survival_score` | `0` | 미니게임에서 반환되는 생존 점수 |

### 노드 플로우

```
entry
  └→ n-init (trigger)
       └→ n-play-dino (action)          ← 미니게임 플레이. 종료 후 survival_score 반환
            └→ n-calc-dino-reward (trigger)   ← money_gain = math.floor(survival_score * dino_reward_multiplier)
                 └→ n-dino-reward-gate (gate)  ← condition: money_gain > 0
                      ├─ [true]  → n-dino-reward (reward) → n-res-gold (resource) → n-loop-gate
                      └─ [false] → n-loop-gate
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
      { "key": "dino_speed_base", "type": "number", "value": "5" },
      { "key": "dino_reward_multiplier", "type": "number", "value": "0.1" },
      { "key": "survival_score", "type": "number", "value": "0" },
      { "key": "money_gain", "type": "number", "value": "0" }
    ],
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**② n-play-dino (action)**

```json
{
  "id": "n-play-dino",
  "type": "action",
  "data": {
    "label": "공룡 달리기 플레이",
    "duration": "long",
    "difficulty": 5,
    "description": "플레이어가 직접 조작하는 미니게임. 종료 시 survival_score를 글로벌 변수에 기록.",
    "sdtEffects": { "autonomy": 0, "competence": 1, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**③ n-calc-dino-reward (trigger)**

```json
{
  "id": "n-calc-dino-reward",
  "type": "trigger",
  "data": {
    "label": "보상 계산",
    "attributes": [
      { "key": "money_gain", "type": "number", "value": "math.floor(survival_score * dino_reward_multiplier)" }
    ],
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**④ n-dino-reward-gate (gate)** 🚨 1원 보정 함정 회피

```json
{
  "id": "n-dino-reward-gate",
  "type": "gate",
  "data": {
    "label": "보상 유효 체크",
    "condition": "money_gain > 0",
    "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
    "frictionScore": 0
  }
}
```

**⑤ n-dino-reward (reward)**

```json
{
  "id": "n-dino-reward",
  "type": "reward",
  "data": {
    "label": "공룡 달리기 보상",
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
| e2 | n-init | n-play-dino | exec |  |
| e3 | n-play-dino | n-calc-dino-reward | exec |  |
| e4 | n-calc-dino-reward | n-dino-reward-gate | exec |  |
| e5 | n-dino-reward-gate | n-dino-reward | exec | gateBranch: "true" |
| e6 | n-dino-reward-gate | n-loop-gate | exec | gateBranch: "false" — reward 허브 직행 우회 |
| e7 | n-dino-reward | n-res-gold | resource | resourceAmountExpression: "money_gain" |
| e8 | n-dino-reward | n-loop-gate | exec |  |

---

## 🚨 LLE 엔진 주의사항

- `math.floor()` 수식 지원 여부 실제 실행 전 확인 필요. 미지원 시 `int()` 또는 정수 변환 방식으로 대체
- `survival_score`는 action 노드 종료 후 외부(게임 엔진)에서 글로벌 변수에 기록하는 구조 — LLE 자체에서 계산하지 않음
- `n-loop-gate`는 플로우 상단의 루프 진입 게이트 노드 ID로 교체 필요

---

## 📐 레이아웃 가이드 (LLE 캔버스)

| 노드 | x | y |
| --- | --- | --- |
| n-entry | 0 | 0 |
| n-init | 0 | 150 |
| n-play-dino | 0 | 370 |
| n-calc-dino-reward | 0 | 550 |
| n-dino-reward-gate | 0 | 730 |
| n-dino-reward | -300 | 900 |
| n-res-gold | -300 | 1080 |
| n-loop-gate | 400 | 150 |