import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V53.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Reset all negative SDT effects (especially motivation) to prevent simulation stop
for node in data['nodes']:
    if 'data' in node and 'sdtEffects' in node['data']:
        sdt = node['data']['sdtEffects']
        for key in sdt:
            # If any value is negative, reset it to 0 or a positive value to keep the player motivated
            if isinstance(sdt[key], (int, float)) and sdt[key] < 0:
                sdt[key] = 0
            elif isinstance(sdt[key], str):
                # Handle string-based numbers if any
                try:
                    if float(sdt[key]) < 0:
                        sdt[key] = 0
                except ValueError:
                    pass

# 2. Boost initial motivation in n-init node
for node in data['nodes']:
    if node['id'] == 'n-init':
        attrs = node['data'].get('attributes', [])
        # Add or update motivation to a high value
        found_motivation = False
        for attr in attrs:
            if attr['key'] == 'motivation':
                attr['value'] = '1000' # Give plenty of motivation
                found_motivation = True
                break
        if not found_motivation:
            attrs.append({'key': 'motivation', 'type': 'number', 'value': '1000'})
        
        node['data']['attributes'] = attrs

# 3. Rename to V54
data['designName'] = "돈_획득_40칸_테이블_연동_V54"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V54.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V54 generated with SDT protection and boosted initial motivation.")
