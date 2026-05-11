import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V43.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Correct the edge routing: n-roll -> n-stage-selector-start
# Find the edge from n-roll to n-move-logic and change its target
found_edge = False
for edge in data['edges']:
    if edge['source'] == 'n-roll' and edge['target'] == 'n-move-logic':
        edge['target'] = 'n-stage-selector-start'
        found_edge = True
        break

if not found_edge:
    # If it was connected to something else or I missed it, add it
    data['edges'].append({
        "id": "e-roll-to-selector",
        "source": "n-roll",
        "target": "n-stage-selector-start",
        "type": "exec"
    })

# 2. Ensure n-stage-sync logic nodes return to n-move-logic (since we intercepted the path)
for edge in data['edges']:
    if edge['id'].startswith('e-stage-sync-out-'):
        edge['target'] = 'n-move-logic'

# 3. Add current_stage_scale to global attributes if missing (redundant but safe)
if 'attributes' not in data: data['attributes'] = []
if not any(a['key'] == 'current_stage_scale' for a in data['attributes']):
    data['attributes'].append({'key': 'current_stage_scale', 'type': 'number', 'value': '1.0'})

data['designName'] = "돈_획득_40칸_테이블_연동_V44"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V44.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V44 generated with correct n-roll routing and stage selector integration.")
