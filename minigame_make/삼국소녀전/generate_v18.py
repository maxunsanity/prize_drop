import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V17.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add attributes to node-entity-stage
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        stage_rewards = [
            {"key": "land_reward_1", "type": "number", "value": "50"},
            {"key": "land_reward_2", "type": "number", "value": "80"},
            {"key": "land_reward_3", "type": "number", "value": "110"},
            {"key": "land_reward_4", "type": "number", "value": "140"},
            {"key": "land_reward_5", "type": "number", "value": "170"},
            {"key": "land_reward_6", "type": "number", "value": "200"},
            {"key": "land_reward_7", "type": "number", "value": "230"},
            {"key": "land_reward_8", "type": "number", "value": "260"}
        ]
        node['data']['attributes'].extend(stage_rewards)

# 2. Update formulas in triggers
trigger_map = {
    'n-land-s1': 'stage.land_reward_1',
    'n-land-s2': 'stage.land_reward_2',
    'n-land-s3': 'stage.land_reward_3',
    'n-land-s4': 'stage.land_reward_4',
    'n-land-s5': 'stage.land_reward_5',
    'n-land-s6': 'stage.land_reward_6',
    'n-land-s7': 'stage.land_reward_7',
    'n-land-s8': 'stage.land_reward_8'
}

for node in data['nodes']:
    if node['id'] in trigger_map:
        reward_key = trigger_map[node['id']]
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = f"{reward_key} * stage.reward_scale * dice_count"

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V18"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V18.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V18 generated successfully.")
