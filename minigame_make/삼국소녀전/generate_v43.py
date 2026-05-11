import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V42.json', 'r', encoding='utf-8') as f:
    json_str = f.read()

# 1. Global Replace: stage. -> current_stage_
# This handles shutdown_base_reward, heist_reward_small, etc.
json_str = json_str.replace('stage.reward_scale', 'current_stage_scale')
json_str = json_str.replace('stage.shutdown_base_reward', 'current_stage_shutdown_base_reward')
json_str = json_str.replace('stage.shutdown_hit_rate', 'current_stage_shutdown_hit_rate')
json_str = json_str.replace('stage.shutdown_blocked_rate', 'current_stage_shutdown_blocked_rate')
json_str = json_str.replace('stage.heist_reward_small', 'current_stage_heist_reward_small')
json_str = json_str.replace('stage.heist_reward_medium', 'current_stage_heist_reward_medium')
json_str = json_str.replace('stage.heist_reward_large', 'current_stage_heist_reward_large')
json_str = json_str.replace('stage.heist_rate_small', 'current_stage_heist_rate_small')
json_str = json_str.replace('stage.heist_rate_medium', 'current_stage_heist_rate_medium')
json_str = json_str.replace('stage.heist_rate_large', 'current_stage_heist_rate_large')

data = json.loads(json_str)

# 2. Add these variables to global attributes
stage_vars = [
    'current_stage_shutdown_base_reward', 'current_stage_shutdown_hit_rate', 'current_stage_shutdown_blocked_rate',
    'current_stage_heist_reward_small', 'current_stage_heist_reward_medium', 'current_stage_heist_reward_large',
    'current_stage_heist_rate_small', 'current_stage_heist_rate_medium', 'current_stage_heist_rate_large'
]

if 'attributes' not in data: data['attributes'] = []
for var in stage_vars:
    # Only add if not exists
    if not any(a['key'] == var for a in data['attributes']):
        data['attributes'].append({'key': var, 'type': 'number', 'value': '0'})

# 3. Update Sync Logic in n-stage-sync-i nodes
# Every n-stage-sync-i node needs to copy ALL attributes
for node in data['nodes']:
    if 'n-stage-sync-' in node['id']:
        idx = node['id'].replace('n-stage-sync-', '')
        entity_id = f"stage_e{idx}"
        node['data']['attributes'] = [
            {"key": "current_stage_scale", "value": f"{entity_id}.reward_scale"},
            {"key": "current_stage_shutdown_base_reward", "value": f"{entity_id}.shutdown_base_reward"},
            {"key": "current_stage_shutdown_hit_rate", "value": f"{entity_id}.shutdown_hit_rate"},
            {"key": "current_stage_shutdown_blocked_rate", "value": f"{entity_id}.shutdown_blocked_rate"},
            {"key": "current_stage_heist_reward_small", "value": f"{entity_id}.heist_reward_small"},
            {"key": "current_stage_heist_reward_medium", "value": f"{entity_id}.heist_reward_medium"},
            {"key": "current_stage_heist_reward_large", "value": f"{entity_id}.heist_reward_large"},
            {"key": "current_stage_heist_rate_small", "value": f"{entity_id}.heist_rate_small"},
            {"key": "current_stage_heist_rate_medium", "value": f"{entity_id}.heist_rate_medium"},
            {"key": "current_stage_heist_rate_large", "value": f"{entity_id}.heist_rate_large"}
        ]

# 4. Update Data Edges for Stage entities to map ALL attributes
for i in range(1, 11):
    entity_id = f"stage_e{i}"
    edge_id = f"e-stage-data-{i}"
    for edge in data['edges']:
        if edge['id'] == edge_id:
            edge['data']['tableEntityAttributeMappings'] = [
                {"sourceKey": "reward_scale", "targetKey": f"{entity_id}.reward_scale"},
                {"sourceKey": "shutdown_base_reward", "targetKey": f"{entity_id}.shutdown_base_reward"},
                {"sourceKey": "shutdown_hit_rate", "targetKey": f"{entity_id}.shutdown_hit_rate"},
                {"sourceKey": "shutdown_blocked_rate", "targetKey": f"{entity_id}.shutdown_blocked_rate"},
                {"sourceKey": "heist_reward_small", "targetKey": f"{entity_id}.heist_reward_small"},
                {"sourceKey": "heist_reward_medium", "targetKey": f"{entity_id}.heist_reward_medium"},
                {"sourceKey": "heist_reward_large", "targetKey": f"{entity_id}.heist_reward_large"},
                {"sourceKey": "heist_rate_small", "targetKey": f"{entity_id}.heist_rate_small"},
                {"sourceKey": "heist_rate_medium", "targetKey": f"{entity_id}.heist_rate_medium"},
                {"sourceKey": "heist_rate_large", "targetKey": f"{entity_id}.heist_rate_large"}
            ]

data['designName'] = "돈_획득_40칸_테이블_연동_V43"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V43.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V43 generated with full stage variable migration.")
