import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V47.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Fix Jail Success routing to bypass reward hub
found_edge = False
for edge in data['edges']:
    if edge['source'] == 'n-jail-success' and edge['target'] == 'n-accumulate-tile':
        edge['target'] = 'n-loop-gate'
        found_edge = True
        break

if not found_edge:
    # Just in case it was named differently
    for edge in data['edges']:
        if edge['source'] == 'n-jail-success':
            edge['target'] = 'n-loop-gate'

# Update Design Name
data['designName'] = "돈_획득_40칸_테이블_연동_V48"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V48.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V48 generated with jail-success bypassing the 1-won clamp hub.")
