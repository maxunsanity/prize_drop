import json

def add_emotions_to_0429_easy():
    with open('주사위_게임_쉬운버전_(0429).json', 'r') as f:
        data = json.load(f)

    # 1. Add Emotion Nodes
    new_nodes = [
        {
            "id": "n_emo_anticipation", "type": "emotion",
            "position": {"x": 384, "y": 1080},
            "data": {
                "label": "감정 (두근두근)", "needSource": "competence", "needState": "accumulated",
                "emotionType": "도전감", "arousal": "high", "description": "과연 결과는?!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_success", "type": "emotion",
            "position": {"x": 183, "y": 1220},
            "data": {
                "label": "감정 (성공의 기쁨)", "needSource": "competence", "needState": "satisfied",
                "emotionType": "성취감", "arousal": "high", "description": "예측이 적중했습니다!",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_emo_fail", "type": "emotion",
            "position": {"x": 628, "y": 1220},
            "data": {
                "label": "감정 (아쉬운 빗나감)", "needSource": "competence", "needState": "thwarted",
                "emotionType": "좌절감", "arousal": "high", "description": "다음에 다시 도전해봐요.",
                "tags": [], "playerSegment": []
            }
        }
    ]
    data['nodes'].extend(new_nodes)

    # 2. Re-route Edges
    # n_high / n_low -> n_emo_anticipation -> n_judge
    data['edges'] = [e for e in data['edges'] if not (e.get('source') in ['n_high', 'n_low'] and e.get('target') == 'n_judge')]
    data['edges'].extend([
        {"id": "e_high_to_tension", "source": "n_high", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_low_to_tension", "source": "n_low", "target": "n_emo_anticipation", "type": "exec"},
        {"id": "e_tension_to_judge", "source": "n_emo_anticipation", "target": "n_judge", "type": "exec"}
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
        {"id": "e_emo_win_to_win", "source": "n_emo_success", "target": "n_win", "type": "exec"},
        {"id": "e_emo_fail_to_lose", "source": "n_emo_fail", "target": "n_lose", "type": "exec"}
    ])

    # 3. Easy Mode Tuning
    for node in data['nodes']:
        if node['id'] == 'n_emo_anticipation':
            node['data']['frictionScore'] = 1
        elif node['id'] == 'n_emo_fail':
            node['data']['frictionScore'] = 3
        elif node['id'] == 'n_emo_success':
            node['data']['sdtEffects'] = {"motivation": 15, "competence": 10, "autonomy": 5, "relatedness": 0}

    # 4. Global Edge Fix
    for edge in data['edges']:
        if 'data' not in edge:
            edge['data'] = {}
        edge['data']['animated'] = False

    with open('주사위_게임_쉬운버전_감정이식_최종.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    add_emotions_to_0429_easy()
