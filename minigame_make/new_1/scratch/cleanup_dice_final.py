import json

def cleanup_dice_resources_final():
    # Use the file with emotions as the base
    try:
        with open('주사위_게임_쉬운버전_감정이식_최종.json', 'r') as f:
            data = json.load(f)
    except:
        with open('주사위_게임_쉬운버전_(0429).json', 'r') as f:
            data = json.load(f)

    # 1. Clean up 'resources' array
    keep_resource_keys = ['gold', 'dice']
    if 'resources' in data:
        data['resources'] = [r for r in data['resources'] if r['key'] in keep_resource_keys]

    # 2. Clean up 'attributes' in all nodes
    # Keep gold, dice, and logic variables (bet_high, roll, etc.)
    keep_attr_keys = ['gold', 'dice', 'bet_high', 'roll', 'total_games', 'win_rate']
    for node in data['nodes']:
        if 'attributes' in node['data']:
            node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] in keep_attr_keys]

    # 3. Clean up UI MockSpecs
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            to_remove = []
            for eid, el in elements.items():
                res_key = el.get('props', {}).get('resourceKey')
                # If it's a ResourceMeter for a deleted resource
                if res_key and res_key not in keep_resource_keys:
                    to_remove.append(eid)
                # If it's a text/button referring to deleted stats (hp, exp, etc.)
                text = el.get('props', {}).get('text', '')
                if any(k in text.lower() for k in ['hp', '경험치', '체력', '무기', '아이템', 'apple']):
                    # But don't remove win_rate or total_games
                    if not any(keep in text.lower() for keep in ['성공률', '플레이']):
                        to_remove.append(eid)
            
            # Remove marked elements
            for rid in set(to_remove):
                if rid in elements: del elements[rid]
            
            # Remove from children lists
            for el in elements.values():
                if 'children' in el and isinstance(el['children'], list):
                    el['children'] = [c for c in el['children'] if c not in to_remove]

    # 4. Final fix for edges (Ensure stability)
    for edge in data['edges']:
        if 'data' not in edge: edge['data'] = {}
        edge['data']['animated'] = False

    with open('주사위_게임_쉬운버전_자원정리_최종.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    cleanup_dice_resources_final()
