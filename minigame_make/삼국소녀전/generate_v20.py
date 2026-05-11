import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V19.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Tax Logic
for node in data['nodes']:
    if node['id'] == 'n-tax-logic':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                attr['value'] = '-(money * 0.1 * dice_count)'

# 2. Add community_reward_base to stage entity
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        node['data']['attributes'].append({"key": "community_reward_base", "type": "number", "value": "200"})

# 3. Add necessary initial variables to n-init
for node in data['nodes']:
    if node['id'] == 'n-init':
        node['data']['attributes'].extend([
            {"key": "jail_attempts", "type": "number", "value": "0"},
            {"key": "d1", "type": "number", "value": "0"},
            {"key": "d2", "type": "number", "value": "0"}
        ])

# 4. Redirect n-chance-gate FALSE edge to n-community-gate
for edge in data['edges']:
    if edge.get('source') == 'n-chance-gate' and edge.get('data', {}).get('gateBranch') == 'false':
        edge['target'] = 'n-community-gate'

# 5. Create new nodes
new_nodes = [
    {
      "id": "n-community-gate",
      "type": "gate",
      "position": {"x": 800, "y": 3000},
      "data": {"label": "사회기금?", "condition": "pos == 2 || pos == 17 || pos == 33", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-community-logic",
      "type": "trigger",
      "position": {"x": 1000, "y": 3000},
      "data": {"label": "사회기금 보상", "attributes": [{"key": "money_gain", "type": "number", "value": "stage.community_reward_base * stage.reward_scale * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-gate",
      "type": "gate",
      "position": {"x": 800, "y": 3200},
      "data": {"label": "감옥?", "condition": "pos == 30", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-enter",
      "type": "trigger",
      "position": {"x": 1000, "y": 3200},
      "data": {"label": "감옥 입장 (3회)", "attributes": [{"key": "jail_attempts", "type": "number", "value": "3"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-roll",
      "type": "trigger",
      "position": {"x": 1200, "y": 3200},
      "data": {"label": "탈출 주사위 굴림", "attributes": [
          {"key": "d1", "type": "number", "value": "rand.d6()"},
          {"key": "d2", "type": "number", "value": "rand.d6()"},
          {"key": "jail_attempts", "type": "number", "value": "jail_attempts - 1"},
          {"key": "dice", "type": "number", "value": "dice - dice_count"}
      ], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-check",
      "type": "gate",
      "position": {"x": 1400, "y": 3200},
      "data": {"label": "더블 성공?", "condition": "d1 == d2", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-success",
      "type": "trigger",
      "position": {"x": 1600, "y": 3100},
      "data": {"label": "탈출 보상!", "attributes": [{"key": "dice", "type": "number", "value": "dice + (d1 + d2) * dice_count"}], "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    },
    {
      "id": "n-jail-retry-check",
      "type": "gate",
      "position": {"x": 1600, "y": 3300},
      "data": {"label": "기회 남음?", "condition": "jail_attempts > 0", "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}, "frictionScore": 0}
    }
]
data['nodes'].extend(new_nodes)

# 6. Create new edges
new_edges = [
    # Community edges
    {"id": "e-comm-gate-true", "source": "n-community-gate", "target": "n-community-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-comm-gate-false", "source": "n-community-gate", "target": "n-jail-gate", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-comm-logic-out", "source": "n-community-logic", "target": "n-accumulate-tile", "type": "exec"},
    
    # Jail edges
    {"id": "e-jail-gate-true", "source": "n-jail-gate", "target": "n-jail-enter", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-jail-gate-false", "source": "n-jail-gate", "target": "n-accumulate-tile", "type": "exec", "data": {"gateBranch": "false"}},
    
    {"id": "e-jail-enter-out", "source": "n-jail-enter", "target": "n-jail-roll", "type": "exec"},
    {"id": "e-jail-roll-out", "source": "n-jail-roll", "target": "n-jail-check", "type": "exec"},
    
    {"id": "e-jail-check-true", "source": "n-jail-check", "target": "n-jail-success", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-jail-check-false", "source": "n-jail-check", "target": "n-jail-retry-check", "type": "exec", "data": {"gateBranch": "false"}},
    
    {"id": "e-jail-success-out", "source": "n-jail-success", "target": "n-accumulate-tile", "type": "exec"},
    
    {"id": "e-jail-retry-true", "source": "n-jail-retry-check", "target": "n-jail-roll", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-jail-retry-false", "source": "n-jail-retry-check", "target": "n-accumulate-tile", "type": "exec", "data": {"gateBranch": "false"}}
]
data['edges'].extend(new_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V20"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V20.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V20 generated successfully.")
