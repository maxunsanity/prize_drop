---
name: game-dev
description: >
  게임 프로젝트를 구현할 때 사용. 프로젝트 폴더에 GAME.md + DESIGN.md + DEV.md
  3개 파일이 있을 때 활성화. 올바른 읽기 순서, 요약 형식, 구현 시작 조건을 안내한다.
compatibility: Claude Code, Cursor, Kiro, Windsurf
metadata:
  author: UNSANITY
  version: "1.0"
  format: game-md-v3
---

# 이 프로젝트의 문서 구조

이 게임 프로젝트는 3개의 MD 파일로 구성된다.

| 파일 | 목적 |
|---|---|
| GAME.md | 게임 규칙·플로우·시스템 설계. 기획서 수준으로 사람도 읽을 수 있다. |
| DESIGN.md | 비주얼 시스템. 색상·폰트·컴포넌트·Do&Don't. Google Stitch DESIGN.md 포맷 기반. |
| DEV.md | 기술 구현 명세. 스택·파일구조·DOM id·Anti-Patterns·버그 기록. AI가 코드 짜는 용도. |

---

# 읽는 순서 (반드시 준수)

```
1. GAME.md  전체 — 이 게임이 무엇인가
2. DESIGN.md 전체 — 어떻게 생겨야 하는가
3. DEV.md   전체 — 어떻게 만드는가
4. DEV.md의 완료 체크리스트 확인
5. 요약 작성 (코드 금지)
6. 사람의 시작 지시 확인 후 코딩 시작
```

---

# 요약 형식

3개 파일을 읽은 후 반드시 아래 형식으로 3줄 요약을 작성한다.
요약 확인 전 코드를 작성하지 않는다.

```
- 이 게임은 무엇인가: [핵심 메커니즘 1~2문장]
- 핵심 기술 구조는 무엇인가: [스택·아키텍처 1~2문장]
- 가장 주의해야 할 Anti-Pattern은 무엇인가: [DEV.md 핵심 1~2가지]
```

---

# 요약 작성 금지 사항

- **감성·마케팅 표현 금지** — "짜릿한", "고성능", "완벽하게", "유기적으로" 사용 금지
- **파일에 없는 내용 추가 금지** — 추측으로 내용을 채우지 않는다
- **과장 금지** — 기술 문서 스타일로 간결하게 작성한다
- **요약 전 코드 작성 금지** — 반드시 요약 확인 후 시작한다

---

# DEV.md 핵심 섹션 우선순위

DEV.md를 읽을 때 이 순서로 중점을 둔다:

1. **기술 스택** — React/바닐라 JS/json-render 여부 확인
2. **json-render 아키텍처** (있을 경우) — 4레이어 구조 이해 필수
3. **Anti-Patterns** — 카테고리별 전부 읽기
4. **버그 기록** — 과거 실수 숙지
5. **완료 체크리스트** — 완료 기준 확인

---

# 스택별 주의사항

## React + json-render 프로젝트

- `@json-render/core`는 공개 npm 라이브러리가 아닌 **프로젝트 전용 선언형 UI 프레임워크**다
- 4레이어 구조: Catalog → Spec → State($state 경로) → Runtime
- $state 경로 수정 시 3곳 동시 패치 필수
- 일반 React 컴포넌트로 대체 금지

## 바닐라 JS 프로젝트

- React·json-render 도입 제안 금지
- DOM 직접 조작 방식 유지

## Three.js 프로젝트 공통

- `camera.up.set(0, 1, 0)` 필수 — (0,0,-1) 설정 시 LookAt Singularity 크래시
- resize 시 `window.innerWidth/Height` 금지 — container.getBoundingClientRect() 기준
- `updateProjectionMatrix()` camera 수치 변경 후 항상 호출

---

# 완료 기준

DEV.md의 완료 체크리스트 전 항목 통과 전 완료 선언 금지.
`npm run build` 통과는 필수 조건이지만 충분 조건이 아니다.
육안으로 화면을 확인해야 한다.
