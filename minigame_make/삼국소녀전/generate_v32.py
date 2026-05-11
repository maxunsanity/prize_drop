import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V31.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update Formulas in logic nodes with the correct node IDs
formula_replacements = {
    "n-land-s1": "tile_s1.base_reward * stage.reward_scale * dice_count",
    "n-land-s2": "tile_s2.base_reward * stage.reward_scale * dice_count",
    "n-land-s3": "tile_s3.base_reward * stage.reward_scale * dice_count",
    "n-land-s4": "tile_s4.base_reward * stage.reward_scale * dice_count",
    "n-land-s5": "tile_s5.base_reward * stage.reward_scale * dice_count",
    "n-land-s6": "tile_s6.base_reward * stage.reward_scale * dice_count",
    "n-land-s7": "tile_s7.base_reward * stage.reward_scale * dice_count",
    "n-land-s8": "tile_s8.base_reward * stage.reward_scale * dice_count"
}

for node in data['nodes']:
    if node['id'] in formula_replacements:
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = formula_replacements[node['id']]

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V32"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V32.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V32 generated successfully with correct formula updates.")
