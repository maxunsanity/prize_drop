# LLE 엔진 레퍼런스 프롬프트
*게임 프로젝트 무관. LLE 엔진 작업 시 세션 시작마다 사용.*

---

## 1. LLE 툴 기본 정의

LLE(Lore Loop Engine)는 게임 로직을 노드-링크(Node-Edge) 형태로 시각화하는 플로우 툴이다.
- JSON으로 export되어 개발팀 구현 레퍼런스로 활용
- 시뮬레이터 내장: 노드 흐름을 실제로 실행하며 자원 소비/보상을 시뮬레이션 가능
- 현재 버전은 팔레트가 완벽하지 않아 있는 팔레트를 임시 조합해서 사용 중

---

## 2. 팔레트 전체 레퍼런스

### FLOW (4종) — 흐름 제어
| 팔레트 | type | 역할 |
|---|---|---|
| 진입 | entry | 루프 시작점. 플로우 전체에서 반드시 1개만 배치 |
| 선택 | choice | 플레이어 의지적 분기. 출력 엣지 2개 이상 필수 |
| 시퀀스 | sequence | 매 방문마다 다음 출력으로 순서 이동 |
| 게이트 | gate | 조건 충족 여부로 true/false 두 갈래 분기. `condition` 필드에 조건 입력 |

### PLAY (7종) — 플레이 행위
| 팔레트 | type | 역할 |
|---|---|---|
| 액션 | action | 플레이어 능동적 행위 |
| 연출 | staging | 플레이어 수동 시청 구간 (애니메이션 등) |
| 장면 | scene | 화면 전환 |
| UI | ui | UI 레이어 변화 (팝업, HUD 등) |
| 절차 | procedure | 강제 진행 구간 (튜토리얼 등) |
| 미션 | mission | 플레이어에게 주어지는 임무 |
| 타이머 | timer | 시간이 루프에 개입하는 지점 |

### OUTCOME (6종) — 결과
| 팔레트 | type | 역할 |
|---|---|---|
| 성공 | success | 게이트 true 분기 결과. 시뮬레이션 종료점으로도 사용 |
| 실패 | failure | 실패 경험. 게이트 false 분기 결과 |
| 감정 | emotion | 심리적 반응 |
| 보상 | reward | 외재적 보상 지급. 보상 허브(Hub)로 활용 가능 |
| 성장 | progression | 레벨업, 단계 상승 등 장기 성장 |
| 해금 | unlock | 콘텐츠·기능 잠금 해제 |

### SOCIAL (4종)
| 팔레트 | type | 역할 |
|---|---|---|
| 협동 | coop | 공동 목표 달성 |
| 경쟁 | pvp | 플레이어 간 직접 경쟁 |
| 커뮤니티 | community | 길드·클랜 등 소속감 기반 구조 |
| 공유 | share | 외부 SNS 공유, 친구 초대 등 |

### ECONOMY (5종)
| 팔레트 | type | 역할 |
|---|---|---|
| 구입 | purchase | 재화 소비해 아이템·기능 획득. 재화 OUT만 |
| 처분 | disposal | 자원 방출·폐기. 댓가 없는 소비도 포함 |
| 변환 | convert | 재화 간 교환 |
| 결제 | payment | 실제 현금 결제 (IAP 등) |
| 광고 | ad | 광고 노출 구간 |

### MISC (3종)
| 팔레트 | type | 역할 |
|---|---|---|
| 메모 | memo | 기획 메모용 스티커 노트 |
| 그룹 | group | 노드 묶어 시각적 구분 |
| 디자인 | design | 다른 디자인을 서브 루프로 참조 실행 |

### 특수 노드 (LLE 내장)
| 팔레트 | type | 역할 |
|---|---|---|
| 자원 | resource | 플레이어 보유 자원. 엣지에 amount/resourceAmountExpression 붙여 흐름 표현 |
| 테이블 | table | 외부 데이터 테이블 참조. `dataTableKey` 필드에 테이블 키 입력 |
| 엔티티 | entity | 테이블에서 읽어온 값을 담는 개체. `entityKey`로 수식에서 참조 |
| 트리거 | trigger | 변수 직접 대입/연산. `attributes` 배열로 키-값 선언 |

