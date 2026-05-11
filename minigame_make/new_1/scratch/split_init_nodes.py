import json
import uuid

def split_init_node():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    new_nodes = []
    new_edges = []
    
    # We will remove n_init
    nodes_to_keep = []
    
    n_init_pos = {"x": 320, "y": 120} # Default if not found
    
    for node in data['nodes']:
        if node['id'] == 'n_init':
            n_init_pos = node['position']
            continue
        nodes_to_keep.append(node)
        
        # Also update targetNodeId in Choice/Success/Failure buttons
        if 'mockSpec' in node.get('data', {}):
            elements = node['data']['mockSpec']['elements']
            for el_key, el_val in elements.items():
                if el_val.get('type') == 'Button':
                    if el_val.get('props', {}).get('targetNodeId') == 'n_init':
                        el_val['props']['targetNodeId'] = 'n_init_player'

    data['nodes'] = nodes_to_keep
    
    # 1. Create n_init_player
    n_init_player = {
        "id": "n_init_player",
        "type": "trigger",
        "position": {"x": n_init_pos['x'], "y": n_init_pos['y']},
        "data": {
            "tags": [],
            "label": "플레이어 변수 초기화",
            "attributes": [
                {"key": "player_hp", "value": "100"},
                {"key": "player_max_hp", "value": "100"},
                {"key": "player_hp_ratio", "value": "1"},
                {"key": "player_atk", "value": "10"},
                {"key": "damage", "value": "0"},
                {"key": "turn_count", "value": "0"}
            ],
            "description": "",
            "frictionScore": 0,
            "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0}
        },
        "measured": {"width": 220, "height": 85}
    }
    
    # 2. Create n_init_enemy
    n_init_enemy = {
        "id": "n_init_enemy",
        "type": "trigger",
        "position": {"x": n_init_pos['x'], "y": n_init_pos['y'] + 80}, # placed slightly below
        "data": {
            "tags": [],
            "label": "적 변수 초기화",
            "attributes": [
                {"key": "enemy_hp", "value": "50"},
                {"key": "enemy_max_hp", "value": "50"},
                {"key": "enemy_hp_ratio", "value": "1"},
                {"key": "enemy_atk", "value": "5"}
            ],
            "description": "",
            "frictionScore": 0,
            "sdtEffects": {"autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0}
        },
        "measured": {"width": 220, "height": 85}
    }
    
    data['nodes'].extend([n_init_player, n_init_enemy])
    
    # 3. Update Edges
    edges_to_keep = []
    for edge in data['edges']:
        if edge['target'] == 'n_init':
            edge['target'] = 'n_init_player'
            edges_to_keep.append(edge)
        elif edge['source'] == 'n_init':
            # This is the edge going from n_init to Choice (HIOoyUfUBzgoZfaJbe2o)
            edge['source'] = 'n_init_enemy'
            edges_to_keep.append(edge)
        else:
            edges_to_keep.append(edge)
            
    # Add new edge connecting player_init to enemy_init
    edges_to_keep.append({
        "id": f"xy-edge__n_init_playerbottom-n_init_enemytop_{uuid.uuid4().hex[:8]}",
        "source": "n_init_player",
        "target": "n_init_enemy",
        "data": {"animated": False},
        "type": "exec",
        "sourceHandle": "bottom",
        "targetHandle": "top"
    })
    
    data['edges'] = edges_to_keep

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    split_init_node()
