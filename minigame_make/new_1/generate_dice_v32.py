import json
from datetime import datetime

def sdt(c=0, m=0):
    return {"autonomy": 0, "competence": c, "relatedness": 0, "motivation": m}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "roll": 0, "bet_high": -1,
    "sdt": sdt(0, 50),
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# 심플 UI 헬퍼
def make_btn(label, target):
    return {"type": "Button", "props": {"label": label, "variant": "primary", "targetNodeId": target}}

def make_text(text, variant="title"):
    return {"type": "Text", "props": {"text": text, "variant": variant}}

# 엣지 헬퍼 (기본형)
def make_edge(id, source, target, type="exec", gateBranch=None):
    edge = {"id": id, "source": source, "target": target, "type": type, "data": {}}
    if gateBranch: edge["data"]["gateBranch"] = gateBranch
    return edge

dice_v32 = {
    "version": 1,
    "designName": "주사위_게임_v32_리스타트",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "circle_dollar_sign"},
        {"id": "res_dice", "key": "dice", "name": "주사위", "color": "#FFFFFF", "icon": "dice_5"}
    ],
    "attributes": [
        {"key": "gold", "type": "number", "value": "0"},
        {"key": "dice", "type": "number", "value": "10"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "bet_high", "type": "number", "value": "-1"}
    ],
    "nodes": [
        {
            "id": "n_entry", "type": "entry", "position": {"x": 400, "y": 0},
            "data": {
                "label": "진입",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t1", "b1"]},
                        "t1": make_text("🎲 기본 다이스"),
                        "b1": make_btn("입장하기", "n_init")
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        # 핵심 1: trigger -> action 으로 변경
        {
            "id": "n_init", "type": "action", "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "gold", "type": "number", "value": "0"},
                    {"key": "dice", "type": "number", "value": "10"}
                ]
            }
        },
        {
            "id": "n_lobby", "type": "choice", "position": {"x": 400, "y": 300},
            "data": {
                "label": "로비",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t1", "t2", "t3", "b_start", "b_refill"]},
                        "t1": make_text("🏠 로비"),
                        "t2": make_text("💰 골드: {{gold}}", "subtitle"),
                        "t3": make_text("🎲 주사위: {{dice}}개", "subtitle"),
                        "b_start": make_btn("게임 시작", "n_gate_dice"),
                        "b_refill": {"type": "Button", "props": {"label": "주사위 충전", "variant": "secondary", "targetNodeId": "n_refill"}}
                    }
                }
            }
        },
        # 핵심 2: 충전도 action
        {
            "id": "n_refill", "type": "action", "position": {"x": 650, "y": 300},
            "data": {
                "label": "충전",
                "attributes": [{"key": "dice", "type": "number", "value": "dice + 10"}]
            }
        },
        # 핵심 3: gate는 엄격하게 조건만
        {
            "id": "n_gate_dice", "type": "gate", "position": {"x": 400, "y": 450},
            "data": {"label": "주사위 있나?", "condition": "dice > 0"}
        },
        {
            "id": "n_bet", "type": "choice", "position": {"x": 400, "y": 600},
            "data": {
                "label": "베팅 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t1", "b_high", "b_low"]},
                        "t1": make_text("주사위 결과 예측"),
                        "b_high": {"type": "Button", "props": {"label": "높음 (4~6)", "variant": "secondary", "targetNodeId": "n_high"}},
                        "b_low": {"type": "Button", "props": {"label": "낮음 (1~3)", "variant": "secondary", "targetNodeId": "n_low"}}
                    }
                }
            }
        },
        # 연산 노드도 action
        {
            "id": "n_high", "type": "action", "position": {"x": 200, "y": 750},
            "data": {
                "label": "높음 선택",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "dice", "type": "number", "value": "dice - 1"}
                ]
            }
        },
        {
            "id": "n_low", "type": "action", "position": {"x": 600, "y": 750},
            "data": {
                "label": "낮음 선택",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "0"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "dice", "type": "number", "value": "dice - 1"}
                ]
            }
        },
        {
            "id": "n_judge", "type": "gate", "position": {"x": 400, "y": 900},
            "data": {"label": "결과 판정", "condition": "(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)"}
        },
        {
            "id": "n_win", "type": "choice", "position": {"x": 200, "y": 1050},
            "data": {
                "label": "승리 UI",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t1", "t2", "b1"]},
                        "t1": make_text("🎉 승리!"),
                        "t2": make_text("주사위 눈: {{roll}}", "subtitle"),
                        "b1": make_btn("보상 받기", "n_reward")
                    }
                }
            }
        },
        {
            "id": "n_fail", "type": "choice", "position": {"x": 600, "y": 1050},
            "data": {
                "label": "패배 UI",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t1", "t2", "b1"]},
                        "t1": make_text("😢 패배"),
                        "t2": make_text("주사위 눈: {{roll}}", "subtitle"),
                        "b1": make_btn("로비로 돌아가기", "n_lobby")
                    }
                }
            }
        },
        {
            "id": "n_reward", "type": "reward", "position": {"x": 200, "y": 1200},
            "data": {"label": "보상 노드"}
        },
        {
            "id": "n_add_gold", "type": "action", "position": {"x": 200, "y": 1350},
            "data": {
                "label": "골드 증가",
                "attributes": [{"key": "gold", "type": "number", "value": "gold + 1"}]
            }
        }
    ],
    "edges": [
        make_edge("e1", "n_entry", "n_init"),
        make_edge("e2", "n_init", "n_lobby"),
        make_edge("e3", "n_lobby", "n_gate_dice"),
        make_edge("e4", "n_lobby", "n_refill"),
        make_edge("e5", "n_refill", "n_lobby"),
        make_edge("e6", "n_gate_dice", "n_bet", gateBranch="true"),
        make_edge("e7", "n_gate_dice", "n_lobby", gateBranch="false"),  # 주사위 없으면 로비로 튕김
        make_edge("e8", "n_bet", "n_high"),
        make_edge("e9", "n_bet", "n_low"),
        make_edge("e10", "n_high", "n_judge"),
        make_edge("e11", "n_low", "n_judge"),
        make_edge("e12", "n_judge", "n_win", gateBranch="true"),
        make_edge("e13", "n_judge", "n_fail", gateBranch="false"),
        make_edge("e14", "n_win", "n_reward"),
        make_edge("e15", "n_reward", "n_add_gold"),
        make_edge("e16", "n_add_gold", "n_lobby"),
        make_edge("e17", "n_fail", "n_lobby")
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v32_리스타트.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v32, f, ensure_ascii=False, indent=2)

print("주사위 게임 V32 (리스타트) 생성 완료! trigger 노드 완전 제거 및 action 기반 공식 구조 적용.")