---

## 3. JSON 스키마 (A안: 필드 레퍼런스)

### 3-1. 최상위 구조
```json
{
  "version": "string",
  "designName": "string",
  "exportedAt": "ISO8601 timestamp",
  "nodes": [ ...Node ],
  "edges": [ ...Edge ],
  "resources": [ ...Resource ],
  "attributes": [ ...GlobalAttribute ],
  "entityTypes": []
}
```
> ⚠️ `currencies` 키는 LLE에 없음 — 절대 사용 금지

### 3-2. 글로벌 attributes (최상위)
시뮬레이션 외부에서 고정값으로 주입하는 변수.  
`n-init` trigger 내 attributes와 다름 — 이건 시뮬레이션 밖에서 세팅되는 글로벌 파라미터.
```json
"attributes": [
  { "key": "stage_id", "type": "number", "value": "1" }
]
```

### 3-3. Resource
```json
{
  "id": "고유ID (LLE에서 생성 후 export로 확인)",
  "key": "변수명 (수식에서 사용)",
  "name": "표시 이름",
  "color": "#hex",
  "icon": "아이콘명"
}
```

### 3-4. Node 공통 구조
```json
{
  "id": "string (하이픈 포함 가능, 단 수식 참조 시 주의)",
  "type": "팔레트 타입",
  "position": { "x": number, "y": number },
  "data": { ...타입별 필드 }
}
```

### 3-5. 타입별 data 필드

**trigger**
```json
{
  "label": "string",
  "attributes": [
    { "key": "변수명", "type": "number|string", "value": "값 또는 수식" }
  ],
  "sdtEffects": { "autonomy": 0, "competence": N, "relatedness": N, "motivation": 0 },
  "frictionScore": 0
}
```

**gate**
```json
{
  "label": "string",
  "condition": "조건 수식 (예: dice >= dice_count)",
  "sdtEffects": { "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0 },
  "frictionScore": 0
}
```

**entity**
```json
{
  "label": "string",
  "entityKey": "수식에서 접두사로 사용할 이름 (예: stage → stage.reward_scale)",
  "attributes": [
    { "key": "속성명", "type": "number|string", "value": "초기값" }
  ]
}
```

**table**
```json
{
  "label": "테이블 표시명",
  "dataTableKey": "LLE 프로젝트 내 테이블 키 (예: table_mo0zm9n9)"
}
```

**resource**
```json
{
  "label": "string",
  "resourceId": "resources 배열의 id와 완전 일치 필수",
  "resourceKey": "resources 배열의 key와 완전 일치 필수"
}
```

**reward / disposal / success / failure / entry**
```json
{
  "label": "string",
  "sdtEffects": { "autonomy": 0, "competence": N, "relatedness": N, "motivation": 0 },
  "frictionScore": 0
}
```

### 3-6. Edge 구조
```json
{
  "id": "string",
  "source": "sourceNodeId",
  "target": "targetNodeId",
  "type": "exec | data | resource"
}
```

**엣지 타입별 추가 필드**

| type | 추가 data 필드 |
|---|---|
| exec (일반 흐름) | `{ "gateBranch": "true" \| "false" }` (gate 출력일 때만) |
| data (테이블→엔티티) | `{ "dataTableRowExpression": "행 번호 또는 고정값", "tableEntityAttributeMappings": [ { "sourceColumnIndex": N, "targetKey": "엔티티 속성명" } ] }` |
| resource (보상 흐름) | `{ "amount": N, "resourceAmountExpression": "수식 또는 변수명" }` 또는 `{ "resourceEdgeMappings": [ { "sourceKey": "변수명", "targetKey": "amount" } ] }` |

---

## 4. 엔진 동작 규칙 & 함정 (B안: 실제 패턴 기반)

### 4-1. 수식 내 하이픈 금지 🚨 (치명적 오류)
노드 ID가 `node-entity-stage_1`일 때, 수식에서 `node-entity-stage_1.reward_scale`로 참조하면 엔진이 하이픈을 **빼기 연산자**로 해석 → `Unknown Name 'node'` 에러 발생.

