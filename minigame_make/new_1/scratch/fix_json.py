import json

with open('전투_2단계.json', 'r') as f:
    data = json.load(f)

for node in data['nodes']:
    # Fix SDT effects
    if 'sdtEffects' in node.get('data', {}):
        sdt = node['data']['sdtEffects']
        sdt.setdefault('autonomy', 0)
        sdt.setdefault('competence', 0)
        sdt.setdefault('relatedness', 0)
        sdt.setdefault('motivation', 0)
    elif node['type'] in ['gate', 'choice', 'success', 'failure', 'action', 'reward']:
        node['data']['sdtEffects'] = {
            'autonomy': 0,
            'competence': 0,
            'relatedness': 0,
            'motivation': 0
        }
        if node['type'] == 'choice':
            node['data']['sdtEffects']['competence'] = 5
            node['data']['sdtEffects']['motivation'] = 20
        elif node['type'] == 'success':
            node['data']['sdtEffects']['competence'] = 20
            node['data']['sdtEffects']['motivation'] = 30
            
    # Fix frictionScore
    if node['type'] == 'gate':
        node['data']['frictionScore'] = 0

with open('전투_2단계_fix.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

