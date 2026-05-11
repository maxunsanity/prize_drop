import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V32.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update n-pass-go formula to use tile_go.base_reward instead of the obsolete tile.pass_reward
for node in data['nodes']:
    if node['id'] == 'n-pass-go':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = "tile_go.base_reward * stage.reward_scale * dice_count"

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V33"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V33.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V33 generated successfully with n-pass-go fix.")
