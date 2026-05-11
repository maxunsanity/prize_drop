import json

def transform_dice_easy_mode():
    with open('주사위 게임 _ 완료.json', 'r') as f:
        data = json.load(f)

    # 1. New Psychological Outcome Nodes (Easy Mode Balance)
    new_nodes = [
        {
            "id": "n_emo_anticipation", "type": "emotion",
            "position": {"x": 368, "y": 1400},
            "data": {
                "label": "감정 (가벼운 기대감)", "needSource": "competence", "needState": "accumulated",
                "emotionType": "도전감", "arousal": "high", "description": "잘 될 것 같은 예감!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_success", "type": "emotion",
            "position": {"x": 198, "y": 1650},
            "data": {
                "label": "감정 (기분 좋은 성공)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "역시 내가 맞았어!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_fail", "type": "emotion",
            "position": {"x": 542, "y": 1650},
            "data": {
                "label": "감정 (다음에 잘 될 거야)", "needSource": "competence", "needState": "thwarted",
                "emotionType": "좌절감", "arousal": "high", "description": "살짝 빗나갔네, 다시 해보자!",
                "tags": [], "playerSegment": []
            }
        }
    ]
    data['nodes'].extend(new_nodes)

    # 2. Re-route Edges
    data['edges'] = [e for e in data['edges'] if not (e.get('source') in ['n_high_calc', 'n_low_calc'] and e.get('target') == 'n_gate_judge')]
    data['edges'].extend([
        {"id": "e_high_to_anti", "source": "n_high_calc", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_low_to_anti", "source": "n_low_calc", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_anti_to_judge", "source": "n_emo_anticipation", "target": "n_gate_judge", "type": "exec"}
    ])

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

    # 3. Easy Mode Tuning: Lower Friction, Higher Motivation
    for node in data['nodes']:
        if node['id'] == 'n_emo_anticipation':
            node['data']['frictionScore'] = 1 # Very Low
        elif node['id'] == 'n_emo_fail':
            node['data']['frictionScore'] = 5 # Mild disappointment
        elif node['id'] == 'n_emo_success':
            node['data']['frictionScore'] = 0
            # Let's add extra motivation for success in easy mode
            node['data']['sdtEffects'] = {"motivation": 15, "competence": 10, "autonomy": 5, "relatedness": 0}

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
                if any(k in eid for k in ['rate', 'total']):
                    continue
            for rid in set(to_remove):
                if rid in elements: del elements[rid]
            for el in elements.values():
                if 'children' in el and isinstance(el['children'], list):
                    el['children'] = [c for c in el['children'] if c not in to_remove]

    # 5. Fix potential schema issues
    for edge in data['edges']:
        if 'data' not in edge:
            edge['data'] = {}
        if 'animated' not in edge['data']:
            edge['data']['animated'] = False

    with open('주사위_게임_심리특화_쉬운버전.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    transform_dice_easy_mode()
