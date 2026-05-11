import json

try:
    with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V30.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except:
    with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V29.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

# 1. Remove old single tile entity and its edges
data['nodes'] = [n for n in data['nodes'] if n['id'] != 'node-entity-tile']
data['edges'] = [e for e in data['edges'] if e.get('target') != 'node-entity-tile']

# 2. Define the 15 new entities and their rows
tile_entities = [
    {"key": "tile_s1", "row": "3"},
    {"key": "tile_s2", "row": "8"},
    {"key": "tile_s3", "row": "14"},
    {"key": "tile_s4", "row": "19"},
    {"key": "tile_s5", "row": "24"},
    {"key": "tile_s6", "row": "29"},
    {"key": "tile_s7", "row": "34"},
    {"key": "tile_s8", "row": "40"},
    {"key": "tile_go", "row": "2"},
    {"key": "tile_visit", "row": "13"},
    {"key": "tile_park", "row": "23"},
    {"key": "tile_util_1", "row": "15"},
    {"key": "tile_util_2", "row": "31"},
    {"key": "tile_community", "row": "36"},
    {"key": "tile_chance", "row": "38"}
]

# 3. Add the 15 entity nodes and 15 data edges
new_nodes = []
new_edges = []
x_offset = 2500
y_offset = -800

for i, t in enumerate(tile_entities):
    node_id = f"n-entity-{t['key']}"
    
    # Entity Node
    new_nodes.append({
      "id": node_id,
      "type": "entity",
      "position": {"x": x_offset, "y": y_offset + (i * 150)},
      "data": {
        "label": f"타일 엔티티 ({t['key']})",
        "entityKey": t['key'],
        "attributes": [{"key": "base_reward", "type": "number", "value": "0"}],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0,
        "intensity": 0,
        "measured": {"width": 200, "height": 100},
        "description": f"{t['key']} 보상"
      }
    })
    
    # Data Edge
    new_edges.append({
      "id": f"e-data-{t['key']}",
      "source": "n-table-tiles",
      "target": node_id,
      "type": "data",
      "data": {
        "dataTableRowExpression": t['row'],
        "tableEntityAttributeMappings": [
          {
            "sourceColumnIndex": 8, # base_reward column
            "targetKey": "base_reward"
          }
        ]
      }
    })

data['nodes'].extend(new_nodes)
data['edges'].extend(new_edges)

# 4. Update Formulas in logic nodes
formula_replacements = {
    "n-land-s1-logic": "tile_s1.base_reward * stage.reward_scale * dice_count",
    "n-land-s2-logic": "tile_s2.base_reward * stage.reward_scale * dice_count",
    "n-land-s3-logic": "tile_s3.base_reward * stage.reward_scale * dice_count",
    "n-land-s4-logic": "tile_s4.base_reward * stage.reward_scale * dice_count",
    "n-land-s5-logic": "tile_s5.base_reward * stage.reward_scale * dice_count",
    "n-land-s6-logic": "tile_s6.base_reward * stage.reward_scale * dice_count",
    "n-land-s7-logic": "tile_s7.base_reward * stage.reward_scale * dice_count",
    "n-land-s8-logic": "tile_s8.base_reward * stage.reward_scale * dice_count",
    "n-go-logic": "tile_go.base_reward * stage.reward_scale * dice_count",
    "n-corner-logic": "tile_visit.base_reward * stage.reward_scale * dice_count",
    "n-corner-logic-2": "tile_park.base_reward * stage.reward_scale * dice_count",
    "n-utility-logic": "tile_util_1.base_reward * stage.reward_scale * dice_count",
    "n-utility-logic-2": "tile_util_2.base_reward * stage.reward_scale * dice_count",
    "n-community-logic": "tile_community.base_reward * stage.reward_scale * dice_count",
    "n-chance-money-logic": "tile_chance.base_reward * stage.reward_scale * dice_count"
}

for node in data['nodes']:
    if node['id'] in formula_replacements:
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = formula_replacements[node['id']]

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V31"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V31.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V31 generated successfully.")
