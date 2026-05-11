import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V20.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

land_keys = ["land_reward_1", "land_reward_2", "land_reward_3", "land_reward_4", "land_reward_5", "land_reward_6", "land_reward_7", "land_reward_8"]

# 1. Move keys to tile entity
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] not in land_keys]
    
    if node['id'] == 'node-entity-tile':
        for key in land_keys:
            node['data']['attributes'].append({"key": key, "type": "number", "value": "0"})

# 2. Update formulas in land triggers
for node in data['nodes']:
    if node['id'].startswith('n-land-s') and node['type'] == 'trigger':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = attr['value'].replace('stage.land_reward_', 'tile.land_reward_')

# 3. Handle data edges
data['edges'] = [e for e in data['edges'] if not (e.get('source') == 'n-table-tiles' and e.get('target') == 'node-entity-tile')]

# Rows: Stage 1 (row 3), Stage 2 (row 8), Stage 3 (row 13), etc.
rows = ["3", "8", "13", "18", "23", "28", "33", "39"]
for i, row_expr in enumerate(rows):
    data['edges'].append({
        "id": f"e-tile-row-{row_expr}",
        "source": "n-table-tiles",
        "target": "node-entity-tile",
        "type": "data",
        "data": {
            "dataTableRowExpression": row_expr,
            "tableEntityAttributeMappings": [
                {
                    "sourceColumnIndex": 8, # base_reward column index 8 is correct for board_tile_config.csv
                    "targetKey": f"land_reward_{i+1}"
                }
            ]
        }
    })

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V21"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V21.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V21 generated successfully.")
