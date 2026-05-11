import json

def fix_gold_persistence():
    with open('전투_3단계_성장특화_최종_v2.json', 'r') as f:
        data = json.load(f)

    # 1. Ensure 'gold' is initialized only ONCE at the entry
    # and not reset by any other node.
    
    # Check n_init_player
    for node in data['nodes']:
        if node['id'] == 'n_init_player':
            for attr in node['data'].get('attributes', []):
                if attr['key'] == 'gold':
                    # Ensure it's initialized to a starting value (e.g. 0 or character.gold)
                    # But make sure this node is NOT called in a loop.
                    pass

    # 2. Remove redundant Reward nodes for Gold to prevent conflicts
    # We will use the 'trig_kill_reward' (Trigger) to handle gold addition.
    reward_node_id = 'n_gold_reward'
    data['nodes'] = [n for n in data['nodes'] if n['id'] != reward_node_id]
    
    # Remove edges related to the reward node
    data['edges'] = [e for e in data['edges'] if e.get('source') != reward_node_id and e.get('target') != reward_node_id]

    # 3. Fix trig_kill_reward to properly ADD gold
    for node in data['nodes']:
        if node['id'] == 'trig_kill_reward':
            for attr in node['data'].get('attributes', []):
                if attr['key'] == 'gold':
                    attr['value'] = "gold + enemy_gold_reward"
        
        # 4. Check for any other node that might be resetting gold
        if 'attributes' in node['data']:
            for attr in node['data']['attributes']:
                if attr['key'] == 'gold' and node['id'] not in ['n_init_player', 'trig_kill_reward', 'trig_boss_reward']:
                    # This node is resetting gold! Let's remove that attribute.
                    node['data']['attributes'] = [a for a in node['data']['attributes'] if a['key'] != 'gold']

    # 5. Fix Mock Specs: Ensure all resource meters use 'gold'
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if mock_spec:
            elements = mock_spec.get('elements', {})
            for el in elements.values():
                if el.get('props', {}).get('resourceKey') == 'player_gold':
                    el['props']['resourceKey'] = 'gold'

    with open('전투_3단계_성장특화_최종_v3.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_gold_persistence()
