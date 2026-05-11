import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V26.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add rate attributes to node-entity-stage
rate_keys = ["shutdown_hit_rate", "shutdown_blocked_rate", "heist_rate_small", "heist_rate_medium", "heist_rate_large"]
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        for key in rate_keys:
            node['data']['attributes'].append({"key": key, "type": "number", "value": "1"})

# 2. Update n-table-stage data edge mapping
for edge in data['edges']:
    if edge.get('source') == 'n-table-stage':
        mappings = edge['data']['tableEntityAttributeMappings']
        # Add new mappings
        mappings.append({"sourceColumnIndex": 8, "targetKey": "shutdown_hit_rate"})
        mappings.append({"sourceColumnIndex": 9, "targetKey": "shutdown_blocked_rate"})
        mappings.append({"sourceColumnIndex": 10, "targetKey": "heist_rate_small"})
        mappings.append({"sourceColumnIndex": 11, "targetKey": "heist_rate_medium"})
        mappings.append({"sourceColumnIndex": 12, "targetKey": "heist_rate_large"})

# 3. Update Station reward formulas
formula_updates = {
    "n-shutdown-success": "stage.shutdown_base_reward * stage.shutdown_hit_rate * stage.reward_scale * dice_count",
    "n-shutdown-blocked": "stage.shutdown_base_reward * stage.shutdown_blocked_rate * stage.reward_scale * dice_count",
    "n-robbery-small": "stage.heist_reward_small * stage.heist_rate_small * stage.reward_scale * dice_count",
    "n-robbery-medium": "stage.heist_reward_medium * stage.heist_rate_medium * stage.reward_scale * dice_count",
    "n-robbery-large": "stage.heist_reward_large * stage.heist_rate_large * stage.reward_scale * dice_count"
}

for node in data['nodes']:
    if node['id'] in formula_updates:
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = formula_updates[node['id']]

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V27"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V27.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V27 generated successfully.")
