import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V39.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Edge Routing to prevent 0-reward clamping to 1
for edge in data['edges']:
    # chance-dice logic gives dice, not money, so bypass reward hub
    if edge['id'] == 'e-chance-dice-logic-out':
        edge['target'] = 'n-loop-gate'
    
    # go-gate false branch means unrecognized/no-reward tile, bypass reward hub
    elif edge['id'] == 'e-go-gate-false':
        edge['target'] = 'n-loop-gate'
        
    # 2. Update Stage Data Mapping to be dynamic based on stage_id
    elif edge.get('source') == 'n-table-stage' and edge.get('target') == 'node-entity-stage':
        edge['data']['dataTableRowExpression'] = "stage_id + 1"

# 3. Update Design Name
data['designName'] = "돈_획득_40칸_테이블_연동_V40"

# Save as new filename
with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V40.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V40 generated successfully with edge routing and dynamic stage scaling fixes.")
