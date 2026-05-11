import json

def fix_motivation_drain():
    with open('전투_1단계_2마리_최종검수_v3.json', 'r') as f:
        data = json.load(f)

    # To ensure they quit after exactly 2 enemies regardless of combat turns:
    # We will put the main motivation drain on the Victory Screen itself.
    # Start: 50
    # Victory 1: -25
    # Victory 2: -25 -> 0 (Dropout)

    for node in data['nodes']:
        if node['id'] == 'JmXYql8aC8Thnor1Xcox': # Victory Screen (Success)
            # This node will now represent the "Fatigue after battle"
            node['data']['frictionScore'] = 5
            if 'sdtEffects' not in node['data']:
                node['data']['sdtEffects'] = {}
            node['data']['sdtEffects']['motivation'] = -20 # Total -25 motivation per victory
        
        elif node['id'] == 'n_emotion_victory': # Emotion
            # Neutralize emotion's motivation gain to keep math simple
            node['data']['sdtEffects']['motivation'] = 0
            
        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # Attack
            # Lower attack friction so they don't drop out DURING the 2nd fight
            node['data']['frictionScore'] = 2
            
        elif node['id'] == 'WOGebJtUG9fTXv1AggCH': # Enemy Counter
            node['data']['frictionScore'] = 2
            node['data']['sdtEffects']['motivation'] = -2

    with open('전투_1단계_2마리_최종검수_v4.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_motivation_drain()
