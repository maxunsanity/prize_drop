import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V16.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove n-land-logic
data['nodes'] = [n for n in data['nodes'] if n['id'] != 'n-land-logic']

# Remove edges connected to n-land-logic
data['edges'] = [e for e in data['edges'] if e.get('source') != 'n-land-logic' and e.get('target') != 'n-land-logic']

# Add new nodes
stages = [
    {"gate_id": "n-land-s1-gate", "trigger_id": "n-land-s1", "cond": "pos == 1 || pos == 3", "reward": 50, "label": "1단계 지역"},
    {"gate_id": "n-land-s2-gate", "trigger_id": "n-land-s2", "cond": "pos == 6 || pos == 8 || pos == 9", "reward": 80, "label": "2단계 지역"},
    {"gate_id": "n-land-s3-gate", "trigger_id": "n-land-s3", "cond": "pos == 11 || pos == 13 || pos == 14", "reward": 110, "label": "3단계 지역"},
    {"gate_id": "n-land-s4-gate", "trigger_id": "n-land-s4", "cond": "pos == 16 || pos == 18 || pos == 19", "reward": 140, "label": "4단계 지역"},
    {"gate_id": "n-land-s5-gate", "trigger_id": "n-land-s5", "cond": "pos == 21 || pos == 23 || pos == 24", "reward": 170, "label": "5단계 지역"},
    {"gate_id": "n-land-s6-gate", "trigger_id": "n-land-s6", "cond": "pos == 26 || pos == 27 || pos == 29", "reward": 200, "label": "6단계 지역"},
    {"gate_id": "n-land-s7-gate", "trigger_id": "n-land-s7", "cond": "pos == 31 || pos == 32 || pos == 34", "reward": 230, "label": "7단계 지역"},
    {"gate_id": "n-land-s8-gate", "trigger_id": "n-land-s8", "cond": "pos == 37 || pos == 39", "reward": 260, "label": "8단계 지역"},
]

base_x_gate = 800
base_x_trigger = 1000
base_y = 1000
y_step = 150

for i, stage in enumerate(stages):
    # Gate
    gate_node = {
      "id": stage["gate_id"],
      "type": "gate",
      "position": {"x": base_x_gate, "y": base_y + i * y_step},
      "data": {
        "label": f"대지 {i+1}단계?",
        "condition": stage["cond"],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    }
    
    # Trigger
    trigger_node = {
      "id": stage["trigger_id"],
      "type": "trigger",
      "position": {"x": base_x_trigger, "y": base_y + i * y_step},
      "data": {
        "label": stage["label"],
        "attributes": [
          {
            "key": "money_gain",
            "type": "number",
            "value": f"{stage['reward']} * stage.reward_scale * dice_count"
          }
        ],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    }
    data['nodes'].extend([gate_node, trigger_node])

# Update edges
# n-tax-gate (false) -> n-land-s1-gate
data['edges'].append({
    "id": "e-tax-to-s1",
    "source": "n-tax-gate",
    "target": "n-land-s1-gate",
    "type": "exec",
    "data": {"gateBranch": "false"}
})

# Chain gates
for i in range(len(stages)):
    gate_id = stages[i]["gate_id"]
    trigger_id = stages[i]["trigger_id"]
    
    # True branch to trigger
    data['edges'].append({
        "id": f"e-{gate_id}-true",
        "source": gate_id,
        "target": trigger_id,
        "type": "exec",
        "data": {"gateBranch": "true"}
    })
    
    # Trigger to n-accumulate-tile
    data['edges'].append({
        "id": f"e-{trigger_id}-out",
        "source": trigger_id,
        "target": "n-accumulate-tile",
        "type": "exec"
    })
    
    # False branch to next gate or accumulate tile
    if i < len(stages) - 1:
        next_gate_id = stages[i+1]["gate_id"]
        data['edges'].append({
            "id": f"e-{gate_id}-false",
            "source": gate_id,
            "target": next_gate_id,
            "type": "exec",
            "data": {"gateBranch": "false"}
        })
    else:
        # Last gate false branch goes to accumulate tile (0 reward)
        data['edges'].append({
            "id": f"e-{gate_id}-false",
            "source": gate_id,
            "target": "n-accumulate-tile",
            "type": "exec",
            "data": {"gateBranch": "false"}
        })

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V17"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V17.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V17 generated successfully.")
