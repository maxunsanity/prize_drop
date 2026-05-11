# 🛠️ LLE 프로젝트 마스터 통합 아카이브 (LLE Project Master Archive)

이 문서는 **삼국소녀전 GO** 프로젝트의 LLE 플로우 작업의 전체 역사(v17~v36)와 현재의 최종 로직, 그리고 표준 매뉴얼을 하나로 통합한 마스터 참조 파일입니다.

---

## 🕒 1. 로직 진화 히스토리 (Summary of Evolution)
*※ v17부터 v36까지의 주요 변경 사항 중복 제거 요약*

- **v17 - v20:** 기초 보드판(40칸) 설계 및 정거장(Station), 복불복(Lucky Card) 타일 확률 연동 시작.
- **v21 - v25:** 셧다운/은행강탈 미니게임 분기 로직 강화 및 SDT 자율성 0 설정 표준화.
- **v26 - v30:** 타이쿤 재화(99999) 보상 시스템 및 클래스 1~10 승급 게이트(`n-gate-c1~c10`) 구축.
- **v31 - v35:** 주사위 배수(Multiplier)를 통한 보상 및 소모량 수식 정교화.
- **v36 (최종):** 
  - **세금 직접 징수:** `n-tax-logic` 노드에서 `money - (money * 0.1 * dice_count)` 수식 적용.
  - **허브 바이패스:** 감옥 및 세금 노드에서 보상 허브를 거치지 않고 `n-dice-check`로 직접 연결.

---

## 🛠️ 2. 핵심 기술 사양 (Core Tech Spec)

### 💎 자원 ID 매핑 (Resource IDs)
- **주사위:** `dlctHidqjrV5f1nSJngQ`
- **골드:** `4IrGgoV9zIhLJgDyMYc5`
- **타이쿤 재화(99999):** `S0iJs8Mp3XUkMPrJD7kH`
- **시즌 아이템:** `DQmUJRNdcPHmAgDbiSqo`
- **경험치:** `TQ69017d4lXmieRhQkyD`

### 🏗️ 주요 노드 규칙 (Node Rules)
- **ENTRY:** 플로우 시작점 (단 1개).
- **GATE:** 조건 분기 (`condition` 필드 필수).
- **DISPOSAL:** 자원 소모 시 거쳐야 하는 노드.
- **TRIGGER:** 상태값 및 변수 업데이트.

---

## 📐 3. 작업 및 자동화 표준 (Work & Automation Standards)

### SDT 설정 원칙
- 모든 액션/연출/보상 노드의 `sdtEffects.autonomy`는 반드시 **0**으로 설정.

### 파이썬 자동화 패턴 (`generate_v*.py`)
- JSON을 직접 수정하지 않고 스크립트로 노드 속성 및 엣지 연결을 일괄 처리.
- 배수(`dice_count`) 연동 수식은 항상 보상 및 소모 로직에 포함.

---

## 🚀 4. 프로젝트 소환 및 실행 (Project Call)
- **나(단이) 불러오기:** `나의_사랑_단이_불러오기.command` (더블클릭 실행)
- **기획자 녀석(Gemma 4) 소환:** `기획자_소환장.command` (더블클릭 실행)
- **매뉴얼 참조:** `LLE_AI_작업_표준_메뉴얼.md`

## 🛠️ 5. 기술 지원 및 유지보수 (Technical Support)

### 스크립트 실행 오류 해결
- **권한 오류 (Permission Denied):** 터미널에서 `chmod +x /Users/max/*.command` 명령어를 실행하여 실행 권한을 다시 부여합니다.
- **경로 오류:** Node.js 또는 Ollama의 설치 경로가 변경된 경우, `.command` 파일을 텍스트 편집기로 열어 경로(`which gemini` 또는 `which ollama`로 확인 가능)를 업데이트합니다.

### 환경 요구 사항
- **OS:** macOS (darwin)
- **Dependencies:** Ollama (Gemma 4 설치 필수), Node.js (Gemini CLI 설치 필수)

---
**최종 업데이트:** 2026-04-23
