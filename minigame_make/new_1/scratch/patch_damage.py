import json

with open('전투_2단계.json', 'r') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['id'] == 'n_init':
        # Check if 'damage' is already there
        keys = [attr['key'] for attr in node['data']['attributes']]
        if 'damage' not in keys:
            node['data']['attributes'].append({"key": "damage", "value": "0"})

with open('전투_2단계.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

