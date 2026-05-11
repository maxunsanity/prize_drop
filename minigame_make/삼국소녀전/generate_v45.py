import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V44.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update n-init node to include stage_id and current_stage variables
for node in data['nodes']:
    if node['id'] == 'n-init':
        attrs = node['data'].get('attributes', [])
        # Add stage_id
        if not any(a['key'] == 'stage_id' for a in attrs):
            attrs.append({'key': 'stage_id', 'type': 'number', 'value': '1'})
        # Add current_stage_scale
        if not any(a['key'] == 'current_stage_scale' for a in attrs):
            attrs.append({'key': 'current_stage_scale', 'type': 'number', 'value': '1.0'})
        
        # Add all other current_stage_... variables to ensure they are defined
        stage_vars = [
            'current_stage_shutdown_base_reward', 'current_stage_shutdown_hit_rate', 'current_stage_shutdown_blocked_rate',
            'current_stage_heist_reward_small', 'current_stage_heist_reward_medium', 'current_stage_heist_reward_large',
            'current_stage_heist_rate_small', 'current_stage_heist_rate_medium', 'current_stage_heist_rate_large'
        ]
        for var in stage_vars:
            if not any(a['key'] == var for a in attrs):
                attrs.append({'key': var, 'type': 'number', 'value': '0'})
        
        node['data']['attributes'] = attrs

data['designName'] = "돈_획득_40칸_테이블_연동_V45"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V45.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V45 generated with stage variables initialized in n-init node.")
