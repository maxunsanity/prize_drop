import json
import uuid

def fix_damage_calc():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    # We need to split trig_player_atk and trig_enemy_atk into two triggers each.
    # trig_calc_p_dmg -> trig_player_atk
    # trig_calc_e_dmg -> trig_enemy_atk
    
    new_nodes = []
    new_edges = []
    
    for node in data['nodes']:
        if node['id'] == 'trig_player_atk':
            # This will now only apply damage
            node['data']['attributes'] = [
                {"key": "enemy_hp", "value": "enemy_hp - damage"},
                {"key": "enemy_hp_ratio", "value": "(enemy_hp - damage) / enemy_max_hp"}
            ]
            
            # Create calc node
            calc_p = {
                "id": "trig_calc_p_dmg",
                "type": "trigger",
                "position": {"x": node['position']['x'], "y": node['position']['y'] - 80},
                "data": {
                    "tags": [],
                    "label": "플레이어 데미지 굴림",
                    "attributes": [{"key": "damage", "value": "player_atk + rand.d6()"}],
                    "description": "",
                    "frictionScore": 0,
                    "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0}
                },
                "measured": {"width": 220, "height": 85}
            }
            new_nodes.append(calc_p)
            
            # Re-route incoming edge from Action to calc_p
            for edge in data['edges']:
                if edge['target'] == 'trig_player_atk':
                    edge['target'] = 'trig_calc_p_dmg'
                    
            # Add edge from calc_p to trig_player_atk
            new_edges.append({
                "id": f"xy-edge__trig_calc_p_dmgbottom-trig_player_atktop_{uuid.uuid4().hex[:8]}",
                "source": "trig_calc_p_dmg",
                "target": "trig_player_atk",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })
            
        elif node['id'] == 'trig_enemy_atk':
            # This will now only apply damage
            node['data']['attributes'] = [
                {"key": "player_hp", "value": "player_hp - damage"},
                {"key": "player_hp_ratio", "value": "(player_hp - damage) / player_max_hp"}
            ]
            
            # Create calc node
            calc_e = {
                "id": "trig_calc_e_dmg",
                "type": "trigger",
                "position": {"x": node['position']['x'], "y": node['position']['y'] - 80},
                "data": {
                    "tags": [],
                    "label": "적 데미지 굴림",
                    "attributes": [{"key": "damage", "value": "enemy_atk + rand.d6()"}],
                    "description": "",
                    "frictionScore": 0,
                    "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0}
                },
                "measured": {"width": 220, "height": 85}
            }
            new_nodes.append(calc_e)
            
            # Re-route incoming edge
            for edge in data['edges']:
                if edge['target'] == 'trig_enemy_atk':
                    edge['target'] = 'trig_calc_e_dmg'
                    
            # Add edge from calc_e to trig_enemy_atk
            new_edges.append({
                "id": f"xy-edge__trig_calc_e_dmgbottom-trig_enemy_atktop_{uuid.uuid4().hex[:8]}",
                "source": "trig_calc_e_dmg",
                "target": "trig_enemy_atk",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })

    data['nodes'].extend(new_nodes)
    data['edges'].extend(new_edges)

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_damage_calc()
