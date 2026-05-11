import json

def fix_emotion_node_schema():
    with open('전투_2단계_심리특화_최종_v5.json', 'r') as f:
        data = json.load(f)

    # The error "reading 'high'" or "reading 'low'" strongly suggests that
    # the 'arousal' property is being used as a key to an undefined object.
    # This often happens if the node is missing a required container or metadata.
    
    # Let's try:
    # 1. Removing sdtEffects from emotion nodes (it might not be supported in this node type)
    # 2. Ensuring all fields from outcome.json are present
    # 3. Setting arousal back to "high" as a baseline

    for node in data['nodes']:
        if node['type'] == 'emotion':
            # Store sdtEffects to move them to a different node if needed, 
            # but for now let's just see if removing them fixes the crash.
            if 'sdtEffects' in node['data']:
                del node['data']['sdtEffects']
            
            # Ensure mandatory fields from outcome.json
            node['data']['description'] = ""
            node['data']['tags'] = []
            node['data']['playerSegment'] = []
            node['data']['arousal'] = "high"
            
            # Ensure needSource and needState are valid strings
            if node['data'].get('needState') == 'thwarted':
                node['data']['needState'] = 'thwart' # Try 'thwart' instead of 'thwarted'? 
                # Actually, in the UI screenshot it was "좌절". 
                # Let's check common LLE values. Usually it's 'satisfied' or 'thwarted'.
                # But let's try 'thwarted' first.

    with open('전투_2단계_심리특화_최종_v6.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_emotion_node_schema()
