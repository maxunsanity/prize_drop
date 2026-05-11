import json

def transform_dice_hard_mode():
    with open('주사위 게임 _ 완료.json', 'r') as f:
        data = json.load(f)

    # 1. New Psychological Outcome Nodes
    new_nodes = [
        {
            "id": "n_emo_anticipation", "type": "emotion",
            "position": {"x": 368, "y": 1400},
            "data": {
                "label": "감정 (두근두근 긴장감)", "needSource": "competence", "needState": "accumulated",
                "emotionType": "도전감", "arousal": "high", "description": "과연 결과는...?!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_success", "type": "emotion",
            "position": {"x": 198, "y": 1650},
            "data": {
                "label": "감정 (완벽한 예측!)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "내 예상이 딱 들어맞았어!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_fail", "type": "emotion",
            "position": {"x": 542, "y": 1650},
            "data": {
                "label": "감정 (아쉬운 빗나감)", "needSource": "competence", "needState": "thwarted",
                "emotionType": "좌절감", "arousal": "high", "description": "하... 주사위 신이 나를 버렸네.",
                "tags": [], "playerSegment": []
            }
        }
    ]
    data['nodes'].extend(new_nodes)

    # 2. Re-route Edges to inject emotions
    # n_high_calc / n_low_calc -> n_emo_anticipation -> n_gate_judge
    
    # Remove old edges from high/low to judge
    data['edges'] = [e for e in data['edges'] if not (e.get('source') in ['n_high_calc', 'n_low_calc'] and e.get('target') == 'n_gate_judge')]
    
    data['edges'].extend([
        {"id": "e_high_to_anti", "source": "n_high_calc", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_low_to_anti", "source": "n_low_calc", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_anti_to_judge", "source": "n_emo_anticipation", "target": "n_gate_judge", "type": "exec"}
    ])

    # n_gate_judge (true) -> n_emo_success -> n_ui_win
    # n_gate_judge (false) -> n_emo_fail -> n_ui_fail
    for edge in data['edges']:
        if edge.get('source') == 'n_gate_judge':
            if edge.get('data', {}).get('gateBranch') == 'true':
                edge['target'] = 'n_emo_success'
            elif edge.get('data', {}).get('gateBranch') == 'false':
                edge['target'] = 'n_emo_fail'

    data['edges'].extend([
        {"id": "e_win_emo_to_ui", "source": "n_emo_success", "target": "n_ui_win", "type": "exec"},
        {"id": "e_fail_emo_to_ui", "source": "n_emo_fail", "target": "n_ui_fail", "type": "exec"}
    ])

    # 3. Increase Friction for "Hard Version"
    for node in data['nodes']:
        if node['id'] == 'n_emo_anticipation':
            node['data']['frictionScore'] = 5
        elif node['id'] == 'n_emo_fail':
            node['data']['frictionScore'] = 20
        elif node['id'] == 'n_emo_success':
            node['data']['frictionScore'] = 0

    # 4. Global UI Cleanup (Keep only Gold and Dice)
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            to_remove = []
            for eid, el in elements.items():
                res_key = el.get('props', {}).get('resourceKey')
                if res_key and res_key not in ['gold', 'dice']:
                    to_remove.append(eid)
                # Keep total_games and win_rate
                if any(k in eid for k in ['rate', 'total']):
                    continue
            for rid in set(to_remove):
                if rid in elements: del elements[rid]
            for el in elements.values():
                if 'children' in el and isinstance(el['children'], list):
                    el['children'] = [c for c in el['children'] if c not in to_remove]

    # 5. Fix potential schema issues (Edge Data)
    for edge in data['edges']:
        if 'data' not in edge:
            edge['data'] = {}
        if 'animated' not in edge['data']:
            edge['data']['animated'] = False

    with open('주사위_게임_심리특화_완료.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    transform_dice_hard_mode()
