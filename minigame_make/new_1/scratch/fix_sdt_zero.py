import json

def fix_sdt_friction():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        # Force all frictionScore to 0
        node['data']['frictionScore'] = 0
        
        # Force all SDT effects to 0
        node['data']['sdtEffects'] = {
            "autonomy": 0,
            "competence": 0,
            "relatedness": 0,
            "motivation": 0
        }

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_sdt_friction()
