import json

# Start from clean V41
with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V41.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Clean up the single stage entity and its edges
data['nodes'] = [n for n in data['nodes'] if n['id'] != 'node-entity-stage']
data['edges'] = [e for e in data['edges'] if e.get('target') != 'node-entity-stage' and e.get('source') != 'node-entity-stage']

# 2. Add 10 properly prefixed Stage Entities and Data Edges
new_nodes = []
new_edges = []
for i in range(1, 11):
    entity_id = f"node-entity-stage_{i}"
    new_nodes.append({
        "id": entity_id,
        "type": "entity",
        "position": {"x": -600, "y": 50 * i},
        "data": {
            "label": f"스테이지 {i} 정보",
            "attributes": [
                {"key": "reward_scale", "type": "number", "value": "1.0"},
                {"key": "shutdown_base_reward", "type": "number", "value": "100000"},
                {"key": "shutdown_hit_rate", "type": "number", "value": "1.0"},
                {"key": "shutdown_blocked_rate", "type": "number", "value": "0.25"},
                {"key": "heist_reward_small", "type": "number", "value": "50000"},
                {"key": "heist_reward_medium", "type": "number", "value": "150000"},
                {"key": "heist_reward_large", "type": "number", "value": "500000"},
                {"key": "heist_rate_small", "type": "number", "value": "0.6"},
                {"key": "heist_rate_medium", "type": "number", "value": "0.3"},
                {"key": "heist_rate_large", "type": "number", "value": "0.1"}
            ]
        }
    })
    new_edges.append({
        "id": f"e-stage-data-{i}",
        "source": "n-table-stage",
        "target": entity_id,
        "type": "data",
        "data": {
            "dataTableRowExpression": str(i + 1),
            "tableEntityAttributeMappings": [
                {"sourceKey": "reward_scale", "targetKey": "reward_scale"},
                {"sourceKey": "shutdown_base_reward", "targetKey": "shutdown_base_reward"},
                {"sourceKey": "shutdown_hit_rate", "targetKey": "shutdown_hit_rate"},
                {"sourceKey": "shutdown_blocked_rate", "targetKey": "shutdown_blocked_rate"},
                {"sourceKey": "heist_reward_small", "targetKey": "heist_reward_small"},
                {"sourceKey": "heist_reward_medium", "targetKey": "heist_reward_medium"},
                {"sourceKey": "heist_reward_large", "targetKey": "heist_reward_large"},
                {"sourceKey": "heist_rate_small", "targetKey": "heist_rate_small"},
                {"sourceKey": "heist_rate_medium", "targetKey": "heist_rate_medium"},
                {"sourceKey": "heist_rate_large", "targetKey": "heist_rate_large"}
            ]
        }
    })

# 3. Global Find & Replace: stage. -> current_stage_
json_str = json.dumps(data, ensure_ascii=False)
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

# 4. Initialize global attributes (V41 already has stage_id, but we must add current_stage_ variables)
stage_vars = [
    'current_stage_scale', 'current_stage_shutdown_base_reward', 'current_stage_shutdown_hit_rate', 'current_stage_shutdown_blocked_rate',
    'current_stage_heist_reward_small', 'current_stage_heist_reward_medium', 'current_stage_heist_reward_large',
    'current_stage_heist_rate_small', 'current_stage_heist_rate_medium', 'current_stage_heist_rate_large'
]
if 'attributes' not in data: data['attributes'] = []
for var in stage_vars:
    if not any(a['key'] == var for a in data['attributes']):
        data['attributes'].append({'key': var, 'type': 'number', 'value': '0'})

# 5. Add Sync Logic Gate Chain
selector_nodes = []
selector_edges = []
prev_gate = "n-stage-selector-start"
selector_nodes.append({
    "id": prev_gate,
    "type": "gate",
    "position": {"x": 500, "y": 600},
    "data": {"label": "스테이지 1?", "condition": "stage_id == 1"}
})

for i in range(1, 11):
    logic_id = f"n-stage-sync-{i}"
    # Use stage_X in formulas to avoid hyphen subtraction error
    ref_name = f"stage_{i}"
    
    selector_nodes.append({
        "id": logic_id,
        "type": "trigger",
        "position": {"x": 700, "y": 600 + (i*80)},
        "data": {"label": f"S{i} 변수 복사", "attributes": [
            {"key": "current_stage_scale", "type": "number", "value": f"{ref_name}.reward_scale"},
            {"key": "current_stage_shutdown_base_reward", "type": "number", "value": f"{ref_name}.shutdown_base_reward"},
            {"key": "current_stage_shutdown_hit_rate", "type": "number", "value": f"{ref_name}.shutdown_hit_rate"},
            {"key": "current_stage_shutdown_blocked_rate", "type": "number", "value": f"{ref_name}.shutdown_blocked_rate"},
            {"key": "current_stage_heist_reward_small", "type": "number", "value": f"{ref_name}.heist_reward_small"},
            {"key": "current_stage_heist_reward_medium", "type": "number", "value": f"{ref_name}.heist_reward_medium"},
            {"key": "current_stage_heist_reward_large", "type": "number", "value": f"{ref_name}.heist_reward_large"},
            {"key": "current_stage_heist_rate_small", "type": "number", "value": f"{ref_name}.heist_rate_small"},
            {"key": "current_stage_heist_rate_medium", "type": "number", "value": f"{ref_name}.heist_rate_medium"},
            {"key": "current_stage_heist_rate_large", "type": "number", "value": f"{ref_name}.heist_rate_large"}
        ]}
    })
    
    source_gate = f"n-stage-g-{i}" if i > 1 else prev_gate
    selector_edges.append({"id": f"e-stage-sync-t-{i}", "source": source_gate, "target": logic_id, "type": "exec", "data": {"gateBranch": "true"}})
    selector_edges.append({"id": f"e-stage-sync-out-{i}", "source": logic_id, "target": "n-move-logic", "type": "exec"})
    
    if i < 10:
        next_gate = f"n-stage-g-{i+1}"
        selector_nodes.append({
            "id": next_gate,
            "type": "gate",
            "position": {"x": 500, "y": 600 + (i*80)},
            "data": {"label": f"스테이지 {i+1}?", "condition": f"stage_id == {i+1}"}
        })
        selector_edges.append({"id": f"e-stage-sync-f-{i}", "source": source_gate, "target": next_gate, "type": "exec", "data": {"gateBranch": "false"}})

data['nodes'].extend(new_nodes)
data['nodes'].extend(selector_nodes)
data['edges'].extend(new_edges)
data['edges'].extend(selector_edges)

# 6. Re-wire n-roll to n-stage-selector-start safely
for edge in data['edges']:
    if edge['source'] == 'n-roll' and edge['target'] == 'n-move-logic':
        edge['target'] = 'n-stage-selector-start'

# 7. Apply Jail Bypass fix (from V48)
for edge in data['edges']:
    if edge['source'] == 'n-jail-success' and edge['target'] == 'n-accumulate-tile':
        edge['target'] = 'n-loop-gate'

# Save as V50
data['designName'] = "돈_획득_40칸_테이블_연동_V50"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V50.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V50 generated successfully! Clean V41 base + Perfect 10-Stage Sync + Jail Bug Fix.")
