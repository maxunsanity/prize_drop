import json

def fix_positions_and_gauges():
    with open('전투_2단계_ui변경.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        # Update Choice Node
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o':
            elements = node['data']['mockSpec']['elements']
            
            # 1. Swap positions
            if 'vs-section' in elements:
                elements['vs-section']['children'] = ["player-card", "vs-text", "enemy-card"]
            
            # 2. Fix Gauges using $state binding
            if 'player-hp-bar' in elements:
                elements['player-hp-bar']['props']['value'] = { "$state": "/player_hp_ratio" }
            if 'enemy-hp-bar' in elements:
                elements['enemy-hp-bar']['props']['value'] = { "$state": "/enemy_hp_ratio" }
        
        # 3. Add ratio variables to all mockInitialStates
        if 'mockInitialState' in node.get('data', {}):
            state = node['data']['mockInitialState']
            # Default values for mock
            if 'player_hp' in state and 'player_max_hp' in state:
                state['player_hp_ratio'] = state['player_hp'] / state['player_max_hp']
            else:
                state['player_hp_ratio'] = 1.0
                
            if 'enemy_hp' in state and 'enemy_max_hp' in state:
                state['enemy_hp_ratio'] = state['enemy_hp'] / state['enemy_max_hp']
            else:
                state['enemy_hp_ratio'] = 1.0

    with open('전투_2단계_ui변경.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_positions_and_gauges()
