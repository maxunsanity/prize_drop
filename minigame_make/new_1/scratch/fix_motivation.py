import json

def fix_initial_motivation():
    with open('전투_1단계_2마리_밸런스.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        if node['id'] == '3dMvnKaXtRBlG9qJOqe0': # Entry node
            if 'sdtEffects' not in node['data']:
                node['data']['sdtEffects'] = {}
            # Give the player 50 motivation to start the game!
            # Otherwise they start with 0 and instantly drop out when they take an action with friction.
            node['data']['sdtEffects']['motivation'] = 50
            node['data']['sdtEffects']['autonomy'] = 0
            node['data']['sdtEffects']['competence'] = 0
            node['data']['sdtEffects']['relatedness'] = 0
            node['data']['frictionScore'] = 0

    with open('전투_1단계_2마리_수정본.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_initial_motivation()
