import json

def fix_gold_display():
    with open('전투_1단계_2마리_최종검수_v2.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice node
            mock_spec = node['data'].get('mockSpec', {})
            elements = mock_spec.get('elements', {})
            
            # 1. Add meter-gold to elements
            elements['meter-gold'] = {
                "type": "ResourceMeter",
                "props": {
                    "resourceKey": "gold"
                },
                "children": []
            }
            
            # 2. Add meter-gold to top-area children
            if 'top-area' in elements:
                children = elements['top-area'].get('children', [])
                if 'meter-gold' not in children:
                    children.append('meter-gold')
                elements['top-area']['children'] = children

    with open('전투_1단계_2마리_최종검수_v3.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_gold_display()
