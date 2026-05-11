import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V28.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Enhance default values in stage entity (Safety Net)
defaults = {
    "reward_scale": "1.0",
    "shutdown_base_reward": "100000",
    "shutdown_hit_rate": "1.0",
    "shutdown_blocked_rate": "0.25",
    "heist_reward_small": "50000",
    "heist_reward_medium": "150000",
    "heist_reward_large": "500000",
    "heist_rate_small": "0.6",
    "heist_rate_medium": "0.3",
    "heist_rate_large": "0.1"
}

for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        for attr in node['data']['attributes']:
            if attr['key'] in defaults:
                attr['value'] = defaults[attr['key']]

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V29"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V29.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V29 generated successfully with safety defaults.")
