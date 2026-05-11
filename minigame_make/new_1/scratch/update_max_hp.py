import json

def update_max_hp():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        # 1. Initialize max_hp variables
        if node['id'] == 'n_init':
            attrs = node['data']['attributes']
            keys = [a['key'] for a in attrs]
            if 'player_max_hp' not in keys:
                attrs.append({"key": "player_max_hp", "value": "100"})
            if 'enemy_max_hp' not in keys:
                attrs.append({"key": "enemy_max_hp", "value": "50"})
                
        # 2. Update UI text in Choice node
        elif node['id'] == 'HIOoyUfUBzgoZfaJbe2o':
            elements = node['data']['mockSpec']['elements']
            if 'enemy-hp-val' in elements:
                elements['enemy-hp-val']['props']['text'] = "{{enemy_hp}} / {{enemy_max_hp}}"
            if 'player-hp-val' in elements:
                elements['player-hp-val']['props']['text'] = "{{player_hp}} / {{player_max_hp}}"
                
        # 3. Update ratio calculations
        elif node['id'] == 'trig_player_atk':
            for attr in node['data']['attributes']:
                if attr['key'] == 'enemy_hp_ratio':
                    attr['value'] = "(enemy_hp - damage) / enemy_max_hp"
                    
        elif node['id'] == 'trig_enemy_atk':
            for attr in node['data']['attributes']:
                if attr['key'] == 'player_hp_ratio':
                    attr['value'] = "(player_hp - damage) / player_max_hp"

    # 4. Update mockInitialState to include max_hp so the UI shows up properly in mock view
    for node in data['nodes']:
        if 'mockInitialState' in node.get('data', {}):
            node['data']['mockInitialState']['player_max_hp'] = 100
            node['data']['mockInitialState']['enemy_max_hp'] = 50

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    update_max_hp()
