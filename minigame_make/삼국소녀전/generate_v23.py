import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V22.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add community_reward to node-entity-tile
for node in data['nodes']:
    if node['id'] == 'node-entity-tile':
        node['data']['attributes'].append({"key": "community_reward", "type": "number", "value": "0"})
    
    # Remove community_reward_base from stage entity
    if node['id'] == 'node-entity-stage':
        node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] != 'community_reward_base']

# 2. Update n-community-logic formula
for node in data['nodes']:
    if node['id'] == 'n-community-logic':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = "tile.community_reward * stage.reward_scale * dice_count"

# 3. Add data edge for community reward (from Row 35)
data['edges'].append({
    "id": "e-tile-row-35",
    "source": "n-table-tiles",
    "target": "node-entity-tile",
    "type": "data",
    "data": {
        "dataTableRowExpression": "35",
        "tableEntityAttributeMappings": [
            {
                "sourceColumnIndex": 8, # base_reward
                "targetKey": "community_reward"
            }
        ]
    }
})

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V23"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V23.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V23 generated successfully.")
