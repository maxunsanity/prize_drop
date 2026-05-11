import json

def balance_sdt_for_2_kills():
    with open('전투_1단계_SDT연동.json', 'r') as f:
        data = json.load(f)

    # We want a net motivation drain of -25 per enemy killed (assuming 2 turns per kill).
    # Starting motivation is typically 50.
    # Enemy 1: 50 -> 25
    # Enemy 2: 25 -> 0 (Drop out right as they try to fight the 3rd, or during 3rd)

    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice: 공격 or 대기
            node['data']['frictionScore'] = 1
            node['data']['sdtEffects'] = {
                "autonomy": 2, "competence": 0, "relatedness": 0, "motivation": 0
            }
        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # Action: 공격 실행
            node['data']['frictionScore'] = 6
            node['data']['sdtEffects'] = {
                "autonomy": 2, "competence": 2, "relatedness": 0, "motivation": 0
            }
        elif node['id'] == 'fo2aXM16YcyoQpjqlom6': # Action: 대기
            node['data']['frictionScore'] = 1
            node['data']['sdtEffects'] = {
                "autonomy": 1, "competence": 0, "relatedness": 0, "motivation": 0
            }
        elif node['id'] == 'WOGebJtUG9fTXv1AggCH': # Action: 적 반격
            node['data']['frictionScore'] = 5
            node['data']['sdtEffects'] = {
                "autonomy": 0, "competence": -2, "relatedness": 0, "motivation": -5
            }
        elif node['id'] == 'n_emotion_victory': # Emotion (Outcome)
            node['data']['frictionScore'] = 0
            node['data']['sdtEffects'] = {
                "autonomy": 0, "competence": 5, "relatedness": 0, "motivation": 2
            }
        elif node['id'] == 'JmXYql8aC8Thnor1Xcox': # Success (승리!)
            node['data']['frictionScore'] = 3
            if 'sdtEffects' not in node['data']:
                node['data']['sdtEffects'] = {}
            node['data']['sdtEffects']['motivation'] = 0

    with open('전투_1단계_2마리_밸런스.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    balance_sdt_for_2_kills()
