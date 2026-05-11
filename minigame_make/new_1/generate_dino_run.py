import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0,
    "survival_score": 0,
    "money_gain": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

dino_run = {
    "version": 1,
    "designName": "게임1_구글_공룡_달리기",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-dino", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "dino_speed_base", "type": "number", "value": "5"},
        {"key": "survival_score", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "공룡 달리기 준비",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "desc", "sp1", "btn-start"]},
                        "title": {"type": "Text", "props": {"text": "🦖 Jump Dino Run!", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "장애물을 피해 최대한 오래 살아남으세요!", "variant": "muted"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn-start": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🏁 달리기 시작!", "variant": "primary", "targetNodeId": "n-init"}, "children": []
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
                "label": "환경 초기화",
                "attributes": [
                    {"key": "dino_speed_base", "type": "number", "value": "5"},
                    {"key": "survival_score", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n-play-dino", "type": "action",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "미니게임 플레이",
                "duration": "long",
                "difficulty": 5,
                "description": "공룡이 선인장을 피하며 달립니다. 종료 시 survival_score가 합산됩니다.",
                "sdtEffects": sdt(c=2),
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "desc", "sp1", "progress"]},
                        "title": {"type": "Text", "props": {"text": "🏃‍♂️ 열심히 달리는 중...", "variant": "subtitle"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "장애물 접근 중! 점프하세요!", "variant": "muted"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "progress": {"type": "Progress", "props": {"value": 0.5}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n-calc-reward", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "보상 계산",
                "attributes": [
                    # Simulate random score for testing (0 ~ 1000)
                    {"key": "survival_score", "type": "number", "value": "rand.range(100, 1000)"},
                    {"key": "money_gain", "type": "number", "value": "survival_score * 0.1"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n-reward-gate", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "보상 있음?", "condition": "money_gain > 0", "sdtEffects": sdt()}
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 250, "y": 750},
            "data": {"label": "보상 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n-res-gold", "type": "resource",
            "position": {"x": 250, "y": 900},
            "data": {"label": "골드 획득", "resourceId": "res-gold-dino", "resourceKey": "gold"}
        },
        {
            "id": "n-end", "type": "success",
            "position": {"x": 400, "y": 1050},
            "data": {
                "label": "달리기 결과",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["gold-meter"]},
                        "gold-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "score-row", "gain-row", "sp1", "retry-btn"]},
                        "title": {"type": "Text", "props": {"text": "🏁 게임 오버!", "variant": "title"}, "children": []},
                        "score-row": {"type": "HStack", "props": {}, "children": ["lbl-s", "sp-s", "val-s"]},
                        "lbl-s": {"type": "Text", "props": {"text": "생존 점수", "variant": "muted"}, "children": []},
                        "sp-s": {"type": "Spacer", "props": {}, "children": []},
                        "val-s": {"type": "Text", "props": {"text": "{{survival_score}}", "variant": "tabular"}, "children": []},
                        "gain-row": {"type": "HStack", "props": {}, "children": ["lbl-g", "sp-g", "val-g"]},
                        "lbl-g": {"type": "Text", "props": {"text": "획득 골드", "variant": "muted"}, "children": []},
                        "sp-g": {"type": "Spacer", "props": {}, "children": []},
                        "val-g": {"type": "Text", "props": {"text": "+{{money_gain}} G", "variant": "tabular"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "retry-btn": {
                            "type": "Button", "props": {"label": "다시 달리기", "variant": "primary", "targetNodeId": "n-init"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT, "survival_score": 500, "money_gain": 50}
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e2", "source": "n-init", "target": "n-play-dino", "type": "exec"},
        {"id": "e3", "source": "n-play-dino", "target": "n-calc-reward", "type": "exec"},
        {"id": "e4", "source": "n-calc-reward", "target": "n-reward-gate", "type": "exec"},
        {"id": "e5", "source": "n-reward-gate", "target": "n-reward-hub", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e6", "source": "n-reward-gate", "target": "n-end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e7", "source": "n-reward-hub", "target": "n-res-gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e8", "source": "n-res-gold", "target": "n-end", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_구글_공룡_달리기.json', 'w', encoding='utf-8') as f:
    json.dump(dino_run, f, ensure_ascii=False, indent=2)

print("구글 공룡 달리기 게임 생성 완료!")
