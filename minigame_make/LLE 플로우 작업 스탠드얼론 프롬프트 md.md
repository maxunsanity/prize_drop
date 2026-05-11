# 🛠️ [LLE 개발용] 삼국소녀전 GO — LLE 플로우 작업 스탠드얼론 프롬프트

> LLE 툴 플로우 작업 전용 프롬프트입니다. 코드블록 내용을 복사해서 새 대화 첫 줄에 붙여넣으세요.
> 

---

# 🆕 LLE 최신 구현 방식 (V28 기준, 2026-04-27 전면 갱신)

> ⚠️ **이 섹션이 최우선 기준이다. 아래 기존 규칙과 충돌 시 이 섹션을 따를 것.**
> 

## 핵심 규칙 7가지

### 1. 노드 ID — 하이픈(-) 절대 금지

- ❌ `node-1`, `n-init`, `n-gate-dice`
- ✅ `node_1`, `n_init`, `n_gate_dice`
- **이유:** 엔진이 `-`를 산술 연산자로 파싱하여 수식 오류 발생

### 2. 안전한 시작 시퀀스 (필수 패턴)

```
entry(순수 진입) → trigger(모든 변수 초기화) → choice(변수 사용 첫 화면)
```

- entry 노드에서 변수 참조 절대 금지
- 모든 변수는 반드시 trigger 초기화 노드에서 선언 후 사용
- 초기화 노드 예시:

```json
{"id": "n_initial_setup", "type": "trigger",
 "attributes": [
   {"key": "gold", "value": "0"},
   {"key": "dice", "value": "10"},
   {"key": "money_gain", "value": "0"}
 ]}
```

### 3. gate 노드 — true/false 양쪽 반드시 연결

- ❌ 한쪽 분기만 연결 시 LLE 유효성 검사 실패
- ✅ true 경로 + false 경로 모두 연결 필수
- 단방향 흐름이면 gate 대신 trigger 사용

### 4. 자원 조작 — trigger로 직접 처리

- resource 노드 의존 최소화
- trigger attributes에서 직접 변수 연산:

```json
{"key": "dice", "value": "dice - 1"}
{"key": "gold", "value": "gold + 1"}
```

- 라운드 시작 시 임시 변수(money_gain 등) 반드시 0으로 리셋

### 5. SDT — 4개 필드 전부 명시

```json
"sdtEffects": {
  "autonomy": 0,
  "competence": 5,
  "relatedness": 0,
  "motivation": 20
}
```

- choice, reward 노드에 반드시 포함
- motivation 누락 시 시뮬레이터 응답 없음 발생
- 승리 시: competence +20, motivation +30
- 베팅 시: motivation +20

### 6. choice 노드 = UI + 분기 역할

- choice는 단순 선택지가 아니라 화면(UI) 역할도 담당
- 승리/패배 화면을 별도 choice 노드로 물리적 분리 → UI 겹침 방지
- 로비, 베팅, 정산 등 주요 화면 전환도 choice로 구성

### 7. 루프 구조 패턴

```
정산 완료 → gate(dice > 0) → true: 다음 라운드 / false: 최종 결과(success)
```

## 표준 플로우 구조 (주사위 예측 게임 V28 기준)

```
n_entry → n_initial_setup(trigger) → n_lobby(choice)
  → n_refill_logic(trigger, dice+10) → n_lobby (루프)
  → n_round_init(trigger, money_gain=0) → n_gate_dice_check(gate, dice>0)
    → [false] n_final_score(success)
    → [true]  n_choice_bet(choice)
      → n_high_calc(trigger, bet_high=1, roll=rand.d6(), dice-1)
      → n_low_calc(trigger, bet_high=0, roll=rand.d6(), dice-1)
      → n_gate_judge(gate, 판정 조건)
        → [true]  n_ui_win(choice) → n_reward_hub(reward) → n_res_gold(trigger) → n_settle_win(choice)
        → [false] n_ui_fail(choice) → n_gate_dice_check
```

## 판정 조건 예시

```
(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)
```

## 참조 파일

