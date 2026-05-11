import json

with open('전투_2단계.json', 'r') as f:
    data = json.load(f)

# check duplicate nodes
node_ids = set()
for n in data['nodes']:
    if n['id'] in node_ids:
        print(f"Duplicate node: {n['id']}")
    node_ids.add(n['id'])

# check duplicate edges
edge_ids = set()
for e in data['edges']:
    if e['id'] in edge_ids:
        print(f"Duplicate edge: {e['id']}")
    edge_ids.add(e['id'])

# check dangling edges
for e in data['edges']:
    if e['source'] not in node_ids:
        print(f"Dangling source {e['source']} in edge {e['id']}")
    if e['target'] not in node_ids:
        print(f"Dangling target {e['target']} in edge {e['id']}")

print("Validation complete.")
