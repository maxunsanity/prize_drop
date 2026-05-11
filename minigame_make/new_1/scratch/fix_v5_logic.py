import json

def fix_v5_json():
    with open('전투_3단계_v5.json', 'r') as f:
        data = json.load(f)

    # 1. Fix variables in init nodes to use literal values (to prevent freeze)
    for node in data['nodes']:
        if node['id'] == 'n_init_player':
            node['data']['attributes'] = [
                {"key": "player_hp", "type": "number", "value": "100"},
                {"key": "player_max_hp", "type": "number", "value": "100"},
                {"key": "player_hp_ratio", "type": "number", "value": "1"},
                {"key": "player_atk", "type": "number", "value": "10"},
                {"key": "player_def", "type": "number", "value": "5"},
                {"key": "player_level", "type": "number", "value": "1"},
                {"key": "player_exp", "type": "number", "value": "0"},
                {"key": "exp_to_next", "type": "number", "value": "100"},
                {"key": "player_gold", "type": "number", "value": "0"},
                {"key": "skill_charges", "type": "number", "value": "3"},
                {"key": "damage", "type": "number", "value": "0"},
                {"key": "turn_count", "type": "number", "value": "0"},
                {"key": "kill_count", "type": "number", "value": "0"},
                {"key": "player_name", "type": "string", "value": "'용사'"}
            ]
        elif node['id'] == 'n_init_enemy':
            node['data']['attributes'] = [
                {"key": "enemy_name", "type": "string", "value": "'고블린'"},
                {"key": "enemy_avatar", "type": "string", "value": "'👺'"},
                {"key": "enemy_hp", "type": "number", "value": "40"},
                {"key": "enemy_max_hp", "type": "number", "value": "40"},
                {"key": "enemy_hp_ratio", "type": "number", "value": "1"},
                {"key": "enemy_atk", "type": "number", "value": "6"},
                {"key": "enemy_def", "type": "number", "value": "2"},
                {"key": "enemy_exp_reward", "type": "number", "value": "30"},
                {"key": "enemy_gold_reward", "type": "number", "value": "10"}
            ]
        elif node['id'] == 'n_init_boss':
            node['data']['attributes'] = [
                {"key": "enemy_name", "type": "string", "value": "'오크 족장'"},
                {"key": "enemy_avatar", "type": "string", "value": "'👹'"},
                {"key": "enemy_hp", "type": "number", "value": "150"},
                {"key": "enemy_max_hp", "type": "number", "value": "150"},
                {"key": "enemy_hp_ratio", "type": "number", "value": "1"},
                {"key": "enemy_atk", "type": "number", "value": "15"},
                {"key": "enemy_def", "type": "number", "value": "8"},
                {"key": "enemy_exp_reward", "type": "number", "value": "120"},
                {"key": "enemy_gold_reward", "type": "number", "value": "50"}
            ]

    # 2. Add Skill Button to UI and ensure Handlebars are used for enemy data
    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice node
            elements = node['data']['mockSpec']['elements']
            
            # Make sure enemy name/avatar uses variables
            if 'enemy-name' in elements:
                elements['enemy-name']['props']['text'] = "{{enemy_name}}"
            if 'enemy-avatar' in elements:
                elements['enemy-avatar']['props']['text'] = "{{enemy_avatar}}"
                
            # Add Skill Button if not there
            if 'action-buttons' in elements:
                if 'btn-skill' not in elements['action-buttons']['children']:
                    elements['action-buttons']['children'].append('btn-skill')
            
            elements['btn-skill'] = {
                "type": "Button",
                "props": {
                    "label": "🔥 파이어볼 ({{skill_charges}}회 남음)",
                    "variant": "danger",
                    "targetNodeId": "trig_skill_fireball",
                    "disabled": "{{skill_charges <= 0}}"
                },
                "on": {
                    "press": {
                        "action": "setState",
                        "params": {
                            "statePath": "/sim.currentStep",
                            "value": 3
                        }
                    }
                },
                "children": []
            }
            
            # Fix Mock State to include all variables so preview doesn't crash
            node['data']['mockInitialState'].update({
                "enemy_name": "고블린",
                "enemy_avatar": "👺",
                "skill_charges": 3,
                "player_exp": 0,
                "player_level": 1,
                "player_gold": 0
            })

    # 3. Add Fireball Logic Nodes if missing
    node_ids = [n['id'] for n in data['nodes']]
    if 'trig_skill_fireball' not in node_ids:
        # Create Fireball Action
        data['nodes'].append({
            "id": "trig_skill_fireball",
            "type": "action",
            "position": {"x": 320, "y": 650},
            "data": {
                "tags": [], "label": "파이어볼 시전!", "duration": "short", "difficulty": 5,
                "description": "파이어볼을 사용합니다.",
                "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0},
                "frictionScore": 0
            },
            "measured": {"width": 280, "height": 125}
        })
        # Create Fireball Damage Calc
        data['nodes'].append({
            "id": "trig_calc_fireball",
            "type": "trigger",
            "position": {"x": 320, "y": 800},
            "data": {
                "tags": [], "label": "스킬 데미지 계산",
                "attributes": [
                    {"key": "damage", "type": "number", "value": "player_atk + 20 + rand.d6()"},
                    {"key": "skill_charges", "type": "number", "value": "skill_charges - 1"},
                    {"key": "turn_count", "type": "number", "value": "turn_count + 1"}
                ],
                "description": "",
                "frictionScore": 0,
                "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0}
            },
            "measured": {"width": 280, "height": 150}
        })
        
        # Add edges for Fireball
        data['edges'].extend([
            {
                "id": "edge_skill_to_calc",
                "source": "trig_skill_fireball",
                "target": "trig_calc_fireball",
                "type": "exec",
                "sourceHandle": "bottom", "targetHandle": "top"
            },
            {
                "id": "edge_calc_to_apply",
                "source": "trig_calc_fireball",
                "target": "trig_player_atk",
                "type": "exec",
                "sourceHandle": "bottom", "targetHandle": "top"
            }
        ])

    with open('전투_3단계_v5_fixed.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_v5_json()
