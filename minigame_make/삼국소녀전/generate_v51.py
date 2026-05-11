import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V50.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update n-init node to include ALL required variables for gates and formulas
stage_vars = [
    'stage_id', 'current_stage_scale', 'current_stage_shutdown_base_reward', 'current_stage_shutdown_hit_rate', 'current_stage_shutdown_blocked_rate',
    'current_stage_heist_reward_small', 'current_stage_heist_reward_medium', 'current_stage_heist_reward_large',
    'current_stage_heist_rate_small', 'current_stage_heist_rate_medium', 'current_stage_heist_rate_large'
]

for node in data['nodes']:
    if node['id'] == 'n-init':
        attrs = node['data'].get('attributes', [])
        for var in stage_vars:
            if not any(a['key'] == var for a in attrs):
                val = "1" if var == "stage_id" else "1.0" if var == "current_stage_scale" else "0"
                attrs.append({'key': var, 'type': 'number', 'value': val})
        node['data']['attributes'] = attrs

# 2. Re-wire Jail Success routing just in case (redundant from V50)
for edge in data['edges']:
    if edge['source'] == 'n-jail-success' and edge['target'] == 'n-accumulate-tile':
        edge['target'] = 'n-loop-gate'

data['designName'] = "돈_획득_40칸_테이블_연동_V51"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V51.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V51 generated with all stage variables registered in n-init.")
