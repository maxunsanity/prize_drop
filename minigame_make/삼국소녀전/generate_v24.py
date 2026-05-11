import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V23.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add chance_reward to node-entity-tile
for node in data['nodes']:
    if node['id'] == 'node-entity-tile':
        node['data']['attributes'].append({"key": "chance_reward", "type": "number", "value": "0"})
    
    # Remove chance_money_base from stage entity
    if node['id'] == 'node-entity-stage':
        node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] != 'chance_money_base']

# 2. Update n-chance-money-logic formula
for node in data['nodes']:
    if node['id'] == 'n-chance-money-logic':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = "tile.chance_reward * stage.reward_scale * dice_count"

# 3. Add data edge for chance reward (from Row 38)
data['edges'].append({
    "id": "e-tile-row-38",
    "source": "n-table-tiles",
    "target": "node-entity-tile",
    "type": "data",
    "data": {
        "dataTableRowExpression": "38",
        "tableEntityAttributeMappings": [
            {
                "sourceColumnIndex": 8, # base_reward
                "targetKey": "chance_reward"
            }
        ]
    }
})

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V24"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V24.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V24 generated successfully.")
