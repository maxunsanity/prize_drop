import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V18.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update false branch of n-land-s8-gate to point to n-chance-gate
for edge in data['edges']:
    if edge.get('source') == 'n-land-s8-gate' and edge.get('data', {}).get('gateBranch') == 'false':
        edge['target'] = 'n-chance-gate'

# 2. Add chance parameters to stage entity
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        node['data']['attributes'].extend([
            {"key": "chance_money_base", "type": "number", "value": "150"},
            {"key": "chance_dice_base", "type": "number", "value": "5"}
        ])

# 3. Add initial chance_rand to n-init
for node in data['nodes']:
    if node['id'] == 'n-init':
        node['data']['attributes'].append({"key": "chance_rand", "type": "number", "value": "0"})

# 4. Create new nodes
new_nodes = [
    {
      "id": "n-chance-gate",
      "type": "gate",
      "position": {"x": 800, "y": 2300},
      "data": {
        "label": "복불복(CHANCE)?",
        "condition": "pos == 7 || pos == 22 || pos == 36",
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-init",
      "type": "trigger",
      "position": {"x": 1000, "y": 2300},
      "data": {
        "label": "확률 굴리기",
        "attributes": [{"key": "chance_rand", "type": "number", "value": "rand.d100()"}],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-money-gate",
      "type": "gate",
      "position": {"x": 1000, "y": 2450},
      "data": {
        "label": "돈 획득 (30%)",
        "condition": "chance_rand <= 30",
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-money-logic",
      "type": "trigger",
      "position": {"x": 1200, "y": 2450},
      "data": {
        "label": "복불복 보너스 돈",
        "attributes": [{"key": "money_gain", "type": "number", "value": "stage.chance_money_base * stage.reward_scale * dice_count"}],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-station-gate",
      "type": "gate",
      "position": {"x": 1000, "y": 2600},
      "data": {
        "label": "정거장 이동 (30%)",
        "condition": "chance_rand <= 60",
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-station-logic",
      "type": "trigger",
      "position": {"x": 1200, "y": 2600},
      "data": {
        "label": "가까운 정거장 워프",
        "attributes": [{"key": "pos", "type": "number", "value": "15"}],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    },
    {
      "id": "n-chance-dice-logic",
      "type": "trigger",
      "position": {"x": 1000, "y": 2750},
      "data": {
        "label": "주사위 획득 (40%)",
        "attributes": [{"key": "dice", "type": "number", "value": "dice + stage.chance_dice_base"}],
        "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0},
        "frictionScore": 0
      }
    }
]
data['nodes'].extend(new_nodes)

# 5. Create new edges
new_edges = [
    {"id": "e-chance-gate-false", "source": "n-chance-gate", "target": "n-accumulate-tile", "type": "exec", "data": {"gateBranch": "false"}},
    {"id": "e-chance-gate-true", "source": "n-chance-gate", "target": "n-chance-init", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-chance-init-out", "source": "n-chance-init", "target": "n-chance-money-gate", "type": "exec"},
    
    {"id": "e-chance-money-gate-true", "source": "n-chance-money-gate", "target": "n-chance-money-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-chance-money-gate-false", "source": "n-chance-money-gate", "target": "n-chance-station-gate", "type": "exec", "data": {"gateBranch": "false"}},
    
    {"id": "e-chance-station-gate-true", "source": "n-chance-station-gate", "target": "n-chance-station-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-chance-station-gate-false", "source": "n-chance-station-gate", "target": "n-chance-dice-logic", "type": "exec", "data": {"gateBranch": "false"}},
    
    {"id": "e-chance-money-logic-out", "source": "n-chance-money-logic", "target": "n-accumulate-tile", "type": "exec"},
    {"id": "e-chance-station-logic-out", "source": "n-chance-station-logic", "target": "n-tile-dispatcher", "type": "exec"},
    {"id": "e-chance-dice-logic-out", "source": "n-chance-dice-logic", "target": "n-accumulate-tile", "type": "exec"}
]
data['edges'].extend(new_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V19"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V19.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V19 generated successfully.")
