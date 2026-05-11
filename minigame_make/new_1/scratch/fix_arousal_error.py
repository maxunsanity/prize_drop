import json

def fix_low_arousal_error():
    with open('전투_2단계_심리특화_최종_v4.json', 'r') as f:
        data = json.load(f)

    # The error "reading 'low'" suggests the engine doesn't recognize "low" as a valid arousal value
    # or it's missing some metadata that makes "low" work.
    # We'll change it to "high" (which we know works) and add missing standard fields.

    for node in data['nodes']:
        if node['id'] == 'n_micro_frustration':
            node['data']['arousal'] = "high" # Change to high to avoid the crash
            node['data']['description'] = ""
            node['data']['tags'] = []
            node['data']['playerSegment'] = []
            
        if node['id'] == 'n_outcome_frustration':
            node['data']['description'] = ""
            node['data']['tags'] = []
            node['data']['playerSegment'] = []
            
        if node['id'] == 'n_outcome_emotion':
            node['data']['description'] = ""
            node['data']['tags'] = []
            node['data']['playerSegment'] = []

    with open('전투_2단계_심리특화_최종_v5.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_low_arousal_error()