```
❌ node-entity-stage_1.reward_scale
✅ stage_1.reward_scale  ← entityKey를 직접 사용
```

엔진은 수식에서 개체 참조 시 nodeId가 아니라 **entityKey**를 사용한다.

### 4-2. 글로벌 변수는 n-init에 반드시 선언
gate의 condition에서 변수를 평가할 때, 해당 변수가 최상위 `attributes`나 `n-init` trigger에 선언되지 않으면 `Unknown Name` 에러 발생.

```
✅ n-init trigger의 attributes에 모든 사용 변수 선언 필수
✅ stage_id처럼 외부 파라미터는 최상위 attributes에도 선언
```

### 4-3. data 엣지 rowExpression에 변수 수식 금지
엔진은 시뮬레이션 도중 data 엣지의 `dataTableRowExpression`을 실시간 변수로 재계산하지 않는다.

```
❌ "dataTableRowExpression": "stage_id + 1"   ← 동적 변수 금지
✅ "dataTableRowExpression": "3"               ← 고정 행 번호 사용
✅ 또는 Zero-Entity 방식으로 엔티티 자체를 제거
```

### 4-4. table.load() 미지원
LLE 트리거에는 테이블을 강제로 새로고침하는 내장 함수가 없다. 런타임 중 데이터 테이블 행을 동적으로 교체하는 것은 불가능.

### 4-5. 보상 허브(reward 노드)의 1원 보정 함정
`reward` 노드는 연결된 resource 엣지의 `money_gain`이 0이거나 없을 때 강제로 1원으로 보정하는 로직이 있다.

**우회 방법:**  
돈 보상이 발생하지 않는 분기(복불복 주사위 지급, GO 미통과, 감옥 탈출 성공 등)의 출력 엣지는 reward 노드를 거치지 않고 **반드시 loop-gate로 직행**.

```
❌ n-jail-success → n-accumulate-tile(reward) → n-loop-gate
✅ n-jail-success → n-loop-gate
```

### 4-6. Motivation 0에 의한 시뮬레이션 강제 종료
세금·감옥 징수 시 `sdtEffects`에 motivation 마이너스 수치가 있으면, 플레이어 동기가 0이 되어 시뮬레이션 강제 종료됨.

**해결책:** 모든 노드의 `sdtEffects`를 `{ autonomy:0, competence:N, relatedness:N, motivation:0 }`으로 고정.

### 4-7. 유령 타일 참조 오류
`tile_jail.tax_fixed_value`처럼 존재하지 않는 엔티티를 수식에서 참조하면 즉시 시뮬레이션 멈춤.

**해결책:** 특수 타일 수치는 엔티티 없이 `n-init`에서 글로벌 변수(`jail_fine`, `tax_low_value`)로 직접 선언.

---

## 5. 공통 패턴 (C안: 재사용 로직)

### 5-1. 메인 루프 기본 구조
```
n-entry → n-init(trigger) → n-loop-gate(gate)
  ├─ [true]  → n-consume-dice(disposal) → n-roll(trigger) → n-move-logic(trigger) → ...타일 로직...
  └─ [false] → n-simulation-end(success)
```
루프 끝은 항상 `n-loop-gate`로 복귀.

### 5-2. 주사위 소비 구조
```
n-loop-gate [dice >= dice_count]
  ├─ [true]  → n-consume-dice(disposal) → n-roll(trigger: dice -= dice_count) → ...
  └─ [false] → n-simulation-end
```
- `disposal`로 자원 소비 후, `trigger`에서 변수 `dice`를 직접 차감
- `disposal`만으로는 trigger 변수 `dice`가 감소하지 않음 → gate 조건 영원히 true 주의

### 5-3. 보상 허브 패턴
여러 타일에서 동일 resource로 보상을 줄 때 공용 reward 노드 1개로 수렴.
```
n-land-logic(trigger: money_gain=X)  ┐
n-tax-logic(trigger: money_gain=-Y)  ├→ n-accumulate-tile(reward) → n-me1-res(resource) → n-loop-gate
n-station-xxx(trigger: money_gain=Z) ┘
```
**단, money_gain이 0인 분기는 reward 허브 우회 필수** (1원 보정 함정 참조)

