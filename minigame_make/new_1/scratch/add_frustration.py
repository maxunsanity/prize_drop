import json

def add_frustration_outcome():
    with open('전투_2단계_심리특화_최종.json', 'r') as f:
        data = json.load(f)

    # 1. Define Frustration Node
    frustration_node = {
        "id": "n_outcome_frustration",
        "type": "emotion",
        "position": {"x": 700, "y": 1200},
        "data": {
            "label": "감정 (좌절)",
            "needSource": "competence",
            "needState": "thwarted", # 좌절
            "emotionType": "좌절",
            "arousal": "high",
            "sdtEffects": {"motivation": -15, "competence": -10}
        }
    }
    data['nodes'].append(frustration_node)

    # 2. Update Edges for Defeat Flow
    # Find Edge: 플레이어 사망? (dbClGLpmQ22hftQwXs3M) -> 패배 (PkGUAqSomtLEOXEuyofe)
    defeat_edge_id = None
    for edge in data['edges']:
        if edge.get('source') == 'dbClGLpmQ22hftQwXs3M' and edge.get('data', {}).get('gateBranch') == 'true':
            defeat_edge_id = edge['id']
            break
            
    if defeat_edge_id:
        data['edges'] = [e for e in data['edges'] if e['id'] != defeat_edge_id]
        
        # Add Chain: Gate -> Frustration -> Defeat Screen
        data['edges'].extend([
            {
                "id": "edge_gate_to_frustration",
                "source": "dbClGLpmQ22hftQwXs3M", "target": "n_outcome_frustration",
                "type": "exec", "sourceHandle": "right", "targetHandle": "top",
                "data": {"gateBranch": "true", "label": "플레이어 쓰러짐"}
            },
            {
                "id": "edge_frustration_to_defeat",
                "source": "n_outcome_frustration", "target": "PkGUAqSomtLEOXEuyofe",
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            }
        ])

    with open('전투_2단계_심리특화_최종_v2.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    add_frustration_outcome()
