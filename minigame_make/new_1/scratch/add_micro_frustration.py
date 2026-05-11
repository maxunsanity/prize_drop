import json

def add_micro_frustration():
    with open('전투_2단계_심리특화_최종_v2.json', 'r') as f:
        data = json.load(f)

    # 1. Define Micro-Frustration Node
    micro_frustration = {
        "id": "n_micro_frustration",
        "type": "emotion",
        "position": {"x": 320, "y": 1600},
        "data": {
            "label": "감정 (찰나의 좌절)",
            "needSource": "competence",
            "needState": "thwarted",
            "emotionType": "좌절",
            "arousal": "low", # Low arousal for micro-frustration
            "sdtEffects": {"motivation": -5, "competence": -3}
        }
    }
    data['nodes'].append(micro_frustration)

    # 2. Update Edges for Counter-Attack Flow
    # Find Edge: 적 반격 (WOGebJtUG9fTXv1AggCH) -> 플레이어 사망? (dbClGLpmQ22hftQwXs3M)
    counter_to_gate_edge = None
    for edge in data['edges']:
        if edge.get('source') == 'WOGebJtUG9fTXv1AggCH' and edge.get('target') == 'dbClGLpmQ22hftQwXs3M':
            counter_to_gate_edge = edge
            break
            
    if counter_to_gate_edge:
        data['edges'] = [e for e in data['edges'] if e['id'] != counter_to_gate_edge['id']]
        
        # Add Chain: Counter -> Micro-Frustration -> Gate
        data['edges'].extend([
            {
                "id": "edge_counter_to_micro",
                "source": "WOGebJtUG9fTXv1AggCH", "target": "n_micro_frustration",
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            },
            {
                "id": "edge_micro_to_gate",
                "source": "n_micro_frustration", "target": "dbClGLpmQ22hftQwXs3M",
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            }
        ])

    with open('전투_2단계_심리특화_최종_v3.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    add_micro_frustration()