### 5-4. 확률 분기 체인 패턴
```
gate [rand.d100() <= 60]   ← 60% 분기
  ├─ [true]  → 결과 A
  └─ [false] → gate [rand.d100() <= 75]   ← 나머지 40% 중 75%
                 ├─ [true]  → 결과 B
                 └─ [false] → 결과 C
```
rand 함수 지원: `rand.d6()`, `rand.d10()`, `rand.d100()` 확인됨.

### 5-5. 테이블-엔티티 연동 패턴
```
n-table-stage(table) --[data edge]--> node-entity-stage(entity)
  dataTableRowExpression: "고정 행 번호"
  tableEntityAttributeMappings: [ { sourceColumnIndex: N, targetKey: "속성명" } ]
```
수식에서 참조: `stage.reward_scale` (entityKey = "stage")

### 5-6. Zero-Entity 하드코딩 패턴 (에러율 0%)
데이터 테이블 동적 연동 대신, 스테이지별 수치를 trigger에 직접 대입.
```
n-roll → gate[current_stage_index == 1] → trigger(current_stage_scale = 1.0) → n-move-logic
        → gate[current_stage_index == 2] → trigger(current_stage_scale = 1.1) → n-move-logic
        → ...
```
엔티티 없이 글로벌 변수만으로 운영. data 엣지 없음 → 동적 변수 수식 오류 원천 차단.

### 5-7. resource 노드 중복 금지
같은 `resourceKey`를 가진 resource 노드는 플로우 전체에서 1개만 허용.  
여러 노드에서 같은 자원 지급 시 → 하나의 공용 resource 노드로 모든 엣지 수렴.  
중복 시 오류: `"유저 식별자 경로가 중복됩니다"`

---

## 6. SDT / Motivation 설정 원칙

LLE 시뮬레이터는 `sdtEffects`가 설정되지 않은 노드에서 기본값으로 autonomy·motivation을 감소시킨다. 감소가 누적되면 시뮬레이션이 조기 종료됨.

**필수 규칙:**
- SDT 영향 타입 전체(action, staging, reward, failure, emotion, progression, disposal, trigger, gate 등)에 4개 필드 모두 명시
- `autonomy: 0`, `motivation: 0` 은 반드시 0으로 고정
- `competence`, `relatedness`는 노드 성격에 맞게 개별 설정 가능
- gate 노드는 `frictionScore: 0` 명시 필수

```json
"sdtEffects": {
  "autonomy": 0,
  "competence": 1,
  "relatedness": 0,
  "motivation": 0
},
"frictionScore": 0
```

---

## 7. 레이아웃 원칙

- 수직 흐름: y값 150~220px 간격
- 수평 배치(분기): x값 400~800px 간격
- 테이블/엔티티는 메인 흐름 왼쪽에 배치 (x 음수 영역)
- 실선 엣지 = exec (흐름), 점선 엣지 = data / resource

---

## 8. JSON 생성 체크리스트

작업 전 아래 항목 확인:

- [ ] 최상위에 `currencies` 키 없음
- [ ] `entry` 노드 플로우 전체에 1개만
- [ ] 모든 SDT 영향 노드에 4개 필드 모두 명시 (autonomy:0, motivation:0 필수)
- [ ] gate 노드 전체에 `frictionScore: 0`
- [ ] resource 노드: `resourceId` + `resourceKey` 모두 resources 배열과 일치
- [ ] 같은 resourceKey resource 노드 1개만
- [ ] 수식 내 하이픈 포함 nodeId 직접 참조 없음 → entityKey 사용
- [ ] `n-init`에 플로우에서 사용하는 모든 변수 선언
- [ ] data 엣지 `dataTableRowExpression`에 동적 변수 수식 없음
- [ ] money_gain = 0인 분기는 reward 허브 우회하여 loop-gate 직행
- [ ] disposal 후 trigger로 변수 직접 차감 처리
