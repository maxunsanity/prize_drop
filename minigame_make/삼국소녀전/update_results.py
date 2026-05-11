import json

with open("타이쿤_정거장확률_테스트.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 결과 5종 Entity 노드 생성 (가상 테이블 데이터)
results_entities = [
    {
        "id": "node-ent-sh-success", "type": "entity", "position": {"x": 50, "y": 1400},
        "data": {
            "label": "결과: 셧다운 성공", "entityKey": "res_success",
            "attributes": [{"key": "weight", "type": "number", "value": "50"}, {"key": "base_point", "type": "number", "value": "4"}]
        },
        "measured": {"width": 200, "height": 160}
    },
    {
        "id": "node-ent-sh-blocked", "type": "entity", "position": {"x": -150, "y": 1400},
        "data": {
            "label": "결과: 셧다운 막힘", "entityKey": "res_blocked",
            "attributes": [{"key": "weight", "type": "number", "value": "50"}, {"key": "base_point", "type": "number", "value": "2"}]
        },
        "measured": {"width": 200, "height": 160}
    },
    {
        "id": "node-ent-bh-small", "type": "entity", "position": {"x": 400, "y": 1400},
        "data": {
            "label": "결과: 강탈 작음", "entityKey": "res_small",
            "attributes": [{"key": "weight", "type": "number", "value": "33"}, {"key": "base_point", "type": "number", "value": "2"}]
        },
        "measured": {"width": 200, "height": 160}
    },
    {
        "id": "node-ent-bh-medium", "type": "entity", "position": {"x": 670, "y": 1400},
        "data": {
            "label": "결과: 강탈 중간", "entityKey": "res_medium",
            "attributes": [{"key": "weight", "type": "number", "value": "34"}, {"key": "base_point", "type": "number", "value": "4"}]
        },
        "measured": {"width": 200, "height": 160}
    },
    {
        "id": "node-ent-bh-large", "type": "entity", "position": {"x": 920, "y": 1400},
        "data": {
            "label": "결과: 강탈 큼", "entityKey": "res_large",
            "attributes": [{"key": "weight", "type": "number", "value": "33"}, {"key": "base_point", "type": "number", "value": "6"}]
        },
        "measured": {"width": 200, "height": 160}
    }
]

data["nodes"].extend(results_entities)

# 게이트와 트리거 수정
for n in data["nodes"]:
    # 1. 셧다운 게이트
    if n["id"] == "n-gate-shutdown":
        n["data"]["condition"] = "rand.d100() <= res_success.weight"
        n["data"]["description"] = "테이블 참조: 50%"
    
    # 2. 은행강탈 게이트 1 (작음)
    elif n["id"] == "n-gate-bank1":
        n["data"]["condition"] = "rand.d100() <= res_small.weight"
        n["data"]["description"] = "테이블 참조: 33%"
        
    # 3. 은행강탈 게이트 2 (중간/큼)
    elif n["id"] == "n-gate-bank2":
        # 남은 확률 계산: res_medium / (res_medium + res_large)
        n["data"]["condition"] = "rand.d100() <= (res_medium.weight / (res_medium.weight + res_large.weight)) * 100"
        n["data"]["description"] = "테이블 참조 동적 굴림\n남은 풀에서 중간강탈 비율"
    
    # ----- 트리거 (수치) 수정 -----
    elif n["id"] == "n-trig-success":
        n["data"]["attributes"][0]["value"] = "res_success.base_point * dice_count"
        n["data"]["description"] = "테이블 보상 참조!"
    elif n["id"] == "n-trig-blocked":
        n["data"]["attributes"][0]["value"] = "res_blocked.base_point * dice_count"
        n["data"]["description"] = "테이블 보상 참조!"
    elif n["id"] == "n-trig-small":
        n["data"]["attributes"][0]["value"] = "res_small.base_point * dice_count"
        n["data"]["description"] = "테이블 보상 참조!"
    elif n["id"] == "n-trig-big":  # 중간 강탈
        n["data"]["attributes"][0]["value"] = "res_medium.base_point * dice_count"
        n["data"]["description"] = "테이블 보상 참조!"
    elif n["id"] == "n-trig-huge": # 큰 강탈
        n["data"]["attributes"][0]["value"] = "res_large.base_point * dice_count"
        n["data"]["description"] = "테이블 보상 참조!"

data["designName"] = "타이쿤_풀연동_테스트"

with open("타이쿤_풀연동_테스트.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: JSON 업데이트 성공!")
