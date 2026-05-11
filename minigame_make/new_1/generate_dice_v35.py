import json

# 오빠가 수정한 파일 경로
INPUT_FILE = '/Users/max/Downloads/주사위_게임_v34_수정본.json'
OUTPUT_FILE = '/Users/max/lle 안티그래비티/new_1/주사위_게임_v35_자원이식.json'

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. 자원 노드 추가 (적절한 빈 공간에 배치)
resource_nodes = [
    {
        "id": "n_res_node_dice",
        "type": "resource",
        "position": {"x": 1200, "y": 1250},
        "data": {
            "label": "🎲 주사위 창고",
            "resourceKey": "dice"
        }
    },
    {
        "id": "n_res_node_gold",
        "type": "resource",
        "position": {"x": -400, "y": 2250},
        "data": {
            "label": "💰 골드 금고",
            "resourceKey": "gold"
        }
    }
]
data['nodes'].extend(resource_nodes)

# 2. 기존 노드에서 코딩 수식 제거
for node in data['nodes']:
    # 높음/낮음 선택 노드에서 dice - 1 제거
    if node['id'] in ['n_high_calc', 'n_low_calc']:
        if 'attributes' in node['data']:
            node['data']['attributes'] = [attr for attr in node['data']['attributes'] if attr['key'] != 'dice']
    
    # 골드 지급 노드에서 gold + 1 제거
    if node['id'] == 'n_res_gold':
        if 'attributes' in node['data']:
            node['data']['attributes'] = [attr for attr in node['data']['attributes'] if attr['key'] != 'gold']

# 3. 공식 자원 엣지(Resource Edge) 추가
resource_edges = [
    # 높음 선택 -> 주사위 소모 (-1)
    {
        "id": "re_high_dice_cost",
        "source": "n_high_calc",
        "target": "n_res_node_dice",
        "type": "resource",
        "data": {
            "amount": -1,
            "resourceAmountExpression": "-1"
        }
    },
    # 낮음 선택 -> 주사위 소모 (-1)
    {
        "id": "re_low_dice_cost",
        "source": "n_low_calc",
        "target": "n_res_node_dice",
        "type": "resource",
        "data": {
            "amount": -1,
            "resourceAmountExpression": "-1"
        }
    },
    # 골드 지급 노드 -> 골드 증가 (+1)
    {
        "id": "re_gold_gain",
        "source": "n_res_gold",
        "target": "n_res_node_gold",
        "type": "resource",
        "data": {
            "amount": 1,
            "resourceAmountExpression": "1"
        }
    }
]
data['edges'].extend(resource_edges)

# 디자인 이름 변경
data['designName'] = "주사위_게임_v35_자원시스템"

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"주사위 게임 V35 생성 완료! 오빠의 노드 위치와 엣지를 100% 보존하며 자원 시스템만 이식했습니다. 경로: {OUTPUT_FILE}")
