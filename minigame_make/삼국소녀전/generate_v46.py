import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V45.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Clean up the 10 stage entities and temporary variables
data['nodes'] = [n for n in data['nodes'] if not n['id'].startswith('stage_e')]
data['edges'] = [e for e in data['edges'] if not e.get('target', '').startswith('stage_e') and not e.get('source', '').startswith('stage_e')]

# 2. Restore the original single stage entity
data['nodes'].append({
    "id": "node-entity-stage",
    "type": "entity",
    "position": {"x": -500, "y": 100},
    "data": {
        "label": "스테이지 정보",
        "attributes": [
            {"key": "reward_scale", "type": "number", "value": "1.0"},
            {"key": "shutdown_base_reward", "type": "number", "value": "100000"}
        ]
    }
})

# 3. Simplify Stage Selector Logic to a single node using table.load
# First, remove the 10 selector gates/logic nodes
selector_node_ids = [n['id'] for n in data['nodes'] if 'n-stage-' in n['id']]
data['nodes'] = [n for n in data['nodes'] if n['id'] not in selector_node_ids]
data['edges'] = [e for e in data['edges'] if e['source'] not in selector_node_ids and e['target'] not in selector_node_ids]

# Create one single Stage Loader node
data['nodes'].append({
    "id": "n-stage-loader",
    "type": "trigger",
    "position": {"x": 300, "y": -500},
    "data": {
        "label": "스테이지 로드",
        "attributes": [
            # The magic LLE command: table.load(entityId, tableId, rowIndex)
            {"key": "dummy", "value": "table.load('node-entity-stage', 'n-table-stage', stage_id + 1)"}
        ]
    }
})

# Re-wire n-roll to n-stage-loader, and n-stage-loader to n-move-logic
for edge in data['edges']:
    if edge['source'] == 'n-roll':
        edge['target'] = 'n-stage-loader'

data['edges'].append({
    "id": "e-stage-loader-out",
    "source": "n-stage-loader",
    "target": "n-move-logic",
    "type": "exec"
})

# 4. Global Revert: current_stage_ -> stage.
json_str = json.dumps(data, ensure_ascii=False)
json_str = json_str.replace('current_stage_scale', 'stage.reward_scale')
json_str = json_str.replace('current_stage_shutdown_base_reward', 'stage.shutdown_base_reward')
json_str = json_str.replace('current_stage_shutdown_hit_rate', 'stage.shutdown_hit_rate')
json_str = json_str.replace('current_stage_shutdown_blocked_rate', 'stage.shutdown_blocked_rate')
json_str = json_str.replace('current_stage_heist_reward_small', 'stage.heist_reward_small')
json_str = json_str.replace('current_stage_heist_reward_medium', 'stage.heist_reward_medium')
json_str = json_str.replace('current_stage_heist_reward_large', 'stage.heist_reward_large')
json_str = json_str.replace('current_stage_heist_rate_small', 'stage.heist_rate_small')
json_str = json_str.replace('current_stage_heist_rate_medium', 'stage.heist_rate_medium')
json_str = json_str.replace('current_stage_heist_rate_large', 'stage.heist_rate_large')

data = json.loads(json_str)

# Remove the temporary global attributes we added
stage_vars = [
    'current_stage_scale', 'current_stage_shutdown_base_reward', 'current_stage_shutdown_hit_rate', 'current_stage_shutdown_blocked_rate',
    'current_stage_heist_reward_small', 'current_stage_heist_reward_medium', 'current_stage_heist_reward_large',
    'current_stage_heist_rate_small', 'current_stage_heist_rate_medium', 'current_stage_heist_rate_large'
]
if 'attributes' in data:
    data['attributes'] = [a for a in data['attributes'] if a['key'] not in stage_vars]

# Update initialization node to remove temp vars but keep stage_id
for node in data['nodes']:
    if node['id'] == 'n-init':
        node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] not in stage_vars]

data['designName'] = "돈_획득_40칸_테이블_연동_V46"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V46.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V46 generated with original stage entity and dynamic table.load.")
