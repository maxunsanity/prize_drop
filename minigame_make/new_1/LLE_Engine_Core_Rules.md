# LLE 엔진 핵심 학습 및 규칙 사전 (Core Engine Rules)

> 이 문서는 LLE 엔진 작업 중 겪었던 오류와 검증된 해결책을 기록하는 지식 베이스(Knowledge Base)입니다. 작업 시 반드시 우선적으로 참고해야 합니다.

---

## 1. 노드 ID 규칙 (Node ID Constraints)
- **금칙어**: 노드 ID에 하이픈(`-`)을 절대 사용하지 마세요. 엔진이 수식의 빼기 연산자로 오인하여 파싱 오류를 일으킵니다.
  - ❌ `n-init`, `n-gate-boss`
  - ✅ `n_init`, `n_gate_boss`

## 2. 변수 및 엔티티(Entity) 참조 규칙
- **엔티티 Number 참조**: 트리거 노드에서 `character.hp`와 같이 엔티티의 Number 값을 직접 참조하는 것은 가능합니다.
- **엔티티 String 참조 불가**: `goblin.name`과 같이 String 타입의 값을 점(dot) 표기법으로 참조할 수 없습니다. 문자열은 트리거 안에서 반드시 `"고블린"`처럼 리터럴 문자열로 직접 선언해야 합니다.
- **변수 계산(Damage 등)**: 같은 트리거 노드 안에서 선언과 동시에 타 변수 연산에 사용할 수 없습니다.
  - ❌ `damage = atk + 5`, `hp = hp - damage` (동시 불가)
  - ✅ (굴림/계산 트리거) `damage = atk + 5` ➡️ (적용 트리거) `hp = hp - damage`
- **레벨업 설정**: `exp_to_next` 변수 할당 시 '현재 레벨'이 아닌 '다음 레벨'의 테이블 데이터를 참조해야 갱신됩니다. (예: 1레벨 ➡️ 2레벨업 시 `levelup_2.exp_to_next` 참조)

## 3. 재화 (Resource / Gold) 처리 핵심 규칙
- **트리거로 재화 증가 금지**: `player_gold = player_gold + 10`처럼 트리거에서 수식으로 값을 올리면 백그라운드 변수만 증가하고 **우측 UI 패널의 재화 게이지에는 반영되지 않습니다**.
- **반드시 Reward ➡️ Resource 구조 사용**: UI를 연동하려면 다음과 같이 연결해야 합니다.
  - ✅ `n_reward (Right Handle)` ➡️ `n_resource (Left Handle)`
- **resourceAmountExpression 타입**: 이 항목은 반드시 **String(문자열)** 타입이어야 합니다.
  - ❌ `"resourceAmountExpression": 1`
  - ✅ `"resourceAmountExpression": "1"` 또는 `"enemy_gold_reward"`
- **금지된 엣지 연결**: Trigger 노드에서 곧바로 Resource 노드로 연결하는 것은 엔진 규격 위반입니다.
- **중복 방지**: 동일한 `resourceKey`를 가진 Resource 노드는 전체 플로우에서 단 **1개**만 존재해야 합니다.

## 4. 노드 엣지(Edge) 연결 ও 흐름(Flow) 규칙
- **순차 연결의 원칙**: 하나의 Trigger 노드에서 여러 개의 Exec 엣지가 동시에 뻗어나가는(병렬) 구조는 멈춤이나 오류를 유발할 수 있습니다. 노드들은 반드시 **순차적(Sequential)**으로 이어져야 합니다. (예: `트리거 ➡️ 보상 ➡️ 게이트`)
- **Gate 노드 양방향 연결**: Gate 노드는 반드시 `true` 방향과 `false` 방향이 모두 연결되어 있어야 엔진 유효성 검사를 통과합니다.
- **단일 핸들 타겟팅**: 여러 개의 노드에서 하나의 타겟 노드로 들어올 때, 타겟 노드의 동일한 `targetHandle` (예: top)에 선을 겹치면 시각적 버그가 발생하므로 피해야 합니다.
- **Success 노드**: `Success` 노드는 플로우를 종료시킵니다. 이후 다른 노드로 이동할 수 없습니다.

## 5. SDT (Self-Determination Theory) 설정
- `autonomy`, `competence`, `relatedness`, `motivation` 4가지 필드는 Choice, Reward 노드에 필수입니다.
- **`motivation` 누락 주의**: 이 값이 누락되면 시뮬레이터가 도중에 멈추는 치명적인 버그가 발생합니다.
- Gate 노드는 `frictionScore = 0`이 명시되어야 합니다.
