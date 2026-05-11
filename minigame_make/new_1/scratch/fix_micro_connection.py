import json

def fix_micro_frustration_connection():
    with open('전투_2단계_심리특화_최종_v3.json', 'r') as f:
        data = json.load(f)

    # The actual end of the enemy counter-attack logic sequence is 'trig_enemy_atk'.
    # We should put micro-frustration after that, before the 'dbClGLpmQ22hftQwXs3M' gate.
    
    source_node = 'trig_enemy_atk'
    emotion_node = 'n_micro_frustration'
    gate_node = 'dbClGLpmQ22hftQwXs3M'

    # 1. Remove existing edge from trig_enemy_atk to gate
    edge_to_remove_id = None
    for edge in data['edges']:
        if edge.get('source') == source_node and edge.get('target') == gate_node:
            edge_to_remove_id = edge['id']
            break
    
    if edge_to_remove_id:
        data['edges'] = [e for e in data['edges'] if e['id'] != edge_to_remove_id]
        
        # 2. Re-connect with emotion node in between
        data['edges'].extend([
            {
                "id": "edge_trig_to_micro",
                "source": source_node, "target": emotion_node,
                "type": "exec", "sourceHandle": "right", "targetHandle": "top"
            },
            {
                "id": "edge_micro_to_gate",
                "source": emotion_node, "target": gate_node,
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            }
        ])

    with open('전투_2단계_심리특화_최종_v4.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_micro_frustration_connection()
