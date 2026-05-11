import json

with open('json-render 테스트.json', 'r') as f:
    render_data = json.load(f)

# find the mockSpec in render data
mock_spec = None
for n in render_data['nodes']:
    if 'mockSpec' in n.get('data', {}):
        if 'battle-body' in n['data']['mockSpec']['elements']:
            mock_spec = n['data']['mockSpec']
            break

with open('전투_2단계.json', 'r') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # choice node
        # Replace the mockSpec entirely
        node['data']['mockSpec'] = mock_spec
        
        # Now fix the variables and buttons in the new mockSpec
        elements = node['data']['mockSpec']['elements']
        
        # Top Area resources
        if 'res-gold' in elements: elements['res-gold']['props']['resourceKey'] = 'gold'
        if 'res-item' in elements: elements['res-item']['props']['resourceKey'] = 'dice' # changed to dice
        if 'res-weapon' in elements: elements['res-weapon']['props']['resourceKey'] = 'item' # changed to item
        
        # Enemy Info
        if 'enemy-name' in elements: elements['enemy-name']['props']['text'] = "🐉 암흑 드래곤"
        if 'enemy-level' in elements: elements['enemy-level']['props']['text'] = "Lv. 5"
        if 'enemy-hp-val' in elements: elements['enemy-hp-val']['props']['text'] = "{{enemy_hp}} / 50"
        if 'enemy-hp-bar' in elements: elements['enemy-hp-bar']['props']['value'] = "{{enemy_hp_ratio}}"
        
        # Player Info
        if 'player-name' in elements: elements['player-name']['props']['text'] = "🧙 용사"
        if 'player-level' in elements: elements['player-level']['props']['text'] = "Lv. 1"
        if 'player-hp-val' in elements: elements['player-hp-val']['props']['text'] = "{{player_hp}} / 100"
        if 'player-hp-bar' in elements: elements['player-hp-bar']['props']['value'] = "{{player_hp_ratio}}"
        
        # Remove MP row and bar as we don't have MP
        if 'player-card' in elements:
            card_children = elements['player-card']['children']
            if 'player-mp-row' in card_children: card_children.remove('player-mp-row')
            if 'player-mp-bar' in card_children: card_children.remove('player-mp-bar')
            
        # Buttons
        # The mockSpec has 'attack-btn', 'item-btn', 'flee-btn'
        if 'attack-btn' in elements:
            elements['attack-btn']['props']['targetNodeId'] = 'lxkO9hDma1yfobSxAcnR'
        if 'item-btn' in elements: # Let's reuse item btn for wait
            elements['item-btn']['props']['label'] = "🛡️ 대기"
            elements['item-btn']['props']['targetNodeId'] = 'fo2aXM16YcyoQpjqlom6'
        
    elif node['id'] == 'n_init':
        # Add ratio initializations
        attrs = node['data']['attributes']
        keys = [a['key'] for a in attrs]
        if 'player_hp_ratio' not in keys: attrs.append({"key": "player_hp_ratio", "value": "1"})
        if 'enemy_hp_ratio' not in keys: attrs.append({"key": "enemy_hp_ratio", "value": "1"})

    elif node['id'] == 'trig_player_atk':
        attrs = node['data']['attributes']
        keys = [a['key'] for a in attrs]
        if 'enemy_hp_ratio' not in keys: attrs.append({"key": "enemy_hp_ratio", "value": "enemy_hp / 50"})

    elif node['id'] == 'trig_enemy_atk':
        attrs = node['data']['attributes']
        keys = [a['key'] for a in attrs]
        if 'player_hp_ratio' not in keys: attrs.append({"key": "player_hp_ratio", "value": "player_hp / 100"})

with open('전투_2단계.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

