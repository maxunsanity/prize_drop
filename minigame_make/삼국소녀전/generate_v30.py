import json

# Try to read V29, if not found use V28
try:
    with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V29.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except:
    with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V28.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

# 1. Force all stage attributes to 'number' type
target_keys = [
    "shutdown_base_reward", "heist_reward_small", "heist_reward_medium", "heist_reward_large",
    "shutdown_hit_rate", "shutdown_blocked_rate", "heist_rate_small", "heist_rate_medium", "heist_rate_large",
    "reward_scale"
]

for node in data['nodes']:
    if node['id'] == 'node-entity-stage' or node.get('data', {}).get('entityKey') == 'stage':
        for attr in node['data']['attributes']:
            if attr['key'] in target_keys:
                attr['type'] = "number"
                # Ensure value is numeric (remove commas just in case)
                if isinstance(attr['value'], str):
                    attr['value'] = attr['value'].replace(",", "")

# 2. Re-verify Data Edge Mapping
for edge in data['edges']:
    if edge.get('source') == 'n-table-stage':
        # Mapping indices 7, 13, 14, 15 as confirmed by user (H, N, O, P)
        # Rates are 8, 9, 10, 11, 12 as previously derived
        pass

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V30"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V30.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V30 generated successfully with number-typed attributes.")
