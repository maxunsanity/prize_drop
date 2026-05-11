import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V52.json', 'r', encoding='utf-8') as f:
    json_str = f.read()

# 1. Global Replace for special tiles to use global variables instead of entities
# This resolves the "Unknown Name" errors for tile_jail, tile_tax, etc.
replacements = {
    'tile_jail.tax_fixed_value': 'jail_fine',
    'tile_tax_low.tax_fixed_value': 'tax_low_value',
    'tile_tax_high.tax_fixed_value': 'tax_high_value',
    'tile_go.base_reward': 'go_reward',
    'tile_park.base_reward': 'park_reward',
    'tile_community.base_reward': 'community_reward'
}

for old, new in replacements.items():
    json_str = json_str.replace(old, new)

data = json.loads(json_str)

# 2. Register these new variables in n-init and Global Attributes
new_vars = {
    'jail_fine': '4',         # Failing jail fine
    'tax_low_value': '2',     # Tax Low
    'tax_high_value': '4',    # Tax High
    'go_reward': '2',         # Passing GO reward
    'park_reward': '10',      # Parking reward
    'community_reward': '5'   # Community reward
}

# Update n-init
for node in data['nodes']:
    if node['id'] == 'n-init':
        attrs = node['data'].get('attributes', [])
        for var, val in new_vars.items():
            if not any(a['key'] == var for a in attrs):
                attrs.append({'key': var, 'type': 'number', 'value': val})
        node['data']['attributes'] = attrs

# Update Global Attributes
if 'attributes' not in data: data['attributes'] = []
for var, val in new_vars.items():
    if not any(a['key'] == var for a in data['attributes']):
        data['attributes'].append({'key': var, 'type': 'number', 'value': val})

# 3. Final Polish: Rename to V53
data['designName'] = "돈_획득_40칸_테이블_연동_V53"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V53.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V53 generated with all special tile entities migrated to global variables.")
