import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0,
    "survival_score": 0,
    "money_gain": 0,
    "hurdle_type": 0,
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

game1_v4 = {
    "version": 1,
    "designName": "게임1_구글_공룡_v4_성패_구분",
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
                        "title": {"type": "Text", "props": {"text": "🦖 공룡 v4 (성공 vs 실패)", "variant": "title"}, "children": []},
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
            "data": {"label": "100점 미만?", "condition": "survival_score < 100", "sdtEffects": sdt()}
        },
        {
            "id": "n-spawn-hurdle", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "장애물 출현",
                "attributes": [
                    {"key": "hurdle_type", "type": "number", "value": "rand.d6() % 2 + 1"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-choice-bet", "type": "choice",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "회피 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["score-txt"]},
                        "score-txt": {"type": "Text", "props": {"text": "🏆 현재 점수: {{survival_score}} / 100", "variant": "tabular"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["h-title", "sp1", "btn-h", "sp2", "btn-l"]},
                        "h-title": {"type": "Text", "props": {"text": "⚠️ 장애물 출현!", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn-h": create_dino_btn("btn-h", "🦘 점프! (지상)", "n-check-jump"),
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn-l": create_dino_btn("btn-l", "📉 숙이기! (공중)", "n-check-duck")
                    }
                }
            }
        },
        {
            "id": "n-check-jump", "type": "gate",
            "position": {"x": 200, "y": 750},
            "data": {"label": "점프 성공?", "condition": "hurdle_type == 1", "sdtEffects": sdt()}
        },
        {
            "id": "n-check-duck", "type": "gate",
            "position": {"x": 600, "y": 750},
            "data": {"label": "숙이기 성공?", "condition": "hurdle_type == 2", "sdtEffects": sdt()}
        },
        {
            "id": "n-success-step", "type": "trigger",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "회피 성공!",
                "attributes": [{"key": "survival_score", "type": "number", "value": "survival_score + 10"}],
                "sdtEffects": sdt(c=1)
            }
        },
        # ─── GAME OVER: Hit a hurdle ───
        {
            "id": "n-fail-gate", "type": "gate",
            "position": {"x": 800, "y": 900},
            "data": {"label": "실패 게이트", "condition": "1 == 1", "sdtEffects": sdt()} # Just for routing
        },
        {
            "id": "n-calc-fail", "type": "trigger",
            "position": {"x": 1000, "y": 900},
            "data": {
                "label": "실패 보상 (0)",
                "attributes": [{"key": "money_gain", "type": "number", "value": "0"}],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-gameover-scene", "type": "scene",
            "position": {"x": 1200, "y": 900},
            "data": {
                "label": "게임 오버 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "desc", "score", "sp1", "btn"]},
                        "title": {"type": "Text", "props": {"text": "💀 GAME OVER", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "장애물에 충돌했습니다!", "variant": "muted"}, "children": []},
                        "score": {"type": "Text", "props": {"text": "최종 점수: {{survival_score}}", "variant": "subtitle"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "다시 도전", "variant": "secondary", "targetNodeId": "n-init"}, "children": []}
                    }
                }
            }
        },
        # ─── SUCCESS: Reached 100 points ───
        {
            "id": "n-calc-success", "type": "trigger",
            "position": {"x": 600, "y": 300},
            "data": {
                "label": "성공 보상 (500)",
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
                "label": "미션 성공 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "desc", "gold", "sp1", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🏆 MISSION COMPLETE!", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "오빠의 완벽한 순발력!", "variant": "subtitle"}, "children": []},
                        "gold": {"type": "Text", "props": {"text": "보상 골드: 500 G", "variant": "tabular"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "한 번 더?", "variant": "primary", "targetNodeId": "n-init"}, "children": []}
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
        {"id": "e5", "source": "n-spawn-hurdle", "target": "n-choice-bet", "type": "exec"},
        {"id": "e6", "source": "n-choice-bet", "target": "n-check-jump", "type": "exec"},
        {"id": "e7", "source": "n-choice-bet", "target": "n-check-duck", "type": "exec"},
        {"id": "e8", "source": "n-check-jump", "target": "n-success-step", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n-check-jump", "target": "n-fail-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n-check-duck", "target": "n-success-step", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e11", "source": "n-check-duck", "target": "n-fail-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e12", "source": "n-success-step", "target": "n-goal-gate", "type": "exec"},
        {"id": "e13", "source": "n-fail-gate", "target": "n-calc-fail", "type": "exec"},
        {"id": "e14", "source": "n-calc-fail", "target": "n-gameover-scene", "type": "exec"},
        {"id": "e15", "source": "n-calc-success", "target": "n-reward-hub", "type": "exec"},
        {"id": "e16", "source": "n-reward-hub", "target": "n-res-gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e17", "source": "n-res-gold", "target": "n-success-scene", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_구글_공룡_v4_성패_구분.json', 'w', encoding='utf-8') as f:
    json.dump(game1_v4, f, ensure_ascii=False, indent=2)

print("공룡 달리기 V4 생성 완료! 성공/실패 화면 구분 및 원샷 원킬 룰 적용.")
