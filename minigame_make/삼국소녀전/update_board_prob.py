import json
import sys

file_path = "/Users/max/Downloads/타이쿤_풀연동_테스트1_1.json"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    print(f"Error reading JSON: {e}")
    sys.exit(1)

# 보드 설정 가상 데이터 (Entity 노드) 생성
board_config_entity = {
    "id": "node-ent-board-config", 
    "type": "entity", 
    "position": {"x": 50, "y": 900},
    "data": {
        "label": "보드 이벤트 확률 설정", 
        "entityKey": "board_config",
        "attributes": [
            {"key": "station_tile_chance", "type": "number", "value": "10"}, # 40칸 중 정거장 4칸 = 10% 확률 (예시)
            {"key": "lucky_card_chance", "type": "number", "value": "15"},   # 복불복 타일 칸 확률 (예시 15%)
            {"key": "lucky_to_station_chance", "type": "number", "value": "30"} # 복불복에서 정거장으로 이동할 확률 30%
        ]
    },
    "measured": {"width": 240, "height": 180}
}

data["nodes"].append(board_config_entity)

# "정거장 착지?" 게이트 수정
for n in data["nodes"]:
    if n.get("id") == "n-gate-event": # 기존 '정거장 착지?' 게이트 ID
        # 최종 확률 = 기본 정거장 착지 확률 + (복불복 타일 착지 확률 * 복불복에서 정거장 갈 확률)
        condition = "rand.d100() <= board_config.station_tile_chance + (board_config.lucky_card_chance * board_config.lucky_to_station_chance / 100)"
        n["data"]["condition"] = condition
        n["data"]["description"] = "정거장 직행 + (복불복 타일 × 복불복 30%) 최종 확률 계산!"

data["designName"] = "타이쿤_보드확률_연동"

out_path = "/Users/max/Downloads/타이쿤_보드확률_연동.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"SUCCESS: {out_path} 생성 완료!")