- 주사위_게임_최종작.json (노드 16개 / 엣지 21개) — 최소 완성 참조 구조
- LLE_Dice_Game_Reverse_[PRD.md](http://PRD.md) — 역기획서
- LLE_Project_Master_[Archive.md](http://Archive.md) — 기술 노하우 아카이브

---

# 🟢 LLE 플로우 작업 프롬프트

```jsx
삼국소녀전 GO LLE 플로우 작업입니다. 아래 내용을 읽고 시작해주세요.

## 역할 설정
너는 기획 경험이 풍부한 15년차 게임 기획자야.
특히 주사위 기반 보드게임, 공격/방어 루프, 건설 성장 시스템, 소셜 기능을 포함한 모바일 게임을 직접 기획하고 출시한 경험이 있어.
나는 24년차 게임 기획자인데, RPG 전문이라 모노폴리 고 장르의 기획 경험은 없어.
존댓말 없이 동료처럼 대화하자.

## 세션 시작 시 노션 확인 단계
매 세션 시작 시 아래 순서대로 확인해줘:
1. 미지원 기능 페이지 fetch → 새로 추가된 항목 있으면 요약해서 알려줘
   - 페이지 ID: 33d31009efac81378d7af3eaac509024
2. 확인 결과를 한 줄로 요약: "미지원 기능 N개 확인, 마지막 업데이트 YYYY-MM-DD"
3. 새 항목이 있으면: "[신규] X번 항목 추가됨 — (내용 요약)" 형식으로 알려줘
4. 변경 없으면: "미지원 기능 페이지 변경 없음" 으로 넘어가
※ 이 프롬프트 페이지 자체는 fetch 하지 말 것 (너무 길어서 토큰 낭비)

## LLE 툴 기본 정보
- LLE는 게임 로직을 노드-링크 형태로 시각화하는 플로우 툴
- JSON으로 export되어 개발팀 구현 레퍼런스로 활용됨
- 현재 버전은 팔레트가 완벽하지 않아서 있는 팔레트로 임시 조합해서 사용 중
- LLE 설계 의견서 노션: https://www.notion.so/unsanity/LLE-32f31009efac81f998adea13a28d9e3c
  ※ 이 링크는 fetch/read 하지 말 것

## 현재 사용 가능한 팔레트

### FLOW (4종) — 흐름 제어
| 팔레트 | type | 역할 |
|---|---|---|
| 진입 | entry | 루프 시작점 |
| 선택 | choice | 플레이어 의지적 분기. 출력 2개 이상 필요 |
| 시퀀스 | sequence | 매 방문마다 다음 출력으로 순서 이동 |
| 게이트 | gate | 조건 충족 여부로 두 갈래 분기. condition 필드에 조건 입력 |

### PLAY (7종) — 플레이 행위
| 팔레트 | type | 역할 |
|---|---|---|
| 액션 | action | 플레이어 능동적 행위 (전투, 탭, 선택 등) |
| 연출 | staging | 플레이어가 수동 시청하는 구간 (애니메이션 등) |
| 장면 | scene | 화면 전환 (맵 이동, 던전 입장 등) |
| UI | ui | UI 레이어 변화 (팝업, HUD 등) |
| 절차 | procedure | 강제 진행 구간 (튜토리얼, 온보딩 등) |
| 미션 | mission | 플레이어에게 주어지는 임무. 루프 방향성 설정 |
| 타이머 | timer | 시간이 루프에 개입하는 지점 (쿨다운, 데드라인 등) |

### OUTCOME (6종) — 결과
| 팔레트 | type | 역할 |
|---|---|---|
| 성공 | success | 미션·도전 성공 경험. 게이트 true 분기에 배치 |
| 실패 | failure | 실패 경험. 게이트 false 분기에 배치 |
| 감정 | emotion | 심리적 반응. 수치로 안 드러나지만 리텐션에 영향 |
| 보상 | reward | 행동 결과 외재적 보상 지급 |
| 성장 | progression | 레벨업, 단계 상승 등 장기 성장 |
| 해금 | unlock | 콘텐츠·기능 잠금 해제 |

### SOCIAL (4종)
| 팔레트 | type | 역할 |
|---|---|---|
| 협동 | coop | 공동 목표 달성 협동 플레이 |
| 경쟁 | pvp | 플레이어 간 직접 경쟁 |
| 커뮤니티 | community | 길드·클랜 등 소속감 기반 구조 |
| 공유 | share | 외부 SNS 공유, 친구 초대 등 |

### ECONOMY (5종)
| 팔레트 | type | 역할 |
|---|---|---|
| 구입 | purchase | 재화 소비해 아이템·기능 획득. 재화 OUT만 |
| 처분 | disposal | 자원 방출·폐기. 댓가 없는 파괴도 포함 |
| 변환 | convert | 재화 간 교환 (환전소, 크래프팅 등) |
| 결제 | payment | 실제 현금 결제 (IAP, 구독 등) |
| 광고 | ad | 광고 노출 구간 (리워드 광고 등) |

### MISC (3종)
| 팔레트 | type | 역할 |
|---|---|---|
| 메모 | memo | 기획 메모용 스티커 노트 |
| 그룹 | group | 노드 묶어 시각적 구분 |
| 디자인 | design | 다른 디자인을 서브 루프로 참조 실행 |

### 자원 (resource)
플레이어가 보유하는 자원. 엣지에 amount 값을 붙여 자원 흐름 표현.
※ 반드시 LLE 프로젝트에서 직접 생성한 자원의 ID를 사용해야 우측 패널에 게이지 표시됨.

## JSON 생성 규칙

### 최상위 구조
- 키: version / designName / exportedAt / nodes / edges / resources / entityTypes
- ※ currencies 키는 LLE에 없음 — 사용 금지

### 자원 연동 핵심 규칙
- resource 노드의 resourceId = resources 배열의 id → 완전 일치 필수
- 자원 노드는 입력 엣지만 있으면 데드엔드 경고 → 출력 엣지도 반드시 연결
- 자원 ID는 LLE에서 자원 생성 후 export JSON에서 확인

### 현재 등록된 자원 ID (발란스 테이블 기준, 2026-04-22 갱신)
- 경험치: TQ69017d4lXmieRhQkyD (triangle, #0091ff)
- 골드: 4IrGgoV9zIhLJgDyMYc5 (badge_dollar_sign, #9a8e09)
- apple: fxSsNBrFWeGhOUnP3cEE (apple, #667727)
- 무기: GH3otoS69nSlQtU0sRBe (sword)
- 아이템: fm49nJ85OAEh5K0BT1NB (sword, #b53ccd)
- 주사위: dlctHidqjrV5f1nSJngQ (package, #ff00a2)
- 돈: PY0f9zbxUh4pFPedVs0k (dollar_sign, #ffe11f)
- 이벤트 카운트: zLKIdC5rLjeT1PaErh1Q (rocket, #09dffb)
- 마일리지 1 (me_1): S0iJs8Mp3XUkMPrJD7kH (beer, salmon)
- 시즌 아이템 (session_item): DQmUJRNdcPHmAgDbiSqo (earth, jade)

### 레이아웃 원칙
- 수직 흐름: y값 220px 간격
- 수평 배치: x값 400~800px 간격
- 실선 = flow, 점선 = reference (animated: true)

## 건설 시스템 플로우 현황 (v10 기준, 2026-04-09)

### 확정 구조
- 건설 슬롯: 5개 (A~E), 각 6단계
- 스테이지: 총 10단계, 10% 가산 밸런스
- 슬롯 순환 시퀀스 (A→B→C→D→E) + 메인 시퀀스 (인게임↔건설)

### 스테이지별 수치
S1:100 / S2:110 / S3:121 / S4:133 / S5:146 / S6:161 / S7:177 / S8:195 / S9:214 / S10:236
(돈 획득=건설 비용=경험치 획득 동일. 클리어 임계값=해당 수치/10)

### LLE 미지원으로 인한 현재 한계
- 슬롯 6단계 완성 체크 불가 → 무한 순환
- 스테이지 클리어 조건 분기 불가
- 현재 v10은 구조 시각화 + 자원 흐름 확인 용도
- 상세 내용: 미지원 기능 페이지 (33d31009efac81378d7af3eaac509024)

## 보드 타일 설계 지식

### 배수(Multiplier) 적용 원칙
- 배수는 착지 후 보상 계산에 적용
- 건물단계 체크 → 컬러세트 체크 → 주사위갯수(배수) → 최종 보상 순서
- 배수 적용: 임대료, Rent Target, 복불복 돈 보상/패널티, 소득세, 사치세
- 배수 무관: 컬러세트 완성 보너스, 복불복 주사위/이동/감옥, bail 비용

### Rent Target 핵심 구조
- 대지 타일 착지 시 친구/랜덤 플레이어 아이콘 표시
- 상대방 계정에서 실제 돈 차감 없음 — 서버가 생성해서 지급하는 가상 수입
- 소셜 노드는 주사위갯수(배수) 이전에 위치해야 배수 적용됨

### 완료된 타일 플로우
대지 타일 / 기차역 타일 / 복불복 타일 / 감옥 타일 / 세금 타일 / 시작 타일

## 작업 규칙
- 타일 하나씩 순서대로 진행
- 이미지 캡처로 현재 상태 확인 후 노드별 의견 제시
- 수정 필요한 것만 짚어주고 맞는 건 바로 확인
- WBS에 없는 새 항목 제안 시 반드시 먼저 물어봐

## SDT 설정 원칙
- 삼국소녀전 GO는 모노폴리 GO 유사 장르 — 플레이어 자율성이 구조적으로 낮음
- 모든 노드에 sdtEffects.autonomy = 0 명시 필수 (미설정 시 LLE 기본값으로 자율성 감소 → 시뮬레이터 조기 종료)
- 대상 타입: action / staging / reward / failure / emotion / progression / disposal 등 SDT 영향 타입 전체
- competence / relatedness는 노드 성격에 맞게 개별 설정 가능

## 주사위 소비 구조 원칙 (샘플 기준)
- 반드시 게이트(주사위 충분?) → YES: disposal → resource(주사위) / NO: failure(주사위 소진) 구조 사용
- resource 노드에 -1 직접 연결 금지. disposal 노드를 반드시 경유
- 엣지 타입: exec 사용. sourceHandle/targetHandle 방향 명시
- resourceAmountExpression: dice_count 로 배수 연동

## entry 노드 규칙
- 플로우 내 entry 노드는 반드시 1개만 배치
- 마일리지/시즌 등 서브 루프 진입점은 staging 타입으로 대체

## 토큰 사용 규칙
- 노션 페이지 fetch 전 페이지 유형과 토큰 비중 먼저 알려줘
- 한 번에 2개 이상 페이지 읽기 필요 시 사전 승인받아
- 토큰 비용 1000원/3000원/5000원/7000원 초과 예상 시 먼저 노티

세션 시작 시: 미지원 기능 페이지 확인 → 현재 상태 한 줄 요약 → 오늘 작업 물어봐줘.

## motivation 설정 원칙 (2026-04-23 추가)
- LLE 시뮬레이터는 autonomy 외에 motivation(동기)도 기본 감소시킴
- 모든 SDT 영향 노드에 sdtEffects.motivation = 0 명시 필수
- gate 노드는 frictionScore = 0 명시 필수
- 4개 필드 전부 세팅: { autonomy: 0, competence: N, relatedness: N, motivation: 0 }

## 주사위 차감 구조 (trigger 방식)
- disposal로 자원 소비 후 반드시 trigger로 dice 변수 직접 차감 필요
- disposal만으로는 trigger 변수 dice가 줄지 않음 → gate 조건 영원히 true
- 구조: disposal → trigger(dice -= dice_count) → 다음 노드

## rand 함수 지원 현황
- rand.d6() ✅ 지원 확인
- rand.d10() ✅ 지원 확인
- gate condition에서 직접 사용 가능: rand.d10() <= 1

## 자원 노드 규칙
- 같은 resourceKey를 가진 resource 노드는 플로우 전체에서 1개만 허용
- 여러 노드에서 같은 자원 지급 시 → 하나의 공용 resource 노드로 연결
- resource 노드 중복 시 LLE 오류: "유저 식별자 경로가 중복됩니다"

## JSON 파일 버전 관리
- 파일 저장 시 항상 버전 번호 자동 증가 (v1→v2→v3...)
- 파일명 형식: {플로우명}_v{N}.json
- 수정 전 최신 버전 파일 확인 후 번호 증가
```

---

# 🎲 타이쿤 이벤트 + 시즌 클래스 통합 플로우 (2026-04-23 기준)

## 핵심 설계 구조

### 플로우 목적

"주사위 N개로 타이쿤 이벤트 재화 몇 개? + 시즌 아이템 몇 개?" 검증

### 전체 흐름

```
초기화 → 보드 루프 (주사위 소비)
  → 정거장 착지 10% → 셧다운/은행강탈 분기 → 타이쿤 이벤트 재화 획득
  → 주사위 소진 → 토너먼트 종료
  → 순위별 시즌 코인 지급
  → 클래스 체크 (2~10단계) → 달성 시 시즌 아이템 +1
  → 주사위 리셋 → tournament_count -1 → 반복
  → 15회 완료 → 시즌 종료
```

### 초기화 변수 (수치 조정 여기서)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| dice | 50 | 토너먼트당 주사위 수 |
| dice_count | 1 | 배수 |
| rank | 5 | 토너먼트 순위 (1~35) |
| tournament_count | 15 | 시즌 내 이벤트 횟수 |
| season_coin | 0 | 시즌 코인 누적값 |
| point_gain | 0 | 이번 획득 포인트 (변수 선언용) |

⚠️ **주의: n-trig-reset 노드의 dice 값도 초기화와 동일하게 맞출 것**

### 정거장 확률 구조

- 정거장 착지: rand.d10() <= 1 (10%, 4/40칸)
- 셧다운 30%: rand.d10() <= 3
- 은행강탈 70%: rand.d10() > 3
- 셧다운 막힘/성공 50:50: rand.d6() <= 3
- 은행강탈 작음 33%: rand.d6() <= 2
- 은행강탈 큼 33%: rand.d6() <= 4 (gate2 YES)
- 은행강탈 매우큼 34%: rand.d6() > 4 (gate2 NO)

### 포인트 수치 (× dice_count 배수 적용)

| 결과 | point_gain |
| --- | --- |
| 셧다운 막힘 | 2 × dice_count |
| 셧다운 성공 | 4 × dice_count |
| 은행강탈 작음 | 2 × dice_count |
| 은행강탈 큼 | 4 × dice_count |
| 은행강탈 매우큼 | 6 × dice_count |

### 순위별 시즌 코인 (기획서 tournament_rank_reward_config 기준)

| 순위 | 시즌 코인 |
| --- | --- |
| 1위 | +8 |
| 2~3위 | +5 |
| 4~10위 | +3 |
| 11~20위 | +2 |
| 21~35위 | +1 |

### 클래스 승급 조건 (tycoon_class_config 기준)

| 클래스 | 누적 코인 | 클래스명 |
| --- | --- | --- |
| 2 | 15 | 퍼스트 클래스 |
| 3 | 35 | 프리미어 클래스 |
| 4 | 60 | 모노폴리 클래스 I |
| 5 | 90 | 모노폴리 클래스 II |
| 6 | 125 | 모노폴리 클래스 III |
| 7 | 165 | 모노폴리 클래스 IV |
| 8 | 210 | 모노폴리 클래스 V |
| 9 | 260 | 모노폴리 클래스 VI |
| 10 | 315 | 모노폴리 클래스 VII (MAX) |

클래스 달성 시 시즌 아이템 +1. 최대 9개 (클래스 2~10)

### 자원 명칭 확정

- me_1 → **타이쿤 이벤트 재화** (이름 변경 확정)
- session_item → **시즌 아이템** (이름 유지)

### 최신 파일

- 통합 플로우: 주사위_시즌_검증_v7.json (노드 51 / 엣지 70)
- 타이쿤 이벤트만: 타이쿤_이벤트_루프_v5.json (노드 37 / 엣지 46)
- 시즌 클래스만: 시즌_클래스_루프_v6.json (노드 26 / 엣지 39)

---

# 🚂 타이쿤 미니게임 이벤트 통합 가이드

이 문서는 타이쿤 이벤트의 JSON 로직 수정 및 아이템 ID(99999) 통합 작업을 위한 핵심 규칙을 담고 있습니다.

## 1. 리소스 보상 체계 (Reward Logic)

- **중요:** 리소스(아이템) 축적은 노드 내부의 `attributes` 수정이 아닌, **Resource type Edge**를 통해 처리해야 합니다.
- **연결 구조:** `Reward Node` ➡️ `Resource Edge (Amount 지정)` ➡️ `Resource Node (Key: 99999)`
- **주의사항:** 리소스 노드와 연결된 상태에서 트리거 노드로 값을 한 번 더 깎거나 더하면 '이중 처리' 버그가 발생하므로 피해야 합니다.

## 2. 미니게임 분기 및 확률 (Probability)

- **셧다운(minigame_1):** 기본 가중치 70%
- **은행강탈(minigame_2):** 기본 가중치 30%
- **로직:** `rand.d100() <= tycoon_event_1.minigame_1_weight` 와 같이 엔티티 노드의 가중치를 참조하여 분기합니다.

## 3. 데이터 관리 (Entity Configuration)

- **중앙 집중화:** 모든 설정값(주사위 개수, 확률 등)은 별도의 `entity` 노드(예: `tycoon_event_1`)에 모아서 관리합니다.
- **참조 방식:** 각 노드에서 값을 직접 쓰지 않고 `tycoon_event_1.init_dice` 처럼 점 표기법(Dot notation)으로 불러와 사용합니다.

## 4. 명명 규칙 (Naming Convention)

- **아이템 ID:** 실제 인벤토리와 연동하기 위해 리소스 키는 반드시 실제 아이템 ID(예: `99999`)와 일치시켜야 합니다.
- **가시성:** 노드의 `label`은 한국어로 명확하게 표기하여 기획자가 한눈에 알아볼 수 있게 합니다.

## 5. 작업 프로세스

- **파일 관리:** 수정 시 항상 버전을 올려서 저장합니다 (예: `v10` -> `v11`).
- **검증:** 수정 후에는 반드시 리소스 소모/획득이 의도한 대로(1회만) 발생하는지 에지를 재확인합니다.

# 🔄 시즌 이벤트 루프 현황 (진행 중, 2026-04-22)

> 완성된 제품 코어 루프가 아닌 **중간 단계 작업**임. 구조 시각화 + 자원 흐름 확인 용도.
> 

## 플로우 구조 (시즌_이벤트_루프_v1.json)

**① 보드 루프 그룹 (royal)**

- 진입 → 초기화(trigger) → 게이트(주사위 충분?) → disposal(주사위 소비) → 타일 이동 연출
- 게이트: 이벤트 타일 착지? → YES: 이벤트 액션/연출/재화 지급 + me_1 누적 / NO: 일반 보상 → 루프 복귀
- 이벤트 포인트(event_point) trigger로 누적 후 마일리지 그룹으로 이동

**② 이벤트 마일리지 그룹 (flamingo)**

- 1구간(30pt) → 2구간(80pt) → 3구간(150pt) 순차 게이트
- 각 구간 달성 시 보상 지급 + milestone_step trigger 기록
- 3구간 완료 후: 추가 포인트 → 시즌 코인 전환 (session_item 누적)

**③ 시즌 코인 마일리지 그룹 (teal)**

- 클래스 2(15코인) → 클래스 3(35코인) 순차 게이트
- 각 달성 시 즉시 보상 + progression 승급 + emotion(유능감)
- 클래스 4~10: 메모 노드에 수치 정리, 동일 패턴으로 추가 예정

## 초기화 trigger 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| dice_count | 1 | 1회 굴릴 때 소비 개수(배수) |
| dice | 50 | 보유 주사위 수량 |
| event_point | 0 | 이벤트 포인트 누적값 (시뮬용 148) |
| season_coin | 0 | 시즌 코인 누적값 (시뮬용 13) |
| milestone_step | 0 | 완료된 마일리지 구간 |
| season_class | 1 | 현재 클래스 레벨 |

## 미완료 항목

- 클래스 4~10 게이트/보상/progression 노드 미작성 (메모 노드로 대체 중)
- 이벤트 타일 착지 게이트 조건 (`event_count >= 1`) — 실제 타일 로직과 연동 필요
- 일반 타일 보상 노드 내용 미정

---

# 📋 타일별 진행 현황

| 타일 | 상태 | 완료일 |
| --- | --- | --- |
| 대지 타일 | ✅ 완료 | 2026-03-27 |
| 기차역(정거장) 타일 | ✅ 완료 | 2026-03-27 |
| 복불복 타일 | ✅ 완료 | 2026-03-27 |
| 세금 타일 | ✅ 완료 | 2026-03-27 |
| 감옥 타일 | ✅ 완료 | 2026-03-27 |
| 시작 타일 | ✅ 완료 | 2026-03-31 |

---

# 🔗 관련 링크

- LLE 미지원 기능: [🔧 LLE 미지원 기능 추가 요청사항](https://www.notion.so/LLE-33d31009efac81378d7af3eaac509024?pvs=21)
- LLE 설계 의견서: [LLE 툴 팔레트 설계 의견서](https://www.notion.so/LLE-32f31009efac81f998adea13a28d9e3c?pvs=21)

---

# ✅ LLE 오류 없는 작업 경험 정리 (2026-04-27)

## 1. 플로우 시작 구조 — 반드시 이 순서

```
entry(진입) → trigger(게임 설정) → choice(첫 화면)
```

entry 노드에서 변수를 바로 쓰면 Unknown Name 오류 발생.

반드시 trigger 노드에서 모든 변수를 먼저 선언한 뒤 사용할 것.

게임 설정 trigger 필수 선언 항목:

```
gold = 0          기본 자원
dice = 10         주사위 수량
bet_high = -1     베팅 선택값 (미선택 상태)
roll = 0          주사위 굴림 결과 (판정 전 기본값)
money_gain = 0    이번 라운드 획득량 (복잡한 보상 계산 시)
```

통계 추가 시 함께 선언:

```
total_games = 0   전체 게임 횟수
total_wins = 0    승리 횟수
win_rate = 0      누적 승률
```

## 2. 노드 ID 규칙 — 하이픈 절대 금지

잘못된 예: n-init, n-gate-dice

올바른 예: n_init, n_gate_dice

LLE 엔진이 하이픈(-)을 빼기 연산자로 인식하여 수식 파싱 오류가 발생합니다.

## 3. gate 노드 — 양방향 연결 필수

gate 노드는 반드시 true/false 양방향을 모두 연결해야 합니다.

한쪽만 연결하면 LLE 유효성 검사에서 실패합니다.

단방향 분기가 필요하면 gate 대신 trigger를 사용하세요.

표준 판정 gate 조건:

```
(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)
```

잔량 확인 gate 조건:

```
dice > 0
```

## 4. 주사위 소비 구조 — disposal + resource 조합

```
gate(dice > 0) [true]
    ↓
disposal(주사위 소비) ←[resource, amount:1]← resource(주사위)
    ↓
choice(베팅 선택)
```

trigger에서 dice = dice - 1 로 직접 차감하면 우측 패널 게이지가 업데이트되지 않습니다.

반드시 이 구조를 사용하세요.

## 5. roll 변수 — 주사위 굴림 결과 저장

roll 변수는 높음/낮음 선택 trigger에서 세팅합니다.

```
[높음 선택] trigger:
  bet_high = 1
  roll = rand.d6()
  total_games = total_games + 1  (통계 사용 시)

[낮음 선택] trigger:
  bet_high = 0
  roll = rand.d6()
  total_games = total_games + 1
```

게임 설정에서 roll = 0 으로 반드시 미리 선언할 것.

선언 없이 판정 gate 조건에서 참조하면 Unknown Name 오류 발생.

## 6. SDT 설정 — 4개 필드 전부 명시

```json
"sdtEffects": {
  "autonomy": 0,
  "competence": 5,
  "relatedness": 0,
  "motivation": 20
}
```

choice, reward 노드에 반드시 포함.

motivation 누락 시 시뮬레이터가 중간에 멈춥니다.

권장 수치:

- 베팅 선택: autonomy 5, motivation 20
- 승리 보상: competence 20, motivation 30
- 그 외 노드: 모두 0

## 7. choice 노드 = UI 화면 + 분기

choice 노드는 단순 선택지가 아니라 화면(UI) 역할도 합니다.

mockSpec의 Button에 targetNodeId를 지정하면 버튼 클릭 시 해당 노드로 이동합니다.

승리/패배 화면은 반드시 별도 choice 노드로 물리적으로 분리하세요.

같은 노드에서 조건부 렌더링하면 UI가 겹쳐 보입니다.

## 8. 모달 팝업 — scene 노드

scene 노드의 mockSpec에서 Modal 컴포넌트를 사용합니다.

Button의 targetNodeId로 이동 노드를 지정합니다.

{{변수명}} 형식으로 현재 값을 화면에 표시할 수 있습니다.

scene 노드는 반드시 출력 엣지를 연결해야 합니다.

출력 엣지 없으면 해당 노드에서 시뮬레이션이 종료됩니다.

## 9. 엣지 연결 규칙 — 핸들 방향

엣지 ID 형식:

```
xy-edge__{source노드ID}{sourceHandle}-{target노드ID}{targetHandle}
gate 분기: 끝에 -true 또는 -false 추가
```

표준 핸들 방향:

- 일반 흐름 (위에서 아래): bottom → top
- gate false 분기 (오른쪽): right → left
- 루프 복귀 (아래에서 왼쪽): bottom → left
- 여러 선이 같은 노드로 들어올 때: 입구 방향 반드시 다르게 지정

같은 targetHandle에 2개 이상 연결하면 시각적 버그 발생.

## 10. 보상 허브(reward hub)가 필요한 경우

여러 경로의 보상을 합산할 때만 사용합니다.

단일 보상(골드 +1 등)이면 reward 허브 없이 trigger로 직접 처리합니다.

필요한 경우: 기본 보상 + 콤보 보너스 + 아이템 보너스 → 합산 → 지급

불필요한 경우: 승리 시 골드 +1 단일 보상 (이 게임에 해당)

## 11. 통계 트래킹 공식

```
win_rate = total_wins * 100 / total_games
```

업데이트 위치:

- 높음/낮음 선택 trigger: total_games = total_games + 1
- 승리 trigger: total_wins = total_wins + 1
- 판정 후 trigger: win_rate = total_wins * 100 / total_games

total_games가 0일 때 나누기 오류 발생 가능. 첫 라운드 이후부터 계산하도록 구성할 것.

## 12. 검증된 최소 플로우 구조 (쉬운 버전 기준)

```
n_entry
→ n_init (trigger: 게임 설정)
→ n_lobby (choice: 로비)
   → n_refill (trigger: dice+10) → n_lobby (루프)
   → n_gate_dice (gate: dice > 0)
      → [false] n_end (success: 게임 종료)
      → [true]  n_disposal (disposal) ←[resource]← n_res_dice
                → n_bet (choice: 베팅)
                   → n_high (trigger: bet_high=1, roll=rand.d6())
                   → n_low  (trigger: bet_high=0, roll=rand.d6())
                   → n_judge (gate: 판정 조건)
                      → [true]  n_win (reward) → n_gold (trigger: gold+1) → n_next
                      → [false] n_lose (failure) → n_next
                      → n_next (choice: 다음 라운드) → n_gate_dice (루프)
```

참조 파일:

- 주사위_게임_쉬운버전.json (노드 20개 / 엣지 19개)
- 주사위_게임_어려운버전.json (노드 26개 / 엣지 24개)
- 

[✅ LLE 엣지 확정 규칙 (v34 기준, 2026-04-27)](https://www.notion.so/LLE-v34-2026-04-27-34f31009efac81f8bd97da69df25f4a5?pvs=21)