import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V21.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add new attributes to node-entity-tile
new_tile_keys = ["go_reward", "visit_reward", "park_reward", "utility_reward_1", "utility_reward_2"]
for node in data['nodes']:
    if node['id'] == 'node-entity-tile':
        for key in new_tile_keys:
            node['data']['attributes'].append({"key": key, "type": "number", "value": "0"})

# 2. Add 5 new data edges for these specific tiles
data_mappings = [
    {"row": "2", "key": "go_reward"},
    {"row": "12", "key": "visit_reward"},
    {"row": "22", "key": "park_reward"},
    {"row": "14", "key": "utility_reward_1"},
    {"row": "30", "key": "utility_reward_2"}
]

for mapping in data_mappings:
    data['edges'].append({
        "id": f"e-tile-row-{mapping['row']}",
        "source": "n-table-tiles",
        "target": "node-entity-tile",
        "type": "data",
        "data": {
            "dataTableRowExpression": mapping['row'],
            "tableEntityAttributeMappings": [
                {
                    "sourceColumnIndex": 8, # base_reward column
                    "targetKey": mapping['key']
                }
            ]
        }
    })

# 3. Create new logic nodes
new_nodes = [
    {
      "id": "n-utility-gate",
      "type": "gate",
      "position": {"x": 800, "y": 3400},
      "data": {"label": "공공시설?", "condition": "pos == 12 || pos == 28", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-utility-logic",
      "type": "trigger",
      "position": {"x": 1000, "y": 3400},
      "data": {"label": "공공시설 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "((pos == 12) ? tile.utility_reward_1 : tile.utility_reward_2) * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-corner-gate",
      "type": "gate",
      "position": {"x": 800, "y": 3550},
      "data": {"label": "구석 타일?", "condition": "pos == 10 || pos == 20", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-corner-logic",
      "type": "trigger",
      "position": {"x": 1000, "y": 3550},
      "data": {"label": "구석 타일 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "((pos == 10) ? tile.visit_reward : tile.park_reward) * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-go-gate",
      "type": "gate",
      "position": {"x": 800, "y": 3700},
      "data": {"label": "시작칸(GO)?", "condition": "pos == 0", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-go-logic",
      "type": "trigger",
      "position": {"x": 1000, "y": 3700},
      "data": {"label": "시작칸 도착 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "tile.go_reward * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    }
]
data['nodes'].extend(new_nodes)

# 4. Redirect n-jail-retry-check FALSE edge to n-utility-gate
for edge in data['edges']:
    if edge.get('source') == 'n-jail-retry-check' and edge.get('data', {}).get('gateBranch') == 'false':
        edge['target'] = 'n-utility-gate'

# Redirect n-jail-gate FALSE edge to n-utility-gate (if they skipped jail check)
for edge in data['edges']:
    if edge.get('source') == 'n-jail-gate' and edge.get('data', {}).get('gateBranch') == 'false':
        edge['target'] = 'n-utility-gate'

# 5. Create new edges
new_edges = [
    {"id": "e-util-gate-true", "source": "n-utility-gate", "target": "n-utility-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-util-gate-false", "source": "n-utility-gate", "target": "n-corner-gate", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-util-logic-out", "source": "n-utility-logic", "target": "n-accumulate-tile", "type": "exec"},
    
    {"id": "e-corn-gate-true", "source": "n-corner-gate", "target": "n-corner-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-corn-gate-false", "source": "n-corner-gate", "target": "n-go-gate", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-corn-logic-out", "source": "n-corner-logic", "target": "n-accumulate-tile", "type": "exec"},
    
    {"id": "e-go-gate-true", "source": "n-go-gate", "target": "n-go-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-go-gate-false", "source": "n-go-gate", "target": "n-accumulate-tile", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-go-logic-out", "source": "n-go-logic", "target": "n-accumulate-tile", "type": "exec"}
]
data['edges'].extend(new_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V22"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V22.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V22 generated successfully.")
