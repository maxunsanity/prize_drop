import json

def fix_sdt_dynamics_and_errors():
    with open('전투_2단계_수정.json', 'r') as f:
        data = json.load(f)

    # 1. Map invalid needState strings to standard LLE keys
    # and add dynamic SDT effects for a better graph
    for node in data['nodes']:
        # Fix Emotion Nodes
        if node['type'] == 'emotion':
            state = node['data'].get('needState')
            if state == 'frustrated':
                node['data']['needState'] = 'thwarted'
            elif state == 'building':
                node['data']['needState'] = 'accumulated'
            
            # Ensure arousal is a valid string
            node['data']['arousal'] = "high"
            
            # Remove sdtEffects from emotion nodes as they might cause issues 
            # and they are just emotional results.
            if 'sdtEffects' in node['data']:
                del node['data']['sdtEffects']

        # 2. Add Dynamic SDT Effects to Combat Nodes for Graph Visibility
        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # 공격 실행
            node['data']['sdtEffects'] = {"autonomy": 10, "competence": 5, "motivation": -2, "relatedness": 0}
            node['data']['frictionScore'] = 2
            
        elif node['id'] == 'WOGebJtUG9fTXv1AggCH': # 적 반격
            node['data']['sdtEffects'] = {"competence": -15, "motivation": -10, "autonomy": -2, "relatedness": 0}
            node['data']['frictionScore'] = 15
            
        elif node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice
            node['data']['sdtEffects'] = {"autonomy": 15, "motivation": 5, "competence": 2, "relatedness": 0}
            node['data']['frictionScore'] = 1

        elif node['type'] == 'reward' and '승리' in node['data'].get('label', ''):
            node['data']['sdtEffects'] = {"competence": 20, "motivation": -25, "autonomy": 5, "relatedness": 0}
            node['data']['frictionScore'] = 5

    # 3. Fix Edges (Ensure data object exists)
    for edge in data['edges']:
        if 'data' not in edge:
            edge['data'] = {}
        if 'animated' not in edge['data']:
            edge['data']['animated'] = False

    with open('전투_2단계_수정_완료.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_sdt_dynamics_and_errors()
