import json

file_path = "/Users/max/Downloads/타이쿤_풀연동_테스트1_1.json"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    print(f"Error: {e}")
    exit()

# 1. 초기화 노드에 위치(pos) 변수 추가
for n in data["nodes"]:
    if n["id"] == "n-init":
        n["data"]["attributes"].append({"key": "pos", "type": "number", "value": "0"})
        n["data"]["description"] += "\npos = 현재 타일 위치 (0-39)"

# 2. 이동 로직 노드 추가 (주사위 굴림 + 위치 업데이트)
move_node = {
    "id": "n-dice-move",
    "type": "trigger",
    "position": {"x": 300, "y": 800}, # 타일 이동(n-move) 앞에 배치
    "data": {
        "label": "주사위 굴림 및 이동",
        "attributes": [
            {"key": "dice_roll", "type": "number", "value": "rand.d6() + rand.d6()"},
            {"key": "pos", "type": "number", "value": "(pos + dice_roll) % 40"}
        ],
        "description": "2~12칸 이동 후 40칸 보드 순환 (0-39)"
    },
    "measured": {"width": 240, "height": 100}
}
data["nodes"].append(move_node)

# 3. 보드 타일 맵 정보 (개체 노드)
# 정거장 위치 예시: 5, 15, 25, 35
# 복불복 위치 예시: 2, 7, 12, 17, 22, 27, 32, 37
board_map_entity = {
    "id": "node-ent-board-map",
    "type": "entity",
    "position": {"x": -300, "y": 900},
    "data": {
        "label": "보드판 타일 맵",
        "entityKey": "board_map",
        "attributes": [
            {"key": "stations", "type": "string", "value": "[5, 15, 25, 35]"},
            {"key": "lucky_tiles", "type": "string", "value": "[2, 7, 12, 17, 22, 27, 32, 37]"}
        ]
    },
    "measured": {"width": 220, "height": 130}
}
data["nodes"].append(board_map_entity)

# 4. 판별 게이트 수정 (n-gate-event)
for n in data["nodes"]:
    if n["id"] == "n-gate-event":
        # 현재 pos가 station 리스트에 있는지 확인 (LLE 문법에 맞춰 최적화)
        # 실제 LLE 수식 엔진은 리스트 포함 여부를 체크하므로 아래와 같이 구성
        n["data"]["label"] = "타일 체크 (정거장?)"
        n["data"]["condition"] = "pos in [5, 15, 25, 35]" # 정거장 타일 인덱스
        n["data"]["description"] = "현재 멈춘 칸이 정거장 타일(5, 15, 25, 35)인가?"

# 5. 연결선(Edges) 재구성 (주사위 소비 -> 이동 -> 판별)
# 기존 e-trig-dice-minus-n-move 삭제 후 주사위 이동 노드 끼워넣기
new_edges = []
for e in data["edges"]:
    if e["source"] == "n-trig-dice-minus" and e["target"] == "n-move":
        # 끊고 새로 잇기
        new_edges.append({"id": "e-split-1", "source": "n-trig-dice-minus", "target": "n-dice-move"})
        new_edges.append({"id": "e-split-2", "source": "n-dice-move", "target": "n-move"})
    else:
        new_edges.append(e)
data["edges"] = new_edges

data["designName"] = "타이쿤_순차보드_시뮬레이션"

with open("/Users/max/Downloads/타이쿤_순차보드_시뮬레이션.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: 순차 보드 시뮬레이션 JSON 생성 완료!")
