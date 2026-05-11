import json

def fix_buttons():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice node
            elements = node['data']['mockSpec']['elements']
            
            # Update targetNodeId correctly
            if 'btn-attack' in elements:
                elements['btn-attack']['props']['targetNodeId'] = 'lxkO9hDma1yfobSxAcnR'
                
            if 'btn-item' in elements:
                elements['btn-item']['props']['label'] = "🛡️ 대기"
                elements['btn-item']['props']['targetNodeId'] = 'fo2aXM16YcyoQpjqlom6'
                
            # Remove flee button from the layout
            if 'btn-skill-row' in elements:
                children = elements['btn-skill-row']['children']
                if 'btn-flee' in children:
                    children.remove('btn-flee')
                    
    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_buttons()
