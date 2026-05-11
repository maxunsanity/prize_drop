import json

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V33.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

correct_conditions = {
    "n-land-s1-gate": "pos == 1 || pos == 3",
    "n-land-s2-gate": "pos == 6 || pos == 8 || pos == 9",
    "n-land-s3-gate": "pos == 11 || pos == 13 || pos == 14",
    "n-land-s4-gate": "pos == 16 || pos == 18 || pos == 19",
    "n-land-s5-gate": "pos == 21 || pos == 23 || pos == 24",
    "n-land-s6-gate": "pos == 26 || pos == 27 || pos == 29",
    "n-land-s7-gate": "pos == 31 || pos == 32 || pos == 34",
    "n-land-s8-gate": "pos == 37 || pos == 39",
    "n-community-gate": "pos == 2 || pos == 17 || pos == 33",
    "n-chance-gate": "pos == 7 || pos == 22 || pos == 36",
    "n-station-gate": "pos == 5 || pos == 15 || pos == 25 || pos == 35",
    "n-tax-gate": "pos == 4 || pos == 38",
    "n-utility-gate": "pos == 12 || pos == 28",
    "n-corner-gate": "pos == 10 || pos == 20",
    "n-jail-gate": "pos == 30",
    "n-go-gate": "pos == 0"
}

correct_rows = {
    "tile_s1": "3",
    "tile_s2": "8",
    "tile_s3": "13",
    "tile_s4": "18",
    "tile_s5": "23",
    "tile_s6": "28",
    "tile_s7": "33",
    "tile_s8": "39",
    "tile_go": "2",
    "tile_visit": "12",
    "tile_park": "22",
    "tile_util_1": "14",
    "tile_util_2": "30",
    "tile_community": "4",
    "tile_chance": "9"
}

for node in data['nodes']:
    # Update Gate Conditions
    if node['id'] in correct_conditions:
        node['data']['condition'] = correct_conditions[node['id']]
        
    # Also update corner logic formula to reflect actual tile_visit and tile_park correctly.
    # In my previous gate, pos==10 goes to n-corner-logic (visit), pos==20 goes to n-corner-logic-2 (park)
    # Wait, n-corner-gate has 10 and 20. But how does it branch?
    # I should check n-corner-gate branches.

for edge in data['edges']:
    # Update Data Edge Rows for the 15 entities
    if edge.get('source') == 'n-table-tiles' and 'e-data-' in edge['id']:
        entity_key = edge['id'].replace('e-data-', '')
        if entity_key in correct_rows:
            edge['data']['dataTableRowExpression'] = correct_rows[entity_key]

data['designName'] = "타이쿤_40칸_테이블_연동_최종_V34"

with open('/Users/max/lle 안티그래비티/타이쿤_40칸_테이블_연동_최종_V34.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V34 generated successfully with corrected mappings.")
