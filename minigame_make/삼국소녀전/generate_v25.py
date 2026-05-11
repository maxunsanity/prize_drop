import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V24.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Correct data edge rows for base_rewards
row_mappings = {
    "e-tile-row-3": "3",   # S1
    "e-tile-row-8": "8",   # S2
    "e-tile-row-13": "14", # S3 (Changed from 13 to 14)
    "e-tile-row-18": "19", # S4 (Changed from 18 to 19)
    "e-tile-row-23": "24", # S5 (Changed from 23 to 24)
    "e-tile-row-28": "29", # S6 (Changed from 28 to 29)
    "e-tile-row-33": "34", # S7 (Changed from 33 to 34)
    "e-tile-row-39": "40", # S8 (Changed from 39 to 40)
    "e-tile-row-2": "2",   # GO
    "e-tile-row-12": "13", # Visit (Changed from 12 to 13)
    "e-tile-row-22": "23", # Park (Changed from 22 to 23)
    "e-tile-row-14": "15", # Utility 1 (Changed from 14 to 15)
    "e-tile-row-30": "31", # Utility 2 (Changed from 30 to 31)
    "e-tile-row-35": "36"  # Community (Changed from 35 to 36)
}

for edge in data['edges']:
    if edge['id'] in row_mappings:
        edge['data']['dataTableRowExpression'] = row_mappings[edge['id']]

# 2. Correct Gate Conditions
gate_conditions = {
    "n-land-s1-gate": "pos == 1 || pos == 3",
    "n-land-s2-gate": "pos == 6 || pos == 8 || pos == 9 || pos == 10",
    "n-land-s3-gate": "pos == 12 || pos == 14 || pos == 15",
    "n-land-s4-gate": "pos == 17 || pos == 19 || pos == 20",
    "n-land-s5-gate": "pos == 22 || pos == 24 || pos == 25",
    "n-land-s6-gate": "pos == 27 || pos == 28 || pos == 30",
    "n-land-s7-gate": "pos == 32 || pos == 33 || pos == 35",
    "n-land-s8-gate": "pos == 38",
    "n-station-gate": "pos == 5 || pos == 16 || pos == 26 || pos == 36",
    "n-tax-gate": "pos == 4 || pos == 39",
    "n-chance-gate": "pos == 7 || pos == 23 || pos == 37",
    "n-community-gate": "pos == 2 || pos == 18 || pos == 34",
    "n-jail-gate": "pos == 31",
    "n-utility-gate": "pos == 13 || pos == 29",
    "n-corner-gate": "pos == 11 || pos == 21",
    "n-go-gate": "pos == 0"
}

for node in data['nodes']:
    if node['id'] in gate_conditions:
        node['data']['condition'] = gate_conditions[node['id']]

# 3. Split Ternary Logic for Utility and Corner (Avoid errors)
for node in data['nodes']:
    if node['id'] == 'n-utility-logic':
        node['data']['label'] = "전력 공사 보상"
        node['data']['attributes'][0]['value'] = "tile.utility_reward_1 * stage.reward_scale * dice_count"
        # We will split utility into two gates in the next step
    if node['id'] == 'n-corner-logic':
        node['data']['label'] = "일반방문 보상"
        node['data']['attributes'][0]['value'] = "tile.visit_reward * stage.reward_scale * dice_count"

# Add the 2nd utility and corner logic nodes
extra_nodes = [
    {
      "id": "n-utility-logic-2",
      "type": "trigger",
      "position": {"x": 1200, "y": 3450},
      "data": {"label": "수자원 공사 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "tile.utility_reward_2 * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-corner-logic-2",
      "type": "trigger",
      "position": {"x": 1200, "y": 3600},
      "data": {"label": "주차장 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "tile.park_reward * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-utility-split-gate",
      "type": "gate",
      "position": {"x": 1000, "y": 3400},
      "data": {"label": "어느 공사?", "condition": "pos == 13", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-corner-split-gate",
      "type": "gate",
      "position": {"x": 1000, "y": 3550},
      "data": {"label": "어느 모서리?", "condition": "pos == 11", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    }
]
data['nodes'].extend(extra_nodes)

# Fix edges for the new split gates
data['edges'] = [e for e in data['edges'] if e['source'] not in ['n-utility-gate', 'n-corner-gate']]

new_edges = [
    # Utility Split
    {"id": "e-util-gate-true", "source": "n-utility-gate", "target": "n-utility-split-gate", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-util-gate-false", "source": "n-utility-gate", "target": "n-corner-gate", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-util-split-true", "source": "n-utility-split-gate", "target": "n-utility-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-util-split-false", "source": "n-utility-split-gate", "target": "n-utility-logic-2", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-util-logic-2-out", "source": "n-utility-logic-2", "target": "n-accumulate-tile", "type": "exec"},

    # Corner Split
    {"id": "e-corn-gate-true", "source": "n-corner-gate", "target": "n-corner-split-gate", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-corn-gate-false", "source": "n-corner-gate", "target": "n-go-gate", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-corn-split-true", "source": "n-corner-split-gate", "target": "n-corner-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-corn-split-false", "source": "n-corner-split-gate", "target": "n-corner-logic-2", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-corn-logic-2-out", "source": "n-corner-logic-2", "target": "n-accumulate-tile", "type": "exec"}
]
data['edges'].extend(new_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V25"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V25.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V25 generated successfully.")
