import json

with open("타이쿤_테이블_트리거_테스트.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Entity 노드 구성 (station_minigame_config 데이터 가상화)
minigame_1 = {
    "id": "node-entity-mg-1",
    "type": "entity",
    "position": {"x": 50, "y": 1050},
    "data": {
        "label": "미니게임 1 (셧다운)",
        "entityKey": "minigame_1",
        "attributes": [{"key": "trigger_weight", "type": "number", "value": "70"}]
    },
    "measured": {"width": 200, "height": 130}
}

minigame_2 = {
    "id": "node-entity-mg-2",
    "type": "entity",
    "position": {"x": 50, "y": 1200},
    "data": {
        "label": "미니게임 2 (은행강탈)",
        "entityKey": "minigame_2",
        "attributes": [{"key": "trigger_weight", "type": "number", "value": "30"}]
    },
    "measured": {"width": 200, "height": 130}
}

data["nodes"].extend([minigame_1, minigame_2])

for n in data["nodes"]:
    if n["id"] == "n-gate-station":
        # 확률 통제 로직을 테이블 연동형 수식으로 대체! (d100 굴림으로 퍼센테이지 구현)
        n["data"]["condition"] = "rand.d100() <= minigame_2.trigger_weight"
        n["data"]["description"] = "테이블 참조 30 vs 70 분기!\nrand.d100() <= minigame_2.trigger_weight (30%)"

data["designName"] = "타이쿤_정거장확률_테스트"

with open("타이쿤_정거장확률_테스트.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: JSON 업데이트 성공!")
