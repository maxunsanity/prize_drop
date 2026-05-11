import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V40.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Initialize stage_id in global attributes
# If attributes list doesn't exist or is empty, create it.
if 'attributes' not in data or not data['attributes']:
    data['attributes'] = []

# Add stage_id if it doesn't exist
has_stage_id = False
for attr in data['attributes']:
    if attr['key'] == 'stage_id':
        has_stage_id = True
        break

if not has_stage_id:
    data['attributes'].append({'key': 'stage_id', 'type': 'number', 'value': '1'})

# 2. Update Design Name
data['designName'] = "돈_획득_40칸_테이블_연동_V41"

# Save as new filename
with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V41.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V41 generated successfully with stage_id initialization.")
