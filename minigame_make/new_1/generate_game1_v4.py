import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 100,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# Helper to create buttons with BOTH targetNodeId and explicit setState
def create_btn(id, label, target, variant="primary"):
    return {
        "on": {
            "press": {
                "action": "setState",
                "params": {
                    "value": target,
                    "statePath": "/sim.activeScene" # Force jump via state
                }
            }
        },
        "type": "Button",
        "props": {
            "label": label,
            "variant": variant,
            "targetNodeId": target # Native LLE navigation
        },
        "children": []
    }

game1 = {
    "version": 1,
    "designName": "게임1_주사위_홀짝_v4",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-g1", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "dice", "type": "number", "value": "10"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "bet_high", "type": "number", "value": "-1"},
        {"key": "gold_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "게임 시작", "tags": [],
                "mockSpec": {
                    "root": "start-screen",
                    "elements": {
                        "start-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-bar", "start-body"]},
                        "top-bar": {"type": "TopArea", "props": {}, "children": ["res-gold"]},
                        "res-gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "start-body": {"type": "VStack", "props": {}, "children": ["s-title", "s-desc", "sp1", "start-btn"]},
                        "s-title": {"type": "Text", "props": {"text": "🎲 주사위 예측 v4 (강력 터치)", "variant": "title"}, "children": []},
                        "s-desc": {"type": "Text", "props": {"text": "버튼 클릭 감도를 개선했습니다!", "variant": "muted"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "start-btn": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🎲 게임 시작!", "variant": "primary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n-init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "dice", "type": "number", "value": "10"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "bet_high", "type": "number", "value": "-1"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-loop-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "주사위 남음?", "condition": "dice >= 1", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-consume-dice", "type": "disposal",
            "position": {"x": 400, "y": 450},
            "data": {"label": "주사위 소비", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-choice-bet", "type": "choice",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "예측 선택", "tags": [],
                "mockSpec": {
                    "root": "bet-screen",
                    "elements": {
                        "bet-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-bet", "bet-body"]},
                        "top-bet": {"type": "TopArea", "props": {}, "children": ["res-gold-bet"]},
                        "res-gold-bet": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "bet-body": {"type": "VStack", "props": {}, "children": ["bet-title", "sp-mid", "btn-high", "sp-btn", "btn-low", "sp-bot"]},
                        "bet-title": {"type": "Text", "props": {"text": "🎲 어느 쪽일까요?", "variant": "title"}, "children": []},
                        "sp-mid": {"type": "Spacer", "props": {}, "children": []},
                        "btn-high": create_btn("btn-high", "🔼 높음 (4 ~ 6)", "n-set-high", "primary"),
                        "sp-btn": {"type": "Spacer", "props": {}, "children": []},
                        "btn-low": create_btn("btn-low", "🔽 낮음 (1 ~ 3)", "n-set-low", "primary"), # Changed to primary
                        "sp-bot": {"type": "Spacer", "props": {}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n-set-high", "type": "trigger",
            "position": {"x": 200, "y": 750},
            "data": {
                "label": "높음 세팅",
                "attributes": [{"key": "bet_high", "type": "number", "value": "1"}],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },
        {
            "id": "n-set-low", "type": "trigger",
            "position": {"x": 600, "y": 750},
            "data": {
                "label": "낮음 세팅",
                "attributes": [{"key": "bet_high", "type": "number", "value": "0"}],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },
        {
            "id": "n-roll", "type": "trigger",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "주사위 굴리기",
                "attributes": [
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "dice", "type": "number", "value": "dice - 1"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-bet-gate", "type": "gate",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "높음 선택?", "condition": "bet_high == 1", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-high-result-gate", "type": "gate",
            "position": {"x": 200, "y": 1200},
            "data": {"label": "주사위 4이상?", "condition": "roll >= 4", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-low-result-gate", "type": "gate",
            "position": {"x": 600, "y": 1200},
            "data": {"label": "주사위 3이하?", "condition": "roll <= 3", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-win-trigger", "type": "trigger",
            "position": {"x": 200, "y": 1350},
            "data": {
                "label": "예측 성공!",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "10"}],
                "sdtEffects": sdt(c=2), "frictionScore": 0
            }
        },
        {
            "id": "n-lose-trigger", "type": "trigger",
            "position": {"x": 600, "y": 1350},
            "data": {
                "label": "예측 실패...",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "-5"}],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-result-scene", "type": "scene",
            "position": {"x": 400, "y": 1500},
            "data": {
                "label": "결과 확인", "tags": [],
                "mockSpec": {
                    "root": "res-screen",
                    "elements": {
                        "res-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-res", "res-body"]},
                        "top-res": {"type": "TopArea", "props": {}, "children": ["res-gold-res"]},
                        "res-gold-res": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "res-body": {"type": "VStack", "props": {}, "children": ["res-title", "roll-txt", "gain-txt", "sp-res", "cont-btn"]},
                        "res-title": {"type": "Text", "props": {"text": "🎲 결과 발표", "variant": "title"}, "children": []},
                        "roll-txt": {"type": "Text", "props": {"text": "주사위 눈: {{roll}}", "variant": "subtitle"}, "children": []},
                        "gain-txt": {"type": "Text", "props": {"text": "보상: {{gold_gain}} 골드", "variant": "muted"}, "children": []},
                        "sp-res": {"type": "Spacer", "props": {}, "children": []},
                        "cont-btn": {
                            "on": {"press": {"action": "setState", "params": {"value": 0, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "계속하기 ▶", "variant": "primary", "targetNodeId": "n-reward-hub"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT, "roll": 5, "gold_gain": 10}
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 400, "y": 1650},
            "data": {"label": "골드 허브", "sdtEffects": sdt(c=1), "frictionScore": 0}
        },
        {
            "id": "n-gold-res", "type": "resource",
            "position": {"x": 400, "y": 1800},
            "data": {"label": "골드", "resourceId": "res-gold-g1", "resourceKey": "gold"}
        },
        {
            "id": "n-end", "type": "success",
            "position": {"x": 800, "y": 300},
            "data": {"label": "종료", "sdtEffects": sdt(c=2), "frictionScore": 0}
        }
    ],

    "edges": [
        {"id": "e1", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e2", "source": "n-init", "target": "n-loop-gate", "type": "exec"},
        {"id": "e3", "source": "n-loop-gate", "target": "n-consume-dice", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e4", "source": "n-loop-gate", "target": "n-end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e5", "source": "n-consume-dice", "target": "n-choice-bet", "type": "exec"},
        {"id": "e6", "source": "n-choice-bet", "target": "n-set-high", "type": "exec"},
        {"id": "e7", "source": "n-choice-bet", "target": "n-set-low", "type": "exec"},
        {"id": "e8", "source": "n-set-high", "target": "n-roll", "type": "exec"},
        {"id": "e9", "source": "n-set-low", "target": "n-roll", "type": "exec"},
        {"id": "e10", "source": "n-roll", "target": "n-bet-gate", "type": "exec"},
        {"id": "e11", "source": "n-bet-gate", "target": "n-high-result-gate", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e12", "source": "n-bet-gate", "target": "n-low-result-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e13", "source": "n-high-result-gate", "target": "n-win-trigger", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e14", "source": "n-high-result-gate", "target": "n-lose-trigger", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e15", "source": "n-low-result-gate", "target": "n-win-trigger", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e16", "source": "n-low-result-gate", "target": "n-lose-trigger", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e17", "source": "n-win-trigger", "target": "n-result-scene", "type": "exec"},
        {"id": "e18", "source": "n-lose-trigger", "target": "n-result-scene", "type": "exec"},
        {"id": "e19", "source": "n-result-scene", "target": "n-reward-hub", "type": "exec"},
        {"id": "e20", "source": "n-reward-hub", "target": "n-gold-res", "type": "resource", "data": {"resourceAmountExpression": "gold_gain"}},
        {"id": "e21", "source": "n-gold-res", "target": "n-loop-gate", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_주사위_홀짝_v4.json', 'w', encoding='utf-8') as f:
    json.dump(game1, f, ensure_ascii=False, indent=2)

print("V4 생성 완료! 버튼 스타일 통일(primary) 및 명시적 setState 추가.")
