# [LLE RPG] 전투 시스템 2단계 기술 명세서 (Technical Spec) 📝

이 문서는 `전투_2단계_완료 정리.json` 파일을 기반으로 한 전투 시뮬레이션의 전체 로직, 변수 체계 및 구동 흐름을 상세히 설명합니다.

---

## 1. 전역 변수 사전 (Variable Dictionary)

시뮬레이션 전체에서 공유되는 핵심 변수들입니다. 모든 변수는 `Entry` 노드 직후의 초기화 노드에서 정의됩니다.

| 변수명 | 타입 | 설명 | 초기값 |
| :--- | :--- | :--- | :--- |
| `player_hp` | Number | 플레이어의 현재 체력 | 100 |
| `player_max_hp` | Number | 플레이어의 최대 체력 (게이지 계산용) | 100 |
| `player_hp_ratio` | Number | 플레이어 체력 비율 (0.0 ~ 1.0) | 1.0 |
| `player_atk` | Number | 플레이어의 기본 공격력 | 10 |
| `enemy_hp` | Number | 적의 현재 체력 | 50 |
| `enemy_max_hp` | Number | 적의 최대 체력 | 50 |
| `enemy_hp_ratio` | Number | 적 체력 비율 (0.0 ~ 1.0) | 1.0 |
| `enemy_atk` | Number | 적의 기본 공격력 | 5 |
| `damage` | Number | 이번 턴에 발생한 임시 데미지 저장소 | 0 |
| `turn_count` | Number | 누적 공격 횟수 카운터 | 0 |

---

## 2. 전체 프로세스 흐름 (Execution Flow)

### ① 초기화 단계 (Initialization)
- **Node:** `n_init_player` ➡️ `n_init_enemy`
- **역할:** 게임 시작 시 모든 전역 변수를 기본값으로 셋팅합니다.
- **중요:** 승리/패배 후 다시 시작할 때 반드시 이 노드를 거쳐야 모든 상태가 리셋됩니다.

### ② 전투 메인 루프 (Battle Choice)
- **Node:** `HIOoyUfUBzgoZfaJbe2o` (공격 or 대기?)
- **UI:** 현재 플레이어와 적의 상태(HP 게이지)를 시각화하고 유저의 입력을 기다립니다.

### ③ 플레이어 공격 시퀀스 (Player Attack)
1. **액션 (`lxkO9hDma1yfobSxAcnR`):** "공격 실행" 연출이 발생합니다.
2. **데미지 굴림 (`trig_calc_p_dmg`):** `player_atk + rand.d6()` 수식을 통해 `damage` 변수를 결정하고 `turn_count`를 1 증가시킵니다.
3. **상태 반영 (`trig_player_atk`):** 확정된 `damage`를 `enemy_hp`에서 차감하고, `enemy_hp_ratio`를 갱신합니다.
4. **사망 게이트 (`xbB65S1FVTQsKviTmpCo`):** `enemy_hp <= 0` 인지 체크합니다.
   - **True:** 승리 화면(`JmXYql8aC8Thnor1Xcox`)으로 이동.
   - **False:** 적 반격 시퀀스로 진행.

### ④ 적 반격 시퀀스 (Enemy Counter)
1. **액션 (`WOGebJtUG9fTXv1AggCH`):** "적 반격" 연출이 발생합니다.
2. **데미지 굴림 (`trig_calc_e_dmg`):** `enemy_atk + rand.d6()` 수식을 통해 `damage` 변수를 새롭게 확정합니다.
3. **상태 반영 (`trig_enemy_atk`):** 플레이어의 HP를 깎고 `player_hp_ratio`를 갱신합니다.
4. **사망 게이트 (`dbClGLpmQ22hftQwXs3M`):** `player_hp <= 0` 인지 체크합니다.
   - **True:** 패배 화면(`PkGUAqSomtLEOXEuyofe`)으로 이동.
   - **False:** 다시 **② 전투 메인 루프**로 복귀하여 다음 턴 진행.

---

## 3. UI 및 게이지 구현 상세

### 📊 HP 게이지 (Progress Component)
- **바인딩:** `props.value`에 `{ "$state": "/player_hp_ratio" }` 형식을 사용합니다.
- **작동 원리:** `Trigger` 노드에서 계산된 비율 변수(0~1)를 실시간으로 추적하여 막대 그래프 길이를 조절합니다.

### 📝 텍스트 바인딩 (Handlebars)
- **표시:** `{{player_hp}} / {{player_max_hp}}` 처럼 중괄호를 사용하여 변수값을 텍스트 레이블에 직접 노출합니다.

---

## 4. 유지보수 주의사항

1. **연산자 순서:** 트리거 노드 내에서 변수를 선언하고 바로 그 변수를 사용하여 다른 계산을 하면 안 됩니다. (반드시 주사위 노드와 계산 노드를 분리할 것)
2. **엣지(Edge) 무결성:** 모든 버튼의 `targetNodeId`는 물리적으로 연결된 엣지의 `target`과 일치해야 엔진 오류가 발생하지 않습니다.
3. **SDT 데이터:** 모든 `Choice`, `Action` 노드의 `sdtEffects`는 필수값이므로 0이라도 반드시 기입되어 있어야 시뮬레이터가 멈추지 않습니다.

---
**이 문서는 LLE 2단계 전투 시뮬레이션의 표준 가이드라인을 제공합니다.**
