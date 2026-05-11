import json

def remodel_dice_0429_from_scratch():
    # 0. Start from the RAW file the user uploaded
    with open('주사위_게임_쉬운버전_(0429).json', 'r') as f:
        data = json.load(f)

    # 1. Resource Cleanup (Keep only Gold and Dice)
    keep_resource_keys = ['gold', 'dice']
    if 'resources' in data:
        data['resources'] = [r for r in data['resources'] if r['key'] in keep_resource_keys]

    # Keep logic-essential attributes + gold/dice
    keep_attr_keys = ['gold', 'dice', 'bet_high', 'roll', 'total_games', 'win_rate']
    for node in data['nodes']:
        if 'attributes' in node['data']:
            node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] in keep_attr_keys]

    # 2. Add Emotion Nodes
    new_nodes = [
        {
            "id": "n_emo_tension", "type": "emotion",
            "position": {"x": 384, "y": 1080},
            "data": {
                "label": "감정 (두근두근)", "needSource": "competence", "needState": "accumulated",
                "emotionType": "도전감", "arousal": "high", "description": "과연 결과는?!",
                "tags": [], "playerSegment": [], "frictionScore": 1
            }
        },
        {
            "id": "n_emo_success", "type": "emotion",
            "position": {"x": 183, "y": 1220},
            "data": {
                "label": "감정 (성공의 기쁨)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "예측이 적중했습니다!",
                "tags": [], "playerSegment": [], "sdtEffects": {"motivation": 15, "competence": 10}
            }
        },
        {
            "id": "n_emo_fail", "type": "emotion",
            "position": {"x": 628, "y": 1220},
            "data": {
                "label": "감정 (아쉬운 빗나감)", "needSource": "competence", "needState": "thwarted",
                "emotionType": "좌절감", "arousal": "high", "description": "다음에 다시 도전해봐요.",
                "tags": [], "playerSegment": [], "frictionScore": 5
            }
        }
    ]
    data['nodes'].extend(new_nodes)

    # 3. Re-route Edges
    # n_high / n_low -> n_emo_tension -> n_judge
    data['edges'] = [e for e in data['edges'] if not (e.get('source') in ['n_high', 'n_low'] and e.get('target') == 'n_judge')]
    data['edges'].extend([
        {"id": "e_high_to_tension", "source": "n_high", "target": "n_emo_tension", "type": "exec", "data": {"animated": False}},
        {"id": "e_low_to_tension", "source": "n_low", "target": "n_emo_tension", "type": "exec", "data": {"animated": False}},
        {"id": "e_tension_to_judge", "source": "n_emo_tension", "target": "n_judge", "type": "exec", "data": {"animated": False}}
    ])

    # n_judge (true) -> n_emo_success -> n_win
    # n_judge (false) -> n_emo_fail -> n_lose
    for edge in data['edges']:
        if edge.get('source') == 'n_judge':
            if edge.get('data', {}).get('gateBranch') == 'true':
                edge['target'] = 'n_emo_success'
            elif edge.get('data', {}).get('gateBranch') == 'false':
                edge['target'] = 'n_emo_fail'

    data['edges'].extend([
        {"id": "e_emo_win_to_win", "source": "n_emo_success", "target": "n_win", "type": "exec", "data": {"animated": False}},
        {"id": "e_emo_fail_to_lose", "source": "n_emo_fail", "target": "n_lose", "type": "exec", "data": {"animated": False}}
    ])

    # 4. Global UI Cleanup (Keep only Gold and Dice)
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            to_remove = []
            for eid, el in elements.items():
                res_key = el.get('props', {}).get('resourceKey')
                if res_key and res_key not in keep_resource_keys:
                    to_remove.append(eid)
                text = el.get('props', {}).get('text', '')
                if any(k in text.lower() for k in ['hp', '경험치', '체력', '무기', '아이템', 'apple']):
                    if not any(keep in text.lower() for keep in ['성공률', '플레이']):
                        to_remove.append(eid)
            
            for rid in set(to_remove):
                if rid in elements: del elements[rid]
            for el in elements.values():
                if 'children' in el and isinstance(el['children'], list):
                    el['children'] = [c for c in el['children'] if c not in to_remove]

    # Ensure all edges have data and animated: False for stability
    for edge in data['edges']:
        if 'data' not in edge: edge['data'] = {}
        edge['data']['animated'] = False

    with open('주사위_게임_0429_최종_리모델링.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    remodel_dice_0429_from_scratch()
