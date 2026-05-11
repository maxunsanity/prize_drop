import json

def detail_sdt_phase2():
    with open('전투_2단계_골드_v3.json', 'r') as f:
        data = json.load(f)

    # 1. Start Motivation
    for node in data['nodes']:
        if node['id'] == '3dMvnKaXtRBlG9qJOqe0': # Entry
            node['data']['sdtEffects'] = {"motivation": 80, "autonomy": 0, "competence": 0, "relatedness": 0}
            node['data']['frictionScore'] = 0

        # 2. Detail SDT for Battle Actions
        elif node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice (공격/대기)
            node['data']['frictionScore'] = 1
            node['data']['sdtEffects'] = {"autonomy": 8, "motivation": 2}
            # Cleanup UI: Remove everything except Gold and Score
            mock_spec = node['data'].get('mockSpec', {})
            elements = mock_spec.get('elements', {})
            to_remove = ['meter-hp', 'player-hp-bar', 'enemy-hp-bar', 'player-hp-val', 'enemy-hp-val', 
                         'player-hp-label-row', 'enemy-hp-label-row', 'meter-dice', 'meter-item', 'meter-weapon']
            for rid in to_remove:
                if rid in elements: del elements[rid]
            # Add gold meter if missing
            elements['meter-gold'] = {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []}
            elements['meter-score'] = {"type": "ResourceMeter", "props": {"resourceKey": "score"}, "children": []}
            if 'top-area' in elements:
                elements['top-area']['children'] = ['meter-gold', 'meter-score']

        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # Action: 공격 실행
            node['data']['frictionScore'] = 2
            node['data']['sdtEffects'] = {"competence": 3, "autonomy": 2}
            
        elif node['id'] == 'WOGebJtUG9fTXv1AggCH': # Action: 적 반격
            node['data']['frictionScore'] = 12
            node['data']['sdtEffects'] = {"motivation": -8, "competence": -5}

    # 3. Inject Outcome Nodes (Emotion & Progression)
    # Define new nodes
    emotion_node = {
        "id": "n_outcome_emotion",
        "type": "emotion",
        "position": {"x": 50, "y": 1100},
        "data": {
            "label": "감정 (성취감)",
            "needSource": "competence",
            "needState": "satisfied",
            "emotionType": "성취감",
            "arousal": "high",
            "sdtEffects": {"motivation": 10, "competence": 5}
        }
    }
    progression_node = {
        "id": "n_outcome_prog",
        "type": "progression",
        "position": {"x": 50, "y": 1250},
        "data": {
            "label": "성장 (레벨업)",
            "progressionType": "level",
            "sdtEffects": {"motivation": 20, "competence": 10}
        }
    }
    data['nodes'].extend([emotion_node, progression_node])

    # 4. Update Edges for Outcomes
    # Find Edge: 적 사망? (xbB65S1FVTQsKviTmpCo) -> 승리 (Reward node: n_gold_reward or similar?)
    # In Phase 2, Success is usually a Reward node. Let's find it.
    victory_node_id = 'n_gold_reward' # Standard ID in these files
    
    # Remove edge: Gate (True) -> Victory
    edge_to_replace = None
    for edge in data['edges']:
        if edge.get('source') == 'xbB65S1FVTQsKviTmpCo' and edge.get('data', {}).get('gateBranch') == 'true':
            edge_to_replace = edge
            break
            
    if edge_to_replace:
        target_after_outcomes = edge_to_replace['target']
        data['edges'] = [e for e in data['edges'] if e['id'] != edge_to_replace['id']]
        
        # Add Chain: Gate -> Emotion -> Progression -> Original Target
        data['edges'].extend([
            {
                "id": "edge_gate_to_emo",
                "source": "xbB65S1FVTQsKviTmpCo", "target": "n_outcome_emotion",
                "type": "exec", "sourceHandle": "right", "targetHandle": "top",
                "data": {"gateBranch": "true", "label": "적 처치!"}
            },
            {
                "id": "edge_emo_to_prog",
                "source": "n_outcome_emotion", "target": "n_outcome_prog",
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            },
            {
                "id": "edge_prog_to_victory",
                "source": "n_outcome_prog", "target": target_after_outcomes,
                "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
            }
        ])

    with open('전투_2단계_심리특화_최종.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    detail_sdt_phase2()
