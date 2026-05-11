import json

def restore_working_emotion_config():
    with open('전투_2단계_심리특화_최종_v6.json', 'r') as f:
        data = json.load(f)

    # 1. Fix the emotion nodes to use 'thwarted' and ensure all fields are present
    # 2. Add 'data' object to the edges leading to emotion nodes
    
    for node in data['nodes']:
        if node['type'] == 'emotion':
            node['data']['needState'] = 'thwarted' if 'frustration' in node['id'] or 'micro' in node['id'] else 'satisfied'
            node['data']['arousal'] = "high"
            node['data']['frictionScore'] = 0
            # Adding sdtEffects back because Phase 1 had them and it worked!
            node['data']['sdtEffects'] = {
                "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0
            }

    for edge in data['edges']:
        if edge.get('target') in ['n_micro_frustration', 'n_outcome_emotion', 'n_outcome_frustration']:
            if 'data' not in edge:
                edge['data'] = {}
            edge['data']['animated'] = False

    with open('전투_2단계_심리특화_최종_v7.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    restore_working_emotion_config()
