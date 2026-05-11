import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V36.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Correct the edge targets that were mistakenly set to "n-dice-check"
# They should point to "n-loop-gate" (the start of the turn loop)
for edge in data['edges']:
    if edge.get('target') == "n-dice-check":
        edge['target'] = "n-loop-gate"

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V37"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V37.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V37 generated successfully with Loop fix.")
