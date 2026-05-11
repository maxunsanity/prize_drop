import json
import uuid

def add_gauges():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)
        
    # 1. Update resources list
    # Let's change the old 'hp' resource to 'player_hp' and add a new 'enemy_hp'
    for res in data.get('resources', []):
        if res['key'] == 'hp':
            res['key'] = 'player_hp'
            res['name'] = '나의 HP'
            
    # Add enemy_hp
    data['resources'].append({
        "id": "enemy_hp_" + str(uuid.uuid4())[:8],
        "key": "enemy_hp",
        "name": "적의 HP",
        "color": "#990000",
        "icon": "skull",
        "order": 0
    })
    
    # 2. Update UI elements to use ResourceMeter
    for node in data['nodes']:
        if 'mockSpec' in node.get('data', {}):
            elements = node['data']['mockSpec']['elements']
            
            # Choice node
            if node['id'] == 'HIOoyUfUBzgoZfaJbe2o':
                # Revert vs-divider text back to VS
                if 'vs-divider' in elements:
                    elements['vs-divider']['props']['text'] = "— VS —"
                    elements['vs-divider']['props']['variant'] = "muted"
                
                # Update top-area to contain both HP meters if not there
                if 'meter-hp' in elements:
                    elements['meter-hp']['props']['resourceKey'] = 'player_hp'
                
                # Add enemy-hp meter
                elements['meter-enemy-hp'] = {
                    "type": "ResourceMeter",
                    "props": {
                        "resourceKey": "enemy_hp"
                    },
                    "children": []
                }
                
                # Put enemy-hp in top-area
                if 'top-area' in elements:
                    if 'meter-enemy-hp' not in elements['top-area']['children']:
                        elements['top-area']['children'].insert(1, 'meter-enemy-hp')

            # Success node
            elif node['id'] == 'JmXYql8aC8Thnor1Xcox':
                if 'top-hp' in elements:
                    elements['top-hp']['props']['resourceKey'] = 'player_hp'
                
                # Remove victory-hp-info text we added earlier
                if 'victory-hp-info' in elements:
                    del elements['victory-hp-info']
                if 'body-vstack' in elements and 'victory-hp-info' in elements['body-vstack']['children']:
                    elements['body-vstack']['children'].remove('victory-hp-info')

            # Failure node
            elif node['id'] == 'PkGUAqSomtLEOXEuyofe':
                if 'defeat-hp-meter' in elements:
                    elements['defeat-hp-meter']['props']['resourceKey'] = 'player_hp'
                
                elements['defeat-enemy-hp-meter'] = {
                    "type": "ResourceMeter",
                    "props": {
                        "resourceKey": "enemy_hp"
                    },
                    "children": []
                }
                
                # Add enemy meter to top area
                if 'defeat-top-area' in elements:
                    if 'defeat-enemy-hp-meter' not in elements['defeat-top-area']['children']:
                        elements['defeat-top-area']['children'].insert(1, 'defeat-enemy-hp-meter')
                
                # Remove defeat-hp-info text we added earlier
                if 'defeat-hp-info' in elements:
                    del elements['defeat-hp-info']
                if 'defeat-body' in elements and 'defeat-hp-info' in elements['defeat-body']['children']:
                    elements['defeat-body']['children'].remove('defeat-hp-info')

    # Also update mockInitialState
    for node in data['nodes']:
        if 'mockInitialState' in node.get('data', {}):
            state = node['data']['mockInitialState']
            if 'hp' in state:
                state['player_hp'] = state.pop('hp')
            # Initialize enemy_hp in mock
            if 'enemy_hp' not in state:
                state['enemy_hp'] = 50

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    add_gauges()
