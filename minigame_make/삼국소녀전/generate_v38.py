import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V37.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update n-tax-logic to remove dice_count multiplier for percentage-based tax
for node in data['nodes']:
    if node['id'] == 'n-tax-logic':
        for attr in node['data']['attributes']:
            if attr['key'] == 'money':
                # Tax is simply 10% (0.1) of current money. No dice_count multiplication!
                attr['value'] = "money - (money * 0.1)"

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V38"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V38.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V38 generated successfully with reasonable Tax fix.")
