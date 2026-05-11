import json

def fix_restart_edge():
    with open('전투_1단계_2마리_최종검수.json', 'r') as f:
        data = json.load(f)

    # The "Find Enemy" button in JmXYql8aC8Thnor1Xcox (Success Node) has targetNodeId: HIOoyUfUBzgoZfaJbe2o.
    # We need a direct edge from JmXYql8aC8Thnor1Xcox to HIOoyUfUBzgoZfaJbe2o to make it work.
    
    # 1. Remove the intermediate n_win_end node and its edges
    data['nodes'] = [n for n in data['nodes'] if n['id'] != 'n_win_end']
    data['edges'] = [e for e in data['edges'] if e.get('source') != 'n_win_end' and e.get('target') != 'n_win_end']

    # 2. Add direct restart edge from Victory screen (Success) to Choice node
    # Remove any existing edges from Victory screen to avoid duplicates
    data['edges'] = [e for e in data['edges'] if not (e.get('source') == 'JmXYql8aC8Thnor1Xcox' and e.get('type') == 'exec')]

    data['edges'].append({
        "id": "edge_victory_restart",
        "source": "JmXYql8aC8Thnor1Xcox",
        "target": "HIOoyUfUBzgoZfaJbe2o",
        "type": "exec",
        "sourceHandle": "bottom",
        "targetHandle": "left", # Connect to the left side of choice to avoid overlapping with entry
        "data": {
            "label": "적 찾기 (다시 시작)"
        }
    })

    # 3. Ensure the button's targetNodeId matches
    for node in data['nodes']:
        if node['id'] == 'JmXYql8aC8Thnor1Xcox':
            # Check mockSpec
            mock_spec = node['data'].get('mockSpec', {})
            elements = mock_spec.get('elements', {})
            if 'find-enemy-btn' in elements:
                elements['find-enemy-btn']['props']['targetNodeId'] = "HIOoyUfUBzgoZfaJbe2o"

    with open('전투_1단계_2마리_최종검수_v2.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_restart_edge()
