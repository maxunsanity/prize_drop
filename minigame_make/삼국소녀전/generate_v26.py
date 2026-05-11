import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V25.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add Dice Resource Node
dice_res_node = {
  "id": "n-dice-res",
  "type": "resource",
  "position": {"x": 100, "y": -200},
  "data": {
    "label": "주사위",
    "resourceKey": "dice",
    "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
    "frictionScore": 0,
    "intensity": 0,
    "measured": {"width": 100, "height": 100},
    "description": "남은 주사위 개수"
  }
}
data['nodes'].append(dice_res_node)

# 2. Add Resource Edges to sync dice variable to the UI
new_res_edges = [
    {
      "id": "e-dice-init-res",
      "source": "n-init",
      "target": "n-dice-res",
      "type": "resource",
      "data": {
        "resourceEdgeMappings": [{"sourceKey": "dice", "targetKey": "amount"}]
      }
    },
    {
      "id": "e-dice-accumulate-res",
      "source": "n-accumulate-tile",
      "target": "n-dice-res",
      "type": "resource",
      "data": {
        "resourceEdgeMappings": [{"sourceKey": "dice", "targetKey": "amount"}]
      }
    }
]
data['edges'].extend(new_res_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V26"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V26.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V26 generated successfully.")
