import json

with open("타이쿤_이벤트_테스트_v1.json", "r", encoding="utf-8") as f:
    data = json.load(f)

new_entity_node = {
    "id": "node-entity-event-99999",
    "type": "entity",
    "position": {
        "x": -600,
        "y": 50
    },
    "data": {
        "label": "이벤트 99999 데이터",
        "description": "event_board_config 참조용",
        "entityKey": "event_99999",
        "attributes": [
            {"key": "group_size", "type": "number", "value": "35"},
            {"key": "init_dice", "type": "number", "value": "50"},
            {"key": "dice_multiplier", "type": "number", "value": "10"}
        ]
    },
    "measured": {
        "width": 220,
        "height": 200
    }
}

data["nodes"].append(new_entity_node)

for n in data["nodes"]:
    if n["id"] == "n-init":
        # 쌩숫자 입력값을 엔티티 참조형으로 교체!
        for attr in n["data"]["attributes"]:
            if attr["key"] == "dice":
                attr["value"] = "event_99999.init_dice"
            elif attr["key"] == "dice_count":
                attr["value"] = "event_99999.dice_multiplier"
            elif attr["key"] == "rank":
                # rank도 개체나 랜덤 등을 섞어 초기화 가능하지만 일단 테스트용으로 수식 적용
                attr["value"] = "rand.d10() + 5" 
        
        n["data"]["description"] = "★ 트리거에 테이블 엔티티 값 참조 적용 완료!\ndice = event_99999.init_dice"

data["designName"] = "타이쿤_테이블_트리거_테스트"

with open("타이쿤_테이블_트리거_테스트.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: 타이쿤_테이블_트리거_테스트.json 생성 완료!")
