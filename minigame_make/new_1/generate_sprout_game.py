import json
from datetime import datetime

# Technical Metadata for LLE (SDT)
def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

# Professional Initial State (Neutral terminology as requested)
MOCK_INIT = {
    "gold": 0,
    "sprout_total_earned": 0,
    "money_gain": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

sprout_game = {
    "version": 1,
    "designName": "게임2_숙주나물_키우기_v1",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-sprout", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "sprout_target_harvest", "type": "number", "value": "20"},
        {"key": "sprout_wither_time", "type": "number", "value": "4000"},
        {"key": "sprout_total_earned", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "게임 진입",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "desc", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🌱 Sprout Timing Harvest", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "5개의 슬롯에서 자라는 숙주를 적기에 수확하세요!", "variant": "muted"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "시작하기", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "글로벌 변수 초기화",
                "attributes": [
                    {"key": "sprout_target_harvest", "type": "number", "value": "20"},
                    {"key": "sprout_total_earned", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n_play_sprout", "type": "action",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "미니게임 플레이 (숙주 키우기)",
                "duration": "long",
                "difficulty": 5,
                "description": "5개 슬롯에서 숙주 성장. 완전 성장 시 클릭하여 수확. 목표 달성 후 총 획득량 반환.",
                "sdtEffects": sdt(c=2),
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "slots", "info"]},
                        "t": {"type": "Text", "props": {"text": "🌱 수확 진행 중...", "variant": "subtitle"}, "children": []},
                        "slots": {"type": "HStack", "props": {}, "children": ["s1", "s2", "s3", "s4", "s5"]},
                        "s1": {"type": "Text", "props": {"text": "🌱", "variant": "title"}, "children": []},
                        "s2": {"type": "Text", "props": {"text": "🌿", "variant": "title"}, "children": []},
                        "s3": {"type": "Text", "props": {"text": "🍂", "variant": "title"}, "children": []},
                        "s4": {"type": "Text", "props": {"text": "🌱", "variant": "title"}, "children": []},
                        "s5": {"type": "Text", "props": {"text": "🌿", "variant": "title"}, "children": []},
                        "info": {"type": "Text", "props": {"text": "목표: 20개 | 타이밍에 맞춰 클릭하세요!", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_calc_reward", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "보상 데이터 정산",
                "attributes": [
                    # Simulate result for mockup testing (random 50 ~ 200)
                    {"key": "sprout_total_earned", "type": "number", "value": "rand.d20() * 10"},
                    {"key": "money_gain", "type": "number", "value": "sprout_total_earned"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_reward_gate", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "수확량 확인", "condition": "money_gain > 0", "sdtEffects": sdt()}
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 250, "y": 750},
            "data": {"label": "보상 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 250, "y": 900},
            "data": {"label": "자원 정산 (Gold)", "resourceId": "res-gold-sprout", "resourceKey": "gold"}
        },
        {
            "id": "n_end", "type": "success",
            "position": {"x": 400, "y": 1050},
            "data": {
                "label": "최종 결과 리포트",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "row1", "row2", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏆 수확 완료!", "variant": "title"}, "children": []},
                        "row1": {"type": "HStack", "props": {}, "children": ["l1", "s1", "v1"]},
                        "l1": {"type": "Text", "props": {"text": "총 수확량", "variant": "muted"}, "children": []},
                        "s1": {"type": "Spacer", "props": {}, "children": []},
                        "v1": {"type": "Text", "props": {"text": "20 / 20", "variant": "tabular"}, "children": []},
                        "row2": {"type": "HStack", "props": {}, "children": ["l2", "s2", "v2"]},
                        "l2": {"type": "Text", "props": {"text": "정산 골드", "variant": "muted"}, "children": []},
                        "s2": {"type": "Spacer", "props": {}, "children": []},
                        "v2": {"type": "Text", "props": {"text": "+{{money_gain}} G", "variant": "tabular"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "메인으로", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT, "money_gain": 150}
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_init", "type": "exec"},
        {"id": "e2", "source": "n_init", "target": "n_play_sprout", "type": "exec"},
        {"id": "e3", "source": "n_play_sprout", "target": "n_calc_reward", "type": "exec"},
        {"id": "e4", "source": "n_calc_reward", "target": "n_reward_gate", "type": "exec"},
        {"id": "e5", "source": "n_reward_gate", "target": "n_reward_hub", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e6", "source": "n_reward_gate", "target": "n_end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e7", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e8", "source": "n_res_gold", "target": "n_end", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임2_숙주나물_키우기_v1.json', 'w', encoding='utf-8') as f:
    json.dump(sprout_game, f, ensure_ascii=False, indent=2)

print("숙주나물 키우기 게임 생성 완료!")
