import json

def ultimate_cleanup():
    with open('전투_1단계_2마리_최종검수_v6.json', 'r') as f:
        data = json.load(f)

    keep_keys = {'gold', 'score'}
    remove_keys = {'hp', 'dice', 'item', 'LjFFeQfJibzToAWeOUs9', 'player_hp', 'enemy_hp'}

    # 1. Cleanup Resources Section
    if 'resources' in data:
        data['resources'] = [r for r in data['resources'] if r['key'] in keep_keys]

    # 2. Cleanup Nodes (MockSpecs and Elements)
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if not mock_spec:
            continue
            
        elements = mock_spec.get('elements', {})
        elements_to_delete = []

        # Find elements to delete
        for el_id, el in elements.items():
            res_key = el.get('props', {}).get('resourceKey')
            if res_key in remove_keys:
                elements_to_delete.append(el_id)
            
            # Special case for TabBarButtons or specific IDs
            if el_id in ['meter-hp', 'meter-dice', 'meter-score', 'meter-gold']:
                # Keep gold and score meters, delete others
                if 'gold' not in el_id and 'score' not in el_id:
                    elements_to_delete.append(el_id)
            
            if any(k in el_id for k in ['hp', 'dice', 'item', 'weapon']):
                 if not any(keep in el_id for keep in ['gold', 'score']):
                    elements_to_delete.append(el_id)

        # Remove elements
        for el_id in set(elements_to_delete):
            if el_id in elements:
                del elements[el_id]

        # Update children references in remaining elements
        for el_id, el in elements.items():
            if 'children' in el and isinstance(el['children'], list):
                el['children'] = [c for c in el['children'] if c not in elements_to_delete]

    with open('전투_1단계_2마리_최종검수_v7.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    ultimate_cleanup()
