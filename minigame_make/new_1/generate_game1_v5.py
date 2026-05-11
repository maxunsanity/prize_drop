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

# Helper to create buttons for SCENE based navigation
def create_scene_btn(id, label, target_node_id):
    return {
        "on": {
            "press": {
                "action": "setState",
                "params": {
                    "value": target_node_id,
                    "statePath": "/sim.activeScene" # Jump to next scene/logic
                }
            }
        },
        "type": "Button",
        "props": {
            "label": label,
            "variant": "primary",
            "targetNodeId": target_node_id # Visual and logical link
        },
        "children": []
    }

game1 = {
    "version": 1,
    "designName": "게임1_주사위_홀짝_v5",
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
                "label": "진입", "tags": [],
                "mockSpec": {
                    "root": "root",
                    "elements": {
                        "root": {"type": "Screen", "props": {}, "children": ["title", "btn-start"]},
                        "title": {"type": "Text", "props": {"text": "🎲 주사위 v5 (Scene 방식)", "variant": "title"}, "children": []},
                        "btn-start": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "게임 시작", "variant": "primary"}, "children": []
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
                    {"key": "dice", "type": "number", "value": "10"}, {"key": "roll", "type": "number", "value": "0"},
                    {"key": "bet_high", "type": "number", "value": "-1"}, {"key": "gold_gain", "type": "number", "value": "0"}
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
            "id": "n-consume", "type": "disposal",
            "position": {"x": 400, "y": 450},
            "data": {"label": "주사위 소비", "sdtEffects": sdt()}
        },
        # ─── CHANGED: type is "scene" instead of "choice" ───
        {
            "id": "n-choice-scene", "type": "scene",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "예측 선택 화면", "tags": [],
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["gold"]},
                        "gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "btn-h", "sp2", "btn-l"]},
                        "title": {"type": "Text", "props": {"text": "🎲 홀짝을 예측하세요!", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn-h": create_scene_btn("btn-h", "🔼 높음 (4-6)", "n-set-high"),
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn-l": create_scene_btn("btn-l", "🔽 낮음 (1-3)", "n-set-low")
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
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n-set-low", "type": "trigger",
            "position": {"x": 600, "y": 750},
            "data": {
                "label": "낮음 세팅",
                "attributes": [{"key": "bet_high", "type": "number", "value": "0"}],
                "sdtEffects": sdt(c=1)
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
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-bet-gate", "type": "gate",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "높음 선택?", "condition": "bet_high == 1", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-h-gate", "type": "gate",
            "position": {"x": 200, "y": 1200},
            "data": {"label": "4 이상?", "condition": "roll >= 4", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-l-gate", "type": "gate",
            "position": {"x": 600, "y": 1200},
            "data": {"label": "3 이하?", "condition": "roll <= 3", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-win", "type": "trigger",
            "position": {"x": 200, "y": 1350},
            "data": {"label": "승리!", "attributes": [{"key": "gold_gain", "type": "number", "value": "10"}], "sdtEffects": sdt(c=2)}
        },
        {
            "id": "n-lose", "type": "trigger",
            "position": {"x": 600, "y": 1350},
            "data": {"label": "패배...", "attributes": [{"key": "gold_gain", "type": "number", "value": "-5"}], "sdtEffects": sdt()}
        },
        {
            "id": "n-res-scene", "type": "scene",
            "position": {"x": 400, "y": 1500},
            "data": {
                "label": "결과 확인", "tags": [],
                "mockSpec": {
                    "root": "root",
                    "elements": {
                        "root": {"type": "Screen", "props": {}, "children": ["title", "txt", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🎲 결과: {{roll}}", "variant": "title"}, "children": []},
                        "txt": {"type": "Text", "props": {"text": "보상: {{gold_gain}} 골드", "variant": "subtitle"}, "children": []},
                        "btn": {
                            "on": {"press": {"action": "setState", "params": {"value": "n-reward-hub", "statePath": "/sim.activeScene"}}},
                            "type": "Button", "props": {"label": "확인", "variant": "primary", "targetNodeId": "n-reward-hub"}, "children": []
                        }
                    }
                }
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 400, "y": 1650},
            "data": {"label": "골드 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n-gold-res", "type": "resource",
            "position": {"x": 400, "y": 1800},
            "data": {"label": "골드", "resourceId": "res-gold-g1", "resourceKey": "gold"}
        },
        {
            "id": "n-end", "type": "success",
            "position": {"x": 800, "y": 300},
            "data": {"label": "종료", "sdtEffects": sdt(c=2)}
        }
    ],
    "edges": [
        {"id": "e1", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e2", "source": "n-init", "target": "n-loop-gate", "type": "exec"},
        {"id": "e3", "source": "n-loop-gate", "target": "n-consume", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e4", "source": "n-loop-gate", "target": "n-end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e5", "source": "n-consume", "target": "n-choice-scene", "type": "exec"},
        # IMPORTANT: No direct edges from choice-scene to set-high/low in exec flow, let the buttons jump.
        # But we need them for LLE to know the connectivity.
        {"id": "e6", "source": "n-choice-scene", "target": "n-set-high", "type": "exec"},
        {"id": "e7", "source": "n-choice-scene", "target": "n-set-low", "type": "exec"},
        {"id": "e8", "source": "n-set-high", "target": "n-roll", "type": "exec"},
        {"id": "e9", "source": "n-set-low", "target": "n-roll", "type": "exec"},
        {"id": "e10", "source": "n-roll", "target": "n-bet-gate", "type": "exec"},
        {"id": "e11", "source": "n-bet-gate", "target": "n-h-gate", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e12", "source": "n-bet-gate", "target": "n-l-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e13", "source": "n-h-gate", "target": "n-win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e14", "source": "n-h-gate", "target": "n-lose", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e15", "source": "n-l-gate", "target": "n-win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e16", "source": "n-l-gate", "target": "n-lose", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e17", "source": "n-win", "target": "n-res-scene", "type": "exec"},
        {"id": "e18", "source": "n-lose", "target": "n-res-scene", "type": "exec"},
        {"id": "e19", "source": "n-res-scene", "target": "n-reward-hub", "type": "exec"},
        {"id": "e20", "source": "n-reward-hub", "target": "n-gold-res", "type": "resource", "data": {"resourceAmountExpression": "gold_gain"}},
        {"id": "e21", "source": "n-gold-res", "target": "n-loop-gate", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_주사위_홀짝_v5.json', 'w', encoding='utf-8') as f:
    json.dump(game1, f, ensure_ascii=False, indent=2)

print("V5 생성 완료! choice -> scene 타입 변경으로 UI 버튼 작동 보장.")
