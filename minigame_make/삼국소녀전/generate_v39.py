import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V38.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Add new table mapping nodes
new_mappings = [
    {"id": "e-data-tile_tax_low", "source": "n-table-tiles", "target": "n-tax-low-logic", "row": "6", "key": "tile_tax_low"},
    {"id": "e-data-tile_tax_high", "source": "n-table-tiles", "target": "n-tax-high-logic", "row": "40", "key": "tile_tax_high"},
    {"id": "e-data-tile_jail", "source": "n-table-tiles", "target": "n-jail-fail-logic", "row": "32", "key": "tile_jail"}
]

# We must create the logic nodes and gates first
new_nodes = [
    {
        "id": "n-tax-high-gate",
        "type": "gate",
        "position": {"x": 500, "y": 1000},
        "data": {
            "label": "세금(고) 타일?",
            "condition": "pos == 38",
            "attributes": []
        }
    },
    {
        "id": "n-tax-low-logic",
        "type": "trigger",
        "position": {"x": 800, "y": 900},
        "data": {
            "label": "세금(저) 징수",
            "attributes": [{"key": "money", "type": "number", "value": "money - tile_tax_low.tax_fixed_value"}]
        }
    },
    {
        "id": "n-tax-high-logic",
        "type": "trigger",
        "position": {"x": 800, "y": 1000},
        "data": {
            "label": "세금(고) 징수",
            "attributes": [{"key": "money", "type": "number", "value": "money - tile_tax_high.tax_fixed_value"}]
        }
    },
    {
        "id": "n-jail-fail-logic",
        "type": "trigger",
        "position": {"x": 1000, "y": 1200},
        "data": {
            "label": "감옥 징수금",
            "attributes": [{"key": "money", "type": "number", "value": "money - tile_jail.tax_fixed_value"}]
        }
    }
]

data['nodes'].extend(new_nodes)

# Modify existing tax gate to only be tax_low
for node in data['nodes']:
    if node['id'] == 'n-tax-gate':
        node['id'] = 'n-tax-low-gate'
        node['data']['label'] = "세금(저) 타일?"
        node['data']['condition'] = "pos == 4"
        
# The old n-tax-logic is removed or just ignored. We'll remove it.
data['nodes'] = [n for n in data['nodes'] if n['id'] != 'n-tax-logic']

# Update Edges
edges_to_remove = ['e23', 'e-tax-to-s1'] # e23 was n-tax-gate -> n-tax-logic, e-tax-to-s1 was false branch
# Remove edges pointing from n-tax-logic
data['edges'] = [e for e in data['edges'] if e['id'] not in edges_to_remove and e['source'] != 'n-tax-logic' and e.get('target') != 'n-tax-gate']

new_edges = [
    # Re-wire dispatcher to new n-tax-low-gate
    {"id": "e-dispatch-tax-low", "source": "n-tile-dispatcher", "target": "n-tax-low-gate", "type": "exec", "data": {"gateBranch": "false"}},
    
    # n-tax-low-gate paths
    {"id": "e-tax-low-true", "source": "n-tax-low-gate", "target": "n-tax-low-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-tax-low-false", "source": "n-tax-low-gate", "target": "n-tax-high-gate", "type": "exec", "data": {"gateBranch": "false"}},
    
    # n-tax-high-gate paths
    {"id": "e-tax-high-true", "source": "n-tax-high-gate", "target": "n-tax-high-logic", "type": "exec", "data": {"gateBranch": "true"}},
    {"id": "e-tax-high-false", "source": "n-tax-high-gate", "target": "n-land-s1-gate", "type": "exec", "data": {"gateBranch": "false"}},
    
    # Tax logic return paths
    {"id": "e-tax-low-return", "source": "n-tax-low-logic", "target": "n-loop-gate", "type": "exec", "data": {}},
    {"id": "e-tax-high-return", "source": "n-tax-high-logic", "target": "n-loop-gate", "type": "exec", "data": {}},
    
    # Jail logic paths
    # find edge from n-jail-retry-check (false branch) and point to n-jail-fail-logic
    {"id": "e-jail-fail-return", "source": "n-jail-fail-logic", "target": "n-loop-gate", "type": "exec", "data": {}}
]

# We need to find the existing false branch of n-jail-retry-check and delete it
data['edges'] = [e for e in data['edges'] if not (e['source'] == 'n-jail-retry-check' and e.get('data', {}).get('gateBranch') == 'false')]
new_edges.append({"id": "e-jail-fail-branch", "source": "n-jail-retry-check", "target": "n-jail-fail-logic", "type": "exec", "data": {"gateBranch": "false"}})

# Add mapping edges
for m in new_mappings:
    new_edges.append({
        "id": m["id"],
        "source": m["source"],
        "target": m["target"],
        "type": "data",
        "data": {
            "dataTableRowExpression": m["row"],
            "tableEntityAttributeMappings": [
                {"sourceKey": "tax_fixed_value", "targetKey": f"{m['key']}.tax_fixed_value"}
            ]
        }
    })

data['edges'].extend(new_edges)

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V39"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V39.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V39 generated successfully with Tax and Jail rules.")
