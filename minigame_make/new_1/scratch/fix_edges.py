import json

def fix_edges_and_conditions():
    with open('전투_1단계_2마리_수정본.json', 'r') as f:
        data = json.load(f)

    # 1. Set explicit conditions to avoid engine defaults
    for node in data['nodes']:
        if node['id'] == 'xbB65S1FVTQsKviTmpCo': # 적 사망? Gate
            # Always win for now to test edges, or use random
            node['data']['condition'] = "rand.d100() < 80" # 80% chance of enemy dying
        elif node['id'] == 'dbClGLpmQ22hftQwXs3M': # 플레이어 사망? Gate
            node['data']['condition'] = "rand.d100() < 10" # 10% chance of player dying

    # 2. Check for any duplicate or conflicting edges
    # The user said "If I attack, I immediately lose".
    # This means Attack -> Gate -> Defeat.
    # Let's check if lxkO9hDma1yfobSxAcnR (Attack) has an edge directly to PkGUAqSomtLEOXEuyofe (Defeat).
    data['edges'] = [e for e in data['edges'] if not (e.get('source') == 'lxkO9hDma1yfobSxAcnR' and e.get('target') == 'PkGUAqSomtLEOXEuyofe')]
    
    # Also ensure lxkO9hDma1yfobSxAcnR goes to xbB65S1FVTQsKviTmpCo
    has_attack_to_gate = False
    for e in data['edges']:
        if e.get('source') == 'lxkO9hDma1yfobSxAcnR' and e.get('target') == 'xbB65S1FVTQsKviTmpCo':
            has_attack_to_gate = True
            break
    
    if not has_attack_to_gate:
        data['edges'].append({
            "id": "fix_edge_attack_to_gate",
            "source": "lxkO9hDma1yfobSxAcnR",
            "target": "xbB65S1FVTQsKviTmpCo",
            "type": "exec",
            "sourceHandle": "bottom",
            "targetHandle": "top"
        })

    # 3. Double check the Gate branches
    for edge in data['edges']:
        if edge.get('source') == 'xbB65S1FVTQsKviTmpCo':
            if edge.get('target') == 'n_emotion_victory':
                edge['data']['gateBranch'] = "true"
                edge['sourceHandle'] = "right"
            elif edge.get('target') == 'WOGebJtUG9fTXv1AggCH':
                edge['data']['gateBranch'] = "false"
                edge['sourceHandle'] = "bottom"
        
        if edge.get('source') == 'dbClGLpmQ22hftQwXs3M':
            if edge.get('target') == 'PkGUAqSomtLEOXEuyofe':
                edge['data']['gateBranch'] = "true"
                edge['sourceHandle'] = "right"
            elif edge.get('target') == 'HIOoyUfUBzgoZfaJbe2o':
                edge['data']['gateBranch'] = "false"
                edge['sourceHandle'] = "top"

    with open('전투_1단계_2마리_최종검수.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_edges_and_conditions()
