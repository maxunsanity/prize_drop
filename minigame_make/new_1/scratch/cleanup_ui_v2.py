import json

def cleanup_ui():
    with open('전투_2단계_ui변경.json', 'r') as f:
        data = json.load(f)

    # 1. Update Choice Node (HIOoyUfUBzgoZfaJbe2o)
    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o':
            elements = node['data']['mockSpec']['elements']
            
            # Remove redundant HP from top-area
            if 'top-area' in elements:
                children = elements['top-area']['children']
                for hp_key in ['res-player-hp', 'res-enemy-hp']:
                    if hp_key in children:
                        children.remove(hp_key)
            
            # Remove MP from player-card
            if 'player-card' in elements:
                children = elements['player-card']['children']
                for mp_key in ['player-mp-label-row', 'player-mp-bar']:
                    if mp_key in children:
                        children.remove(mp_key)
            
            # Simplify HP bars (use ratio variables)
            if 'player-hp-bar' in elements:
                elements['player-hp-bar']['props']['value'] = "{{player_hp_ratio}}"
            if 'enemy-hp-bar' in elements:
                elements['enemy-hp-bar']['props']['value'] = "{{enemy_hp_ratio}}"
            
            # Show HP text properly
            if 'player-hp-val' in elements:
                elements['player-hp-val']['props']['text'] = "{{player_hp}} / {{player_max_hp}}"
            if 'enemy-hp-val' in elements:
                elements['enemy-hp-val']['props']['text'] = "{{enemy_hp}} / {{enemy_max_hp}}"
                
            # Delete MP element definitions to keep it clean
            keys_to_delete = [
                'res-player-hp', 'res-enemy-hp',
                'player-mp-label-row', 'player-mp-bar', 'player-mp-label', 'player-mp-spacer', 'player-mp-val'
            ]
            for key in keys_to_delete:
                if key in elements:
                    del elements[key]

    with open('전투_2단계_ui변경.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    cleanup_ui()
