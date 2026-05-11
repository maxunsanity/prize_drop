# README.md — 프로젝트 안내 & AI 온보딩

> **AI Agent** — 새 채팅에서 이 프로젝트를 시작할 때, 이 파일을 가장 먼저 읽으세요.
> **개발자** — 새 게임의 GAME.md를 작성할 때 이 구조를 따르세요.

---

## 이 프로젝트가 하는 일

**프로젝트:** 삼국소녀전 GO — 안티그래비티 개발

**작업 내용:** 미니게임 이벤트 시스템의 각 게임을 GAME.md 포맷으로 작성한다.

**무엇을 위해:** 한 파일이 없으면 AI는 세션이 바뀌면 가장 중요한 설계 의도를 잊어버렸다. GAME.md는 한 파일이 게임의 **영원한 진실(source of truth)**가 되도록 강제하는 구조다.

---

## 파일 구조

```
/games/
  hidden-temple/
    GAME.md          ← 게임 정의 (SPEC.md 포맷을 따름)
  dragon-nest/
    GAME.md
  archery-arena/
    GAME.md
  train-journey/
    GAME.md
  sky-race/
    GAME.md
  lava-quest/
    GAME.md
SPEC.md              ← 포맷 규칙 + AI 행동 지침
README.md            ← 이 파일 (프로젝트 맥락 + 스타트 가이드)
```

---

## AI에게 제공하는 순서

새 채팅 시작 시 **이 순서대로** 제공한다:

```
1단계: README.md  → "이 프로젝트가 뭔고 어떻게 쓰는가"
2단계: SPEC.md    → "포맷 규칙을 숙지해"
3단계: GAME.md    → "이 규칙으로 이 게임을 읽어"
```

README 없이 GAME.md만 주면 AI가 포맷을 추측해서 읽는다.
SPEC 없이 GAME.md만 주면 AI가 행동 규칙 없이 동작한다.
**세 파일이 함께 있어야 시스템이 완성된다.**

---

## GAME.md가 쓰는 포맷

GAME.md는 두 부분으로 나뉘어진다:

```
---                          ← YAML front matter (기계 파싱용)
identity: ...
components: ...
entities: ...
mechanics: ...
goals: ...
---

## Design Pillars            ← 고정 산문 제목 4개 (헤더 순서 불변)
## Mechanics in Depth
## Content Guidelines
## Anti-Patterns
```

| 부분 | 도구 | 역할 |
|---|---|---|
| YAML front matter | 기계 파싱 | 구현 가능한 규칙, entity, action |
| Markdown body | AI + 사람이 읽음 | 설계 의도, 확장 방법, 금지 패턴 |

스펙 전문은 `SPEC.md`를 참조하라.

---

## AI가 해야 할 일 (Agent Rules)

### 읽기 순서

GAME.md를 받았을 때 이 순서로 읽는다:

```
1. identity.pitch        → 게임의 핵심 의도 파악
2. Design Pillars        → 판단 기준 파악
3. entities + components → 게임 오브젝트 파악
4. mechanics.actions     → 유효한 행동 목록 파악
5. goals                 → 승/패 조건 파악
6. Mechanics in Depth    → 엣지 케이스 파악
7. Content Guidelines    → 콘텐츠 생성/수정 전 확인
8. Anti-Patterns         → 콘텐츠 생성/수정 전 확인
```

### 판단이 필요한 상황

YAML이 답을 주지 않으면:

1. `identity.pitch` — 가장 가까운 의도
2. 관련 Design Pillar — 어느 원칙에 부합하는가
3. Mechanics in Depth — 유사 엣지 케이스 설명이 있는가
4. 위 세 가지로 판단 안 되면 — **행동하지 않고 질문한다**

### 콘텐츠 생성 전 체크리스트

새 entity, action, stage, 아이템 등을 생성하기 전:

- [ ] `Content Guidelines`를 읽었는가
- [ ] `Anti-Patterns`를 확인했는가
- [ ] 생성할 콘텐츠가 `Design Pillars` 중 하나라도 위반하지 않는가
- [ ] 새 `action`이 필요한가 → 필요하면 YAML에 추가

### 미정의 콘텐츠 처리

| 상황 | 동작 |
|---|---|
| YAML에 없는 action 요청 | 유효하지 않음. Markdown에서 명시 허용시만 예외 |
| 알 수 없는 최상위 YAML 키 | 정책에 따라 보존 또는 경고 |
| 고정 섹션 사이 삽입된 알 수 없는 `##` | 순서 보장 불가 경고 |
| `players: "2+"` 형식 | 거부 또는 정규화 필요 |

---

## 잘 만들어진 GAME.md의 기준

**pitch 조건:** 한 문장으로 게임을 설명할 수 있는가

**actions 조건:** 목록이 완전한가 (누락된 행동이 없는가)

**preconditions 조건:** 구현 가능한 수준으로 구체적인가

**Pillars 조건:** 실제 타이브레이커로 작동하는가 ("좋은 게임" 같은 추상적 표현 금지)

**Anti-Patterns 조건:** 어떤 Pillar가 깨지는지 명시되어 있는가

### 자주 하는 실수

**Pitch가 두 문장** — pitch는 정확히 한 문장. 더 길면 핵심이 흐려진다.

**Actions이 불완전** — "이런 것도 할 수 있다"는 Mechanics in Depth에 적는 게 아니라 반드시 YAML actions에 있어야 한다.

**Component가 너무 큼** — `player_state`에 모든 것을 넣으면 재사용이 불가능해진다.

**Design Pillars가 비어있음** — AI가 판단 기준 없이 동작한다. 반드시 2개 이상 작성.

**Anti-Patterns에 이유 없음** — "이것을 하지 마라"만 있고 왜인지 없으면 AI가 우회 방법을 찾는다. 항상 어느 Pillar가 깨지는지 명시.

---

## 현재 완성된 GAME.md 목록

| 게임 | 장르 | 상태 |
|---|---|---|
| Hidden Temple | 캐주얼 이벤트, 발굴형 | ✅ 완료 |
| Dragon Nest | 코어, 2인 협력, 핀볼 | 학습 중 |
| Archery Arena | 랜킹 경쟁, 비동기 | 학습 중 |
| Train Journey | 4인 협력, 건설 | 학습 중 |
| Sky Race | 5인 레이스, 레이어 | 학습 중 |
| Lava Quest | 레벨 진행형 | 학습 중 |
