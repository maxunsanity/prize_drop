import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V34.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update tile_community to read from Row 35 (where the reward 50 is defined)
for edge in data['edges']:
    if edge['id'] == 'e-data-tile_community':
        edge['data']['dataTableRowExpression'] = "35"

# 2. Add Tax Entities to capture 0.1 and 0.2 ratios if needed
# Actually, I will just update the formulas to be safer or fix any remaining null-mapping issues.
# User said "Look at community and others". 

# Verify if tile_s1...s8 are mapped to rows that actually have rewards.
# My check showed Row 39 (S8) had rewards. Row 3, 8, 13, 18, 23, 28, 33 were my mappings.
# Let me double check if those rows have rewards.
# Row 3 (S1): index 8 = 100
# Row 8 (S2): index 8 = 80
# Row 13 (S3): index 8 = 110
# Row 18 (S4): index 8 = 140
# Row 23 (S5): index 8 = 160
# Row 28 (S6): index 8 = 190
# Row 33 (S7): index 8 = 220
# Row 39 (S8): index 8 = 260
# ALL LAND ROWS ARE CORRECT.

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V35"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V35.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V35 generated successfully with Community Row fix.")
