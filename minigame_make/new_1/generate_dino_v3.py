import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0,
    "survival_score": 0,
    "dino_hp": 3,
    "hurdle_type": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

game1_v3 = {
    "version": 1,
    "designName": "게임1_구글_공룡_v3_정석_선택",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-dino", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "dino_hp", "type": "number", "value": "3"},
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
                        "title": {"type": "Text", "props": {"text": "🦖 공룡 v3 (정석 Choice)", "variant": "title"}, "children": []},
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
                    {"key": "dino_hp", "type": "number", "value": "3"},
                    {"key": "survival_score", "type": "number", "value": "0"},
                    {"key": "hurdle_type", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-hp-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "생존?", "condition": "dino_hp >= 1", "sdtEffects": sdt()}
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
        # ─── CHOICE TYPE: Should block in simulation mode ───
        {
            "id": "n-choice-bet", "type": "choice",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "회피 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["hp-txt"]},
                        "hp-txt": {"type": "Text", "props": {"text": "❤️ HP: {{dino_hp}} | 🏆 점수: {{survival_score}}", "variant": "tabular"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["h-title", "sp1", "btn-h", "sp2", "btn-l"]},
                        "h-title": {"type": "Text", "props": {"text": "⚠️ 장애물 발견!", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn-h": {
                            "type": "Button",
                            "props": {"label": "🦘 점프! (지상)", "variant": "primary", "targetNodeId": "n-check-jump"},
                            "children": []
                        },
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn-l": {
                            "type": "Button",
                            "props": {"label": "📉 숙이기! (공중)", "variant": "primary", "targetNodeId": "n-check-duck"},
                            "children": []
                        }
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
            "id": "n-success-score", "type": "trigger",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "회피 성공!",
                "attributes": [{"key": "survival_score", "type": "number", "value": "survival_score + 10"}],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n-fail-damage", "type": "trigger",
            "position": {"x": 800, "y": 900},
            "data": {
                "label": "충돌!",
                "attributes": [{"key": "dino_hp", "type": "number", "value": "dino_hp - 1"}],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-calc-final", "type": "trigger",
            "position": {"x": 800, "y": 450},
            "data": {
                "label": "보상 계산",
                "attributes": [{"key": "money_gain", "type": "number", "value": "survival_score * 0.5"}],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 800, "y": 600},
            "data": {"label": "보상 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n-res-gold", "type": "resource",
            "position": {"x": 800, "y": 750},
            "data": {"label": "골드 지급", "resourceId": "res-gold-dino", "resourceKey": "gold"}
        },
        {
            "id": "n-end", "type": "success",
            "position": {"x": 1000, "y": 450},
            "data": {
                "label": "결과",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "txt-s", "txt-g", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🏆 게임 종료!", "variant": "title"}, "children": []},
                        "txt-s": {"type": "Text", "props": {"text": "최종 점수: {{survival_score}}", "variant": "subtitle"}, "children": []},
                        "txt-g": {"type": "Text", "props": {"text": "획득 골드: {{gold}} G", "variant": "muted"}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "다시 하기", "variant": "primary", "targetNodeId": "n-init"}, "children": []}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e2", "source": "n-init", "target": "n-hp-gate", "type": "exec"},
        {"id": "e3", "source": "n-hp-gate", "target": "n-spawn-hurdle", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e4", "source": "n-hp-gate", "target": "n-calc-final", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e5", "source": "n-spawn-hurdle", "target": "n-choice-bet", "type": "exec"},
        # Choice edges - MUST BE PRESENT
        {"id": "e6", "source": "n-choice-bet", "target": "n-check-jump", "type": "exec"},
        {"id": "e7", "source": "n-choice-bet", "target": "n-check-duck", "type": "exec"},
        {"id": "e8", "source": "n-check-jump", "target": "n-success-score", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n-check-jump", "target": "n-fail-damage", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n-check-duck", "target": "n-success-score", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e11", "source": "n-check-duck", "target": "n-fail-damage", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e12", "source": "n-success-score", "target": "n-hp-gate", "type": "exec"},
        {"id": "e13", "source": "n-fail-damage", "target": "n-hp-gate", "type": "exec"},
        {"id": "e14", "source": "n-calc-final", "target": "n-reward-hub", "type": "exec"},
        {"id": "e15", "source": "n-reward-hub", "target": "n-res-gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e16", "source": "n-res-gold", "target": "n-end", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_구글_공룡_v3_정석_선택.json', 'w', encoding='utf-8') as f:
    json.dump(game1_v3, f, ensure_ascii=False, indent=2)

print("공룡 달리기 V3 생성 완료! 정석 choice 노드 및 모든 엣지 복구.")
