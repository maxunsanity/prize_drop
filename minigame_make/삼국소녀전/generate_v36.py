import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V35.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Change n-tax-logic to a state update node that directly modifies 'money'
# and disconnect it from the reward hub to prevent the +1 reward clamp.
for node in data['nodes']:
    if node['id'] == 'n-tax-logic':
        # Change label to reflect direct deduction
        node['data']['label'] = "세금 직접 징수"
        for attr in node['data']['attributes']:
            if attr['key'] == 'money_gain':
                # Instead of money_gain, we modify money directly
                attr['key'] = "money"
                # formula: current money minus 10% * dice
                attr['value'] = "money - (money * 0.1 * dice_count)"

# 2. Disconnect n-tax-logic and jail nodes from n-accumulate-tile
# Edges to remove: n-tax-logic -> n-accumulate-tile
# Edges from jail that go to n-accumulate-tile
nodes_to_bypass_hub = ["n-tax-logic", "n-jail-enter", "n-jail-roll", "n-jail-retry-check"]

new_edges = []
for edge in data['edges']:
    if edge['source'] in nodes_to_bypass_hub and edge['target'] == 'n-accumulate-tile':
        # Redirect these directly to n-dice-check (or the next logic)
        # To bypass hub, we go to n-dice-check
        edge['target'] = "n-dice-check"
    new_edges.append(edge)

data['edges'] = new_edges

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V36"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V36.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V36 generated successfully with Tax and Jail hub bypass.")
