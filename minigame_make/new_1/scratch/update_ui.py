import json

def update_ui():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)
        
    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # choice (공격/대기)
            # Update VS text to show HP
            if 'mockSpec' in node['data']:
                elements = node['data']['mockSpec']['elements']
                if 'vs-divider' in elements:
                    elements['vs-divider']['props']['text'] = "나의 HP: {{player_hp}}   ⚔️   적의 HP: {{enemy_hp}}"
                    elements['vs-divider']['props']['variant'] = "emphasis"
        
        elif node['id'] == 'JmXYql8aC8Thnor1Xcox': # success
            if 'mockSpec' in node['data']:
                elements = node['data']['mockSpec']['elements']
                # Add a text element to show final HP
                elements['victory-hp-info'] = {
                    "type": "Text",
                    "props": {
                        "text": "남은 체력: {{player_hp}}",
                        "variant": "muted"
                    },
                    "children": []
                }
                # Insert it into body-vstack
                if 'body-vstack' in elements:
                    children = elements['body-vstack']['children']
                    if 'victory-subtitle' in children:
                        idx = children.index('victory-subtitle')
                        children.insert(idx + 1, 'victory-hp-info')
                        
        elif node['id'] == 'PkGUAqSomtLEOXEuyofe': # failure
            if 'mockSpec' in node['data']:
                elements = node['data']['mockSpec']['elements']
                # Add a text element to show enemy remaining HP
                elements['defeat-hp-info'] = {
                    "type": "Text",
                    "props": {
                        "text": "적의 남은 체력: {{enemy_hp}}",
                        "variant": "muted"
                    },
                    "children": []
                }
                # Insert it into defeat-body
                if 'defeat-body' in elements:
                    children = elements['defeat-body']['children']
                    if 'defeat-subtitle' in children:
                        idx = children.index('defeat-subtitle')
                        children.insert(idx + 1, 'defeat-hp-info')

    # Also, we need to make sure the ResourceMeter for player HP reflects the real variable.
    # Currently it uses "hp" which is a resource key. We can leave it, but it won't update because we subtract from "player_hp", not "hp" resource.
    # To fix this, we should add "player_hp" and "enemy_hp" to resources, and update the triggers to also use disposal?
    # No, LLE trigger variables are different from resources. 
    # But wait, if we want the top meter to work, it has to be a resource.
    # Let's just rely on the text variable injection for now, it's explicitly what we added.

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    update_ui()
