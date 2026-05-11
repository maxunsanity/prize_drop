# 🀄 event_tile_config — 타일 포인트 설정 기획서

> 📌 이벤트 시스템 기획서 하위 테이블 상세 문서
> 

> 상위 기획서: 🎪 이벤트 시스템 기획서
> 

> 작성일: 2026-04-21
> 

---

# 1. 개요

`event_tile_config`는 **타일 지정형 이벤트**에서 어떤 타일에 착지했을 때 몇 포인트를 줄지를 정의하는 테이블이다.

`event_board_config`(이벤트 인스턴스)와 1:N 관계. 이벤트 1개당 행 여러 개.

**픽업형(is_pickup_type=true) 이벤트는 이 테이블을 사용하지 않는다.** 픽업형은 `event_board_config.pickup_point`만 사용.

---

# 2. 스키마

| 필드명 | 타입 | 설명 | 값 예시 |
| --- | --- | --- | --- |
| **tile_config_id** | bigint | PK | 20001 |
| **event_id** | bigint | FK → event_board_config.event_id | 10001 |
| **tile_type** | string | 대상 타일 타입 Enum (섹션 3 참조) | CHANCE |
| **tile_point** | int | 해당 타일 착지 시 기본 포인트 (배수 미적용) | 1 |
| **sort_order** | int | UI 팝업 타일 카드 표시 순서 (오름차순) | 1 |

---

# 3. `tile_type` Enum

| 값 | 대상 칸 | 보드 내 개수 | 비고 |
| --- | --- | --- | --- |
| **CHANCE** | 복불복 | 6칸 | 착지 시 정거장 이동 카드 추가 발동 가능 |
| **COMMUNITY_CHEST** | 사회사업기금 | 6칸 |  |
| **RAILROAD** | 정거장 | 4칸 | 토너먼트 포인트 동시 획득 가능 (Double-Dip) |
| **TAX** | 세금 | 2칸 | GO 이후 구간 집중 배치 |
| **UTILITY** | 공공기관 | 2칸 |  |
| **CORNER** | 모서리 4칸 전체 (GO / 감옥방문 / Free Parking / 감옥행) | 4칸 | 모서리 전용 이벤트 시 1행으로 전체 커버 |

---

# 4. 운영 규칙

| 규칙 | 내용 |
| --- | --- |
| 이벤트당 행 수 | 제한 없음. 일반적으로 2~4행. 이론상 tile_type 종류(6종) 전부 등록 가능 |
| 중복 등록 | 같은 event_id 내 동일 tile_type 중복 등록 불가 |
| 픽업형 예외 | is_pickup_type=true인 이벤트는 이 테이블에 행 없음 |
| sort_order | 팝업 UI 타일 카드 좌→우 표시 순서. 1부터 시작 |
| 포인트 계산 | tile_point는 배수 미적용 기준값. 실제 지급 포인트 = tile_point × 현재 주사위 배수 |
| 서버 조회 | 타일 착지 시 event_id + tile_type으로 이 테이블 조회 → 매칭 행 있으면 포인트 계산 진행 |

---

# 5. 샘플 데이터

| tile_config_id | event_id | tile_type | tile_point | sort_order |
| --- | --- | --- | --- | --- |
| 20001 | 10001 | CHANCE | 1 | 1 |
| 20002 | 10001 | COMMUNITY_CHEST | 1 | 2 |
| 20003 | 10001 | RAILROAD | 2 | 3 |
| 20004 | 10002 | CORNER | 4 | 1 |
| 20005 | 10004 | TAX | 3 | 1 |
| 20006 | 10004 | UTILITY | 2 | 2 |

> 📌 event_id 10001 (콩나무 노다지): 복불복+1 / 사회사업기금+1 / 정거장+2 — 타일 3종
> 

> 📌 event_id 10002 (모서리 대행진): CORNER+4 — 1행으로 모서리 4칸 전체 커버
> 

> 📌 event_id 10003 (황금 픽업): 픽업형 → 이 테이블에 행 없음
> 

> 📌 event_id 10004 (세금 회수): 세금+3 / 공공기관+2 — 타일 2종
> 

---

# 6. 타일 배치와 전략적 고려사항 (기획 참고용)

| tile_type | 보드 내 분포 특성 | 기획 시 고려 포인트 |
| --- | --- | --- |
| CHANCE | 6칸, 비교적 고르게 분포 | 정거장 이동 카드 발동 시 RAILROAD 이벤트와 시너지 가능 |
| COMMUNITY_CHEST | 6칸, 비교적 고르게 분포 | CHANCE와 세트로 묶는 경우 많음 |
| RAILROAD | 4칸, 균등 간격 (10칸마다 1개) | 토너먼트 동시 진행 시 Double-Dip 효과. 유저 참여 유도에 유리 |
| TAX | 2칸, GO 이후 구간에 집중 | 적은 개수라 포인트 높게 설정하는 경우 많음. 세금+복불복 구간 집중 전략 유도 |
| UTILITY | 2칸, 분산 배치 | 개수 적어 단독 이벤트 시 난이도 높음. TAX와 묶는 경우 많음 |
| CORNER | 4칸, 보드 모서리에 균등 배치 | 오토롤 유리. 단독 이벤트로 운영 시 진입 장벽 낮음 |

---

# 7. 관련 테이블 참조

- **event_board_config** → 이벤트 인스턴스 정의 (기간 / pickup_point / milestone_group_id / mission_slot)
- **board_tile_config** → 실제 보드 타일 배치 정의 → 보드 설계 허브
- **player_event_milestone_state** → 유저별 포인트 누적 상태

---

**작업 이력**

- 2026-04-21: 신규 작성. event_board_config에서 tile 고정 슬롯 분리. 1:N 구조 확정.