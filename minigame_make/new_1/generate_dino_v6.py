import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "survival_score": 0, "money_gain": 0, "hurdle_type": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

def create_dino_btn(id, label, target_node_id):
    return {
        "on": {
            "press": {
                "action": "setState",
                "params": {
                    "value": target_node_id,
                    "statePath": "/sim.activeScene"
                }
            }
        },
        "type": "Button",
        "props": {
            "label": label,
            "variant": "primary",
            "targetNodeId": target_node_id
        },
        "children": []
    }

game1_v6 = {
    "version": 1,
    "designName": "게임1_구글_공룡_v6_비주얼분기",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-dino", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "survival_score", "type": "number", "value": "0"},
        {"key": "hurdle_type", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "진입",
                "mockSpec": {
                    "root": "root",
                    "elements": {
                        "root": {"type": "Screen", "props": {}, "children": ["title", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🦖 공룡 v6 (비주얼 분기)", "variant": "title"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "게임 시작", "variant": "primary", "targetNodeId": "n-init"}, "children": []}
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
                    {"key": "survival_score", "type": "number", "value": "0"},
                    {"key": "hurdle_type", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-goal-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "미션 중?", "condition": "survival_score < 100", "sdtEffects": sdt()}
        },
        {
            "id": "n-spawn-hurdle", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "장애물 결정",
                "attributes": [{"key": "hurdle_type", "type": "number", "value": "rand.d6() % 2 + 1"}],
                "sdtEffects": sdt()
            }
        },
        # ─── VISUAL BRANCHING: Split flow here ───
        {
            "id": "n-type-gate", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "지상 장애물?", "condition": "hurdle_type == 1", "sdtEffects": sdt()}
        },
        # 🟢 Ground Path (Cactus)
        {
            "id": "n-scene-cactus", "type": "choice",
            "position": {"x": 200, "y": 750},
            "data": {
                "label": "🌵 지상 선인장!",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "desc", "btn-j", "btn-d"]},
                        "t": {"type": "Text", "props": {"text": "🌵 선인장 출현!", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "점프해서 피하세요!", "variant": "subtitle"}, "children": []},
                        "btn-j": {"type": "Button", "props": {"label": "🦘 점프 (성공)", "variant": "primary", "targetNodeId": "n-success-step"}, "children": []},
                        "btn-d": {"type": "Button", "props": {"label": "📉 숙이기 (실패)", "variant": "secondary", "targetNodeId": "n-fail-trigger"}, "children": []}
                    }
                }
            }
        },
        # 🔵 Air Path (Bird)
        {
            "id": "n-scene-bird", "type": "choice",
            "position": {"x": 600, "y": 750},
            "data": {
                "label": "🐦‍ 공중 익룡!",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "desc", "btn-d", "btn-j"]},
                        "t": {"type": "Text", "props": {"text": "🐦‍ 익룡 출현!", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "숙여서 피하세요!", "variant": "subtitle"}, "children": []},
                        "btn-d": {"type": "Button", "props": {"label": "📉 숙이기 (성공)", "variant": "primary", "targetNodeId": "n-success-step"}, "children": []},
                        "btn-j": {"type": "Button", "props": {"label": "🦘 점프 (실패)", "variant": "secondary", "targetNodeId": "n-fail-trigger"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n-success-step", "type": "trigger",
            "position": {"x": 400, "y": 950},
            "data": {
                "label": "회피 성공!",
                "attributes": [{"key": "survival_score", "type": "number", "value": "survival_score + 10"}],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n-fail-trigger", "type": "trigger",
            "position": {"x": 800, "y": 950},
            "data": {
                "label": "충돌 발생",
                "attributes": [{"key": "money_gain", "type": "number", "value": "0"}],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-gameover-scene", "type": "scene",
            "position": {"x": 1000, "y": 950},
            "data": {
                "label": "게임 오버",
                "mockSpec": {
                    "root": "root",
                    "elements": {
                        "root": {"type": "Screen", "props": {}, "children": ["t", "s", "btn"]},
                        "t": {"type": "Text", "props": {"text": "💀 GAME OVER", "variant": "title"}, "children": []},
                        "s": {"type": "Text", "props": {"text": "점수: {{survival_score}}", "variant": "subtitle"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "다시 하기", "variant": "primary", "targetNodeId": "n-init"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n-calc-success", "type": "trigger",
            "position": {"x": 600, "y": 300},
            "data": {
                "label": "성공 보상",
                "attributes": [{"key": "money_gain", "type": "number", "value": "500"}],
                "sdtEffects": sdt(c=3)
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 800, "y": 300},
            "data": {"label": "보상 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n-res-gold", "type": "resource",
            "position": {"x": 1000, "y": 300},
            "data": {"label": "골드 지급", "resourceId": "res-gold-dino", "resourceKey": "gold"}
        },
        {
            "id": "n-success-scene", "type": "success",
            "position": {"x": 1200, "y": 300},
            "data": {
                "label": "미션 성공!",
                "mockSpec": {
                    "root": "root",
                    "elements": {
                        "root": {"type": "Screen", "props": {}, "children": ["t", "g", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏆 MISSION COMPLETE!", "variant": "title"}, "children": []},
                        "g": {"type": "Text", "props": {"text": "보상: 500G", "variant": "subtitle"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "다시 하기", "variant": "primary", "targetNodeId": "n-init"}, "children": []}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e2", "source": "n-init", "target": "n-goal-gate", "type": "exec"},
        {"id": "e3", "source": "n-goal-gate", "target": "n-spawn-hurdle", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e4", "source": "n-goal-gate", "target": "n-calc-success", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e5", "source": "n-spawn-hurdle", "target": "n-type-gate", "type": "exec"},
        {"id": "e6", "source": "n-type-gate", "target": "n-scene-cactus", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e7", "source": "n-type-gate", "target": "n-scene-bird", "type": "exec", "data": {"gateBranch": "false"}},
        # Cactus interaction
        {"id": "e8", "source": "n-scene-cactus", "target": "n-success-step", "type": "exec"},
        {"id": "e9", "source": "n-scene-cactus", "target": "n-fail-trigger", "type": "exec"},
        # Bird interaction
        {"id": "e10", "source": "n-scene-bird", "target": "n-success-step", "type": "exec"},
        {"id": "e11", "source": "n-scene-bird", "target": "n-fail-trigger", "type": "exec"},
        # Finish logic
        {"id": "e12", "source": "n-success-step", "target": "n-goal-gate", "type": "exec"},
        {"id": "e13", "source": "n-fail-trigger", "target": "n-gameover-scene", "type": "exec"},
        {"id": "e14", "source": "n-calc-success", "target": "n-reward-hub", "type": "exec"},
        {"id": "e15", "source": "n-reward-hub", "target": "n-res-gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e16", "source": "n-res-gold", "target": "n-success-scene", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_구글_공룡_v6_비주얼분기.json', 'w', encoding='utf-8') as f:
    json.dump(game1_v6, f, ensure_ascii=False, indent=2)

print("공룡 달리기 V6 생성 완료! 지상/공중 비주얼 분기 로직 적용.")
