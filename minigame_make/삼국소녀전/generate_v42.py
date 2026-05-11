import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V41.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Remove the old single stage entity and its data edge
data['nodes'] = [n for n in data['nodes'] if n['id'] != 'node-entity-stage']
data['edges'] = [e for e in data['edges'] if e.get('target') != 'node-entity-stage' and e.get('source') != 'node-entity-stage']

# 2. Add 10 Stage Entities (stage_e1 to stage_e10)
new_nodes = []
new_edges = []
for i in range(1, 11):
    entity_id = f"stage_e{i}"
    new_nodes.append({
        "id": entity_id,
        "type": "entity",
        "position": {"x": -500, "y": 100 * i},
        "data": {
            "label": f"스테이지 {i} 정보",
            "attributes": [
                {"key": "reward_scale", "type": "number", "value": "1.0"},
                {"key": "shutdown_base_reward", "type": "number", "value": "100000"}
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
                {"sourceKey": "reward_scale", "targetKey": f"{entity_id}.reward_scale"},
                {"sourceKey": "shutdown_base_reward", "targetKey": f"{entity_id}.shutdown_base_reward"}
            ]
        }
    })

# 3. Add current_stage_scale to Global Attributes
if 'attributes' not in data: data['attributes'] = []
data['attributes'].append({'key': 'current_stage_scale', 'type': 'number', 'value': '1.0'})

# 4. Create Stage Selection Gate Chain
# This is a bit complex, but essentially:
# n-stage-selector (dispatcher) -> n-stage-g1 -> n-stage-g2 ...
# For simplicity, let's create a trigger that can be used once.
# But LLE doesn't have if/else. So we need gates.
# Actually, I will update ALL land formulas to use a dynamic variable "current_stage_scale".
# And the user can manually set stage_id and we need a way to update current_stage_scale.

# To keep it simple for the user to TEST:
# I will update ALL n-land-sX formulas to use "current_stage_scale".
for node in data['nodes']:
    if 'land-s' in node['id'] and node['type'] == 'trigger':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                # Replace stage.reward_scale with current_stage_scale
                attr['value'] = attr['value'].replace('stage.reward_scale', 'current_stage_scale')

# Add a "Stage Scale Sync" node chain at the beginning of the dispatcher
# Dispatcher -> Stage1? -> Stage2? ...
# This ensures current_stage_scale is ALWAYS correct based on stage_id.

selector_nodes = []
selector_edges = []
prev_gate = "n-stage-selector-start"
selector_nodes.append({
    "id": prev_gate,
    "type": "gate",
    "position": {"x": 200, "y": -500},
    "data": {"label": "스테이지 1?", "condition": "stage_id == 1"}
})

for i in range(1, 11):
    logic_id = f"n-stage-sync-{i}"
    selector_nodes.append({
        "id": logic_id,
        "type": "trigger",
        "position": {"x": 400, "y": -500 + (i*50)},
        "data": {"label": f"S{i} 배율 적용", "attributes": [{"key": "current_stage_scale", "value": f"stage_e{i}.reward_scale"}]}
    })
    selector_edges.append({"id": f"e-stage-sync-t-{i}", "source": f"n-stage-g-{i}" if i > 1 else prev_gate, "target": logic_id, "type": "exec", "data": {"gateBranch": "true"}})
    # Logic returns to dispatcher or next check?
    # Actually, all logic nodes return to n-dice-roll or wherever the game starts.
    # Let's say they return to n-tile-dispatcher.
    selector_edges.append({"id": f"e-stage-sync-out-{i}", "source": logic_id, "target": "n-tile-dispatcher", "type": "exec"})
    
    if i < 10:
        next_gate = f"n-stage-g-{i+1}"
        selector_nodes.append({
            "id": next_gate,
            "type": "gate",
            "position": {"x": 200, "y": -500 + (i*50)},
            "data": {"label": f"스테이지 {i+1}?", "condition": f"stage_id == {i+1}"}
        })
        selector_edges.append({"id": f"e-stage-sync-f-{i}", "source": f"n-stage-g-{i}" if i > 1 else prev_gate, "target": next_gate, "type": "exec", "data": {"gateBranch": "false"}})

data['nodes'].extend(new_nodes)
data['nodes'].extend(selector_nodes)
data['edges'].extend(new_edges)
data['edges'].extend(selector_edges)

# Re-wire n-dice-roll to n-stage-selector-start
for edge in data['edges']:
    if edge['source'] == 'n-dice-roll' and edge['target'] == 'n-tile-dispatcher':
        edge['target'] = 'n-stage-selector-start'

data['designName'] = "돈_획득_40칸_테이블_연동_V42"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V42.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V42 generated with 10 stage entities and sync logic.")
