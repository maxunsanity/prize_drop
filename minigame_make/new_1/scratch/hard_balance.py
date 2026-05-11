import json

def update_hard_balance():
    with open('전투_1단계_2마리_최종검수_v4.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        if node['id'] == 'WOGebJtUG9fTXv1AggCH': # 적 반격 (Counter-attack)
            # Increase friction and motivation drain significantly
            node['data']['frictionScore'] = 12
            if 'sdtEffects' not in node['data']:
                node['data']['sdtEffects'] = {}
            node['data']['sdtEffects']['motivation'] = -8 # Total -20 per hit
            node['data']['sdtEffects']['competence'] = -5 # Feeling incompetent when hit
            
        elif node['id'] == 'JmXYql8aC8Thnor1Xcox': # 승리 화면 (Victory)
            node['data']['frictionScore'] = 5
            node['data']['sdtEffects']['motivation'] = -15 # Total -20 per victory
            
        elif node['id'] == 'n_emotion_victory': # 성취감 (Emotion)
            node['data']['sdtEffects']['motivation'] = 5 # Small boost to feel good before fatigue
            
        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # 공격 실행 (Attack)
            node['data']['frictionScore'] = 2
            node['data']['sdtEffects']['motivation'] = 0

    with open('전투_1단계_2마리_최종검수_v5.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    update_hard_balance()
