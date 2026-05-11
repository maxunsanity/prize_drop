import json

def fix_phase3_final():
    with open('전투_3단계_샘플.json', 'r') as f:
        data = json.load(f)

    # 1. Sync Gold Variable (Change 'player_gold' to 'gold' everywhere)
    for node in data['nodes']:
        if 'attributes' in node['data']:
            for attr in node['data']['attributes']:
                if attr['key'] == 'player_gold':
                    attr['key'] = 'gold'
                if isinstance(attr['value'], str):
                    attr['value'] = attr['value'].replace('player_gold', 'gold')
        
        # Also fix mockSpecs to use 'gold'
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            for el in elements.values():
                if el.get('props', {}).get('resourceKey') == 'player_gold':
                    el['props']['resourceKey'] = 'gold'

    # 2. Define New Outcome Nodes (with fixed IDs)
    new_nodes = [
        {
            "id": "n_outcome_levelup_prog", "type": "progression",
            "position": {"x": -600, "y": 1550},
            "data": {
                "label": "성장 (레벨업!)", "progressionType": "level",
                "description": "보스전을 앞두고 강해진 나!",
                "sdtEffects": {"motivation": 15, "competence": 10, "autonomy": 5, "relatedness": 0}
            }
        },
        {
            "id": "n_outcome_levelup_emo", "type": "emotion",
            "position": {"x": -600, "y": 1700},
            "data": {
                "label": "감정 (성장의 기쁨)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "더 강력한 보스에 도전할 자격을 얻었습니다.",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_outcome_boss_emo", "type": "emotion",
            "position": {"x": 1000, "y": 1500},
            "data": {
                "label": "감정 (전설적인 성취감)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "마침내 보스를 쓰러뜨리고 전설이 되었습니다!",
                "tags": [], "playerSegment": []
            }
        }
    ]
    
    # Remove any existing nodes with these IDs before adding
    new_ids = {n['id'] for n in new_nodes}
    data['nodes'] = [n for n in data['nodes'] if n['id'] not in new_ids]
    data['nodes'].extend(new_nodes)

    # 3. Fix Edges (Remove duplicates)
    # Remove all outgoing edges from gate_is_boss and gate_levelup (Branch: true)
    data['edges'] = [e for e in data['edges'] if not (e.get('source') == 'gate_is_boss' or (e.get('source') == 'gate_levelup' and e.get('data', {}).get('gateBranch') == 'true'))]

    # Add Clean Edges
    data['edges'].extend([
        # Boss Flow
        {
            "id": "edge_boss_true_final", "source": "gate_is_boss", "target": "n_outcome_boss_emo",
            "type": "exec", "sourceHandle": "right", "targetHandle": "top",
            "data": {"gateBranch": "true", "label": "보스 처치!"}
        },
        {
            "id": "edge_boss_false_final", "source": "gate_is_boss", "target": "trig_kill_reward",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top",
            "data": {"gateBranch": "false", "label": "일반몹 처치"}
        },
        {
            "id": "edge_boss_emo_to_reward", "source": "n_outcome_boss_emo", "target": "trig_kill_reward",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        },
        # Level Up Flow
        {
            "id": "edge_lv_true_final", "source": "gate_levelup", "target": "n_outcome_levelup_prog",
            "type": "exec", "sourceHandle": "right", "targetHandle": "top",
            "data": {"gateBranch": "true", "label": "레벨업 달성"}
        },
        {
            "id": "edge_prog_to_emo_lv", "source": "n_outcome_levelup_prog", "target": "n_outcome_levelup_emo",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        },
        {
            "id": "edge_emo_to_screen_lv", "source": "n_outcome_levelup_emo", "target": "n_levelup_screen",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        }
    ])

    # 4. Global Resource Cleanup (UI)
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            to_remove = []
            for eid, el in elements.items():
                res_key = el.get('props', {}).get('resourceKey')
                if res_key and res_key not in ['gold', 'score']:
                    to_remove.append(eid)
                if any(k in eid for k in ['hp', 'dice', 'item', 'weapon']):
                    if not any(keep in eid for keep in ['gold', 'score']):
                        to_remove.append(eid)
            for rid in set(to_remove):
                if rid in elements: del elements[rid]
            for el in elements.values():
                if 'children' in el and isinstance(el['children'], list):
                    el['children'] = [c for c in el['children'] if c not in to_remove]

    # Ensure Gold Resource Definition is correct
    if 'resources' in data:
        for res in data['resources']:
            if res['key'] == 'player_gold':
                res['key'] = 'gold'

    with open('전투_3단계_성장특화_최종_v2.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_phase3_final()
