import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V27.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Deduplicate stage entity attributes
for node in data['nodes']:
    if node['id'] == 'node-entity-stage':
        seen = set()
        new_attrs = []
        for attr in node['data']['attributes']:
            if attr['key'] not in seen:
                new_attrs.append(attr)
                seen.add(attr['key'])
        node['data']['attributes'] = new_attrs

# 2. Check for duplicate data edge mappings
for edge in data['edges']:
    if edge.get('source') == 'n-table-stage':
        seen_keys = set()
        new_mappings = []
        for m in edge['data']['tableEntityAttributeMappings']:
            if m['targetKey'] not in seen_keys:
                new_mappings.append(m)
                seen_keys.add(m['targetKey'])
        edge['data']['tableEntityAttributeMappings'] = new_mappings

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V28"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V28.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V28 generated successfully.")
