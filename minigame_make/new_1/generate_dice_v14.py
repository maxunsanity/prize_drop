import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 100,
    "bet_high": -1,
    "roll": 0,
    "money_gain": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

def create_sample_style_btn(label, target_id, variant="primary"):
    return {
        "on": {
            "press": {
                "action": "setState",
                "params": {
                    "value": target_id,
                    "statePath": "/sim.activeScene"
                }
            }
        },
        "type": "Button",
        "props": {
            "label": label,
            "variant": variant,
            "targetNodeId": target_id
        },
        "children": []
    }

dice_v14 = {
    "version": 1,
    "designName": "주사위_게임_v14_무한루프_확률표기",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "badge_dollar_sign"}
    ],
    "attributes": [
        {"key": "bet_high", "type": "number", "value": "-1"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "진입",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "b"]},
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v14 (Infinity)", "variant": "title"}, "children": []},
                        "b": {"type": "Button", "props": {"label": "게임 시작", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "-1"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n_choice_bet", "type": "choice",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "높음/낮음 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "btn_high", "sp2", "btn_low", "sp3", "rate_txt"]},
                        "title": {"type": "Text", "props": {"text": "주사위가 높을까요, 낮을까요?", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn_high": create_sample_style_btn("📈 높음 (4~6) 선택", "n_high_calc", "primary"),
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn_low": create_sample_style_btn("📉 낮음 (1~3) 선택", "n_low_calc", "secondary"),
                        "sp3": {"type": "Spacer", "props": {}, "children": []},
                        "rate_txt": {"type": "Text", "props": {"text": "예측 성공률: 50%", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 200, "y": 450},
            "data": {
                "label": "높음 굴리기",
                "attributes": [{"key": "bet_high", "type": "number", "value": "1"}, {"key": "roll", "type": "number", "value": "rand.d6()"}],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_low_calc", "type": "trigger",
            "position": {"x": 600, "y": 450},
            "data": {
                "label": "낮음 굴리기",
                "attributes": [{"key": "bet_high", "type": "number", "value": "0"}, {"key": "roll", "type": "number", "value": "rand.d6()"}],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_gate_high", "type": "gate",
            "position": {"x": 200, "y": 600},
            "data": {"label": "높음 성공?", "condition": "roll >= 4", "sdtEffects": sdt()}
        },
        {
            "id": "n_gate_low", "type": "gate",
            "position": {"x": 600, "y": 600},
            "data": {"label": "낮음 성공?", "condition": "roll <= 3", "sdtEffects": sdt()}
        },
        # SUCCESS RESULT SCENE
        {
            "id": "n_show_success", "type": "scene",
            "position": {"x": 300, "y": 750},
            "data": {
                "label": "🎉 결과: 성공!",
                "attributes": [{"key": "money_gain", "type": "number", "value": "10"}],
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "m", "sp", "btn", "retry_btn"]},
                        "t": {"type": "Text", "props": {"text": "🎉 예측 성공!", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "축하합니다! 10G를 획득하세요!", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "보상 받기", "variant": "primary", "targetNodeId": "n_reward_hub"}, "children": []},
                        "retry_btn": {"type": "Button", "props": {"label": "다시 하기", "variant": "secondary", "targetNodeId": "n_init"}, "children": []}
                    }
                }
            }
        },
        # FAIL RESULT SCENE
        {
            "id": "n_show_fail", "type": "scene",
            "position": {"x": 500, "y": 750},
            "data": {
                "label": "😢 결과: 실패",
                "attributes": [{"key": "money_gain", "type": "number", "value": "0"}],
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "m", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "😢 예측 실패", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "아쉽네요. 다시 도전해보세요!", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 도전하기", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 300, "y": 900},
            "data": {"label": "보상 정산", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 300, "y": 1050},
            "data": {"label": "골드 추가", "resourceId": "res_gold", "resourceKey": "gold"}
        },
        {
            "id": "n_end", "type": "success",
            "position": {"x": 400, "y": 1200},
            "data": {
                "label": "최종 종료",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "b"]},
                        "t": {"type": "Text", "props": {"text": "게임이 완료되었습니다.", "variant": "muted"}, "children": []},
                        "b": {"type": "Button", "props": {"label": "처음부터 다시", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_init", "type": "exec"},
        {"id": "e2", "source": "n_init", "target": "n_choice_bet", "type": "exec"},
        {"id": "e3", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e4", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e5", "source": "n_high_calc", "target": "n_gate_high", "type": "exec"},
        {"id": "e6", "source": "n_low_calc", "target": "n_gate_low", "type": "exec"},
        {"id": "e7", "source": "n_gate_high", "target": "n_show_success", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e8", "source": "n_gate_high", "target": "n_show_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e9", "source": "n_gate_low", "target": "n_show_success", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e10", "source": "n_gate_low", "target": "n_show_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e11", "source": "n_show_success", "target": "n_reward_hub", "type": "exec"},
        {"id": "e12", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e12_res", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e13", "source": "n_res_gold", "target": "n_end", "type": "exec"},
        # Loop back from Result scenes
        {"id": "e14", "source": "n_show_fail", "target": "n_init", "type": "exec"},
        {"id": "e15", "source": "n_end", "target": "n_init", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v14_무한루프_확률표기.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v14, f, ensure_ascii=False, indent=2)

print("주사위 게임 V14 생성 완료! 무한 다시하기 및 성공률(50%) 표기 적용.")
