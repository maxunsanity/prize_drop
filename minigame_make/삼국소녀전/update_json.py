import json
import uuid

with open("주사위_시즌_검증_v7 (이름바꿈).json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 삭제할 구형 노드 리스트
old_nodes = {"n-gate-rank1", "n-gate-rank3", "n-gate-rank10", "n-gate-rank20", 
             "n-coin8", "n-coin5", "n-coin3", "n-coin2", "n-coin1"}

new_nodes = []
# 필터링하여 기존 노드 유지
for n in data["nodes"]:
    if n["id"] not in old_nodes:
        new_nodes.append(n)

new_edges = []
# 기존 엣지 필터링 (구형 노드와 연결된 엣지 삭제)
for e in data["edges"]:
    if e["source"] not in old_nodes and e["target"] not in old_nodes:
        new_edges.append(e)

# 새로운 11단계 순위 보상 수치 (1위~10위, 11위 이하는 1)
rank_rewards = [20, 18, 16, 14, 12, 10, 8, 6, 4, 2]

prev_gate_id = "n-tournament-end"

for i in range(1, 11):
    gate_id = f"n-gate-r{i}"
    coin_id = f"n-coin-r{i}"
    reward_val = rank_rewards[i-1]
    y_pos = 600 + ((i-1) * 90)
    
    # 게이트 생성 (예: rank <= 3)
    gate_node = {
        "id": gate_id, "type": "gate", "position": {"x": 1300, "y": y_pos},
        "data": {"label": f"{i}위?", "condition": f"rank == 1" if i == 1 else f"rank <= {i}", "intensity": 5, "sdtEffects": {"autonomy": 0,"competence": 0,"motivation": 0,"relatedness": 0}, "frictionScore": 0 },
        "measured": {"width": 220, "height": 65}
    }
    
    # 트리거 생성 (코인 지급)
    trigger_node = {
        "id": coin_id, "type": "trigger", "position": {"x": 1600, "y": y_pos},
        "data": {"label": f"시즌 코인 +{reward_val}", "intensity": 5, "attributes": [{"key": "season_coin", "type": "number", "value": f"season_coin + {reward_val}"}], "sdtEffects": {"autonomy": 0,"competence": 0,"motivation": 0,"relatedness": 0}},
        "measured": {"width": 220, "height": 90}
    }
    
    new_nodes.extend([gate_node, trigger_node])
    
    # 엣지 연결: 이전 게이트 false -> 현재 게이트
    if i == 1:
        new_edges.append({"id": f"e-{prev_gate_id}-{gate_id}", "source": prev_gate_id, "target": gate_id})
    else:
        new_edges.append({"id": f"e-{prev_gate_id}-{gate_id}", "source": prev_gate_id, "target": gate_id, "sourceHandle": "false"})
    
    # 엣지 연결: 게이트 true -> 트리거
    new_edges.append({"id": f"e-{gate_id}-{coin_id}", "source": gate_id, "target": coin_id, "sourceHandle": "true"})
    
    # 엣지 연결: 트리거 -> 다음 단계 (시즌 클래스 게이트)
    new_edges.append({"id": f"e-{coin_id}-n-gate-c2", "source": coin_id, "target": "n-gate-c2"})
    
    prev_gate_id = gate_id

# 11~35위 트리거 생성 (1코인)
coin_id = "n-coin-r11"
y_pos = 600 + (10 * 90)
trigger_node_fallback = {
    "id": coin_id, "type": "trigger", "position": {"x": 1600, "y": y_pos},
    "data": {"label": f"시즌 코인 +1", "intensity": 5, "attributes": [{"key": "season_coin", "type": "number", "value": "season_coin + 1"}], "sdtEffects": {"autonomy": 0,"competence": 0,"motivation": 0,"relatedness": 0}},
    "measured": {"width": 220, "height": 90}
}
new_nodes.append(trigger_node_fallback)
new_edges.append({"id": f"e-{prev_gate_id}-{coin_id}", "source": prev_gate_id, "target": coin_id, "sourceHandle": "false"})
new_edges.append({"id": f"e-{coin_id}-n-gate-c2", "source": coin_id, "target": "n-gate-c2"})

# 데이터 교체
data["nodes"] = new_nodes
data["edges"] = new_edges
data["designName"] = "타이쿤_이벤트_테스트_v1"

with open("타이쿤_이벤트_테스트_v1.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("SUCCESS: 타이쿤_이벤트_테스트_v1.json 파일이 성공적으로 생성되었습니다!")
