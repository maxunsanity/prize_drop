import json

def add_turn_count():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        # 1. Initialize turn_count in n_init
        if node['id'] == 'n_init':
            attrs = node['data']['attributes']
            keys = [a['key'] for a in attrs]
            if 'turn_count' not in keys:
                attrs.append({"key": "turn_count", "value": "0"})
                
            if 'mockInitialState' in node.get('data', {}):
                node['data']['mockInitialState']['turn_count'] = 0

        # 2. Increment turn_count in trig_calc_p_dmg
        elif node['id'] == 'trig_calc_p_dmg':
            attrs = node['data']['attributes']
            keys = [a['key'] for a in attrs]
            if 'turn_count' not in keys:
                attrs.append({"key": "turn_count", "value": "turn_count + 1"})

        # 3. Display turn_count in success node
        elif node['id'] == 'JmXYql8aC8Thnor1Xcox':
            elements = node['data']['mockSpec']['elements']
            
            # Find the subtitle or create a new row for details
            if 'victory-subtitle' in elements:
                elements['victory-subtitle']['props']['text'] = "대단해요! 총 {{turn_count}}번의 맹공으로 적을 산산조각 냈습니다!"
                elements['victory-subtitle']['props']['variant'] = "subtitle"
                
            # Optionally add player HP left detail
            if 'victory-hp-left' not in elements:
                elements['victory-hp-left'] = {
                    "type": "Text",
                    "props": {
                        "text": "남은 나의 체력: {{player_hp}} / {{player_max_hp}}",
                        "variant": "muted"
                    },
                    "children": []
                }
                if 'body-vstack' in elements:
                    children = elements['body-vstack']['children']
                    if 'victory-subtitle' in children:
                        idx = children.index('victory-subtitle')
                        if 'victory-hp-left' not in children:
                            children.insert(idx + 1, 'victory-hp-left')

    # Also add turn_count to mockInitialState of success node so it renders fine
    for node in data['nodes']:
        if 'mockInitialState' in node.get('data', {}):
            node['data']['mockInitialState']['turn_count'] = 4

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    add_turn_count()
