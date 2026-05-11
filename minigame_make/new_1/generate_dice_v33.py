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

def make_btn(label, target):
    return {"type": "Button", "props": {"label": label, "variant": "primary", "targetNodeId": target}}

def make_text(text, variant="title"):
    return {"type": "Text", "props": {"text": text, "variant": variant}}

# FULL CUSTOM EDGE GENERATOR
def edge(source, target, sH="bottom", tH="top", type="exec", gateBranch=None, label=None):
    eid = f"xy-edge__{source}{sH}-{target}{tH}"
    if gateBranch: eid += f"-{gateBranch}"
    
    e = {
        "id": eid,
        "source": source,
        "target": target,
        "type": type,
        "sourceHandle": sH,
        "targetHandle": tH,
        "data": {"animated": False}
    }
    if gateBranch: e["data"]["gateBranch"] = gateBranch
    if label: e["data"]["label"] = label
    return e

dice_v33 = {
    "version": 1,
    "designName": "주사위_게임_v33_풀커스텀엣지",
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
                        "t1": make_text("🎲 기본 다이스 (V33)"),
                        "b1": make_btn("입장하기", "n_init")
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
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
        {
            "id": "n_refill", "type": "action", "position": {"x": 650, "y": 300},
            "data": {
                "label": "충전",
                "attributes": [{"key": "dice", "type": "number", "value": "dice + 10"}]
            }
        },
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
        # 순방향 (수직 하강): bottom -> top
        edge("n_entry", "n_init"),
        edge("n_init", "n_lobby"),
        edge("n_lobby", "n_gate_dice", sH="bottom", tH="top"),
        edge("n_lobby", "n_refill", sH="right", tH="left"), # 로비에서 우측 충전으로
        edge("n_gate_dice", "n_bet", gateBranch="true"),
        edge("n_bet", "n_high", sH="bottom", tH="top"),
        edge("n_bet", "n_low", sH="bottom", tH="top"),
        edge("n_high", "n_judge", sH="bottom", tH="top"),
        edge("n_low", "n_judge", sH="bottom", tH="top"),
        edge("n_judge", "n_win", gateBranch="true"),
        edge("n_judge", "n_fail", gateBranch="false"),
        edge("n_win", "n_reward"),
        edge("n_reward", "n_add_gold"),

        # ---------------------------------------------------------
        # 오빠가 지적한 커스텀 루프백 선들! (바닥에서 옆구리로!)
        # ---------------------------------------------------------
        # 1. 골드 증가 -> 로비 (왼쪽 큰 루프)
        edge("n_add_gold", "n_lobby", sH="bottom", tH="left", label="로비 귀환"),
        
        # 2. 패배 -> 로비 (오른쪽 큰 루프)
        edge("n_fail", "n_lobby", sH="bottom", tH="right", label="로비 귀환"),
        
        # 3. 충전 -> 로비 (오른쪽 숏 루프)
        edge("n_refill", "n_lobby", sH="bottom", tH="right"),
        
        # 4. 잔량 부족 -> 로비 튕기기 (왼쪽 숏 루프)
        edge("n_gate_dice", "n_lobby", gateBranch="false", sH="left", tH="left", label="잔량 부족")
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v33_풀커스텀엣지.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v33, f, ensure_ascii=False, indent=2)

print("주사위 게임 V33 생성 완료! 모든 엣지에 xy-edge ID와 상하좌우 핸들 정보 강제 부여.")
