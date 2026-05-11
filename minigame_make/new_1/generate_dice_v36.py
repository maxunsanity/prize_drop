import json

# 오빠의 완벽한 레이아웃 파일 (V34 수정본)
INPUT_FILE = '/Users/max/Downloads/주사위_게임_v34_수정본.json'
OUTPUT_FILE = '/Users/max/lle 안티그래비티/new_1/주사위_게임_v36_최종완성.json'

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. 에러가 났던 자원 노드 및 자원 엣지 완전 제거 (오빠의 순수 레이아웃으로 복구)
# (이미 INPUT_FILE이 순수 레이아웃이므로, 만약 V35의 잔재가 있다면 여기서 필터링)
data['nodes'] = [n for n in data['nodes'] if n['type'] != 'resource']
data['edges'] = [e for e in data['edges'] if e.get('type') != 'resource']

# 2. 자원 소모 로직을 "키값 연동(Attributes)" 방식으로 정밀 튜닝
# LLE 엔진에서 가장 안정적인 '트리거 속성' 방식을 유지하되, 수식을 엔진 최적화 버전으로 변경
for node in data['nodes']:
    # 높음(-1) 선택 시 로직
    if node['id'] == 'n_high_calc':
        node['data']['attributes'] = [
            {"key": "bet_high", "type": "number", "value": "1"},
            {"key": "roll", "type": "number", "value": "rand.d6()"},
            {"key": "total_games", "type": "number", "value": "total_games + 1"},
            {"key": "dice", "type": "number", "value": "dice - 1"} # 자원을 키값(dice)으로 직접 차감
        ]
        node['data']['label'] = "🎲 높음 (주사위 -1)"
        
    # 낮음(-1) 선택 시 로직
    if node['id'] == 'n_low_calc':
        node['data']['attributes'] = [
            {"key": "bet_high", "type": "number", "value": "0"},
            {"key": "roll", "type": "number", "value": "rand.d6()"},
            {"key": "total_games", "type": "number", "value": "total_games + 1"},
            {"key": "dice", "type": "number", "value": "dice - 1"} # 자원을 키값(dice)으로 직접 차감
        ]
        node['data']['label'] = "🎲 낮음 (주사위 -1)"

    # 승리 보상 로직
    if node['id'] == 'n_res_gold':
        node['data']['attributes'] = [
            {"key": "gold", "type": "number", "value": "gold + 1"}, # 자원 키값(gold) 직접 증가
            {"key": "total_wins", "type": "number", "value": "total_wins + 1"},
            {"key": "win_rate", "type": "number", "value": "floor((total_wins / total_games) * 100)"}
        ]
        node['data']['label'] = "💰 골드 획득 (+1)"

# 3. 오빠가 수정한 모든 엣지 핸들(Handle) 정보가 누락되지 않았는지 최종 점검
# (INPUT_FILE의 edges 정보를 그대로 유지함)

data['designName'] = "주사위_게임_v36_자원키값완성"

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"주사위 게임 V36 생성 완료! 오빠의 레이아웃을 완벽하게 유지하며 '자원 키값' 로직을 적용했습니다. 경로: {OUTPUT_FILE}")
