import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 100,
    "bet_high": -1,
    "roll": 0,
    "is_win": 0,
    "money_gain": 0,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# The Sample Magic: setState for activeScene
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

dice_v9 = {
    "version": 1,
    "designName": "주사위_게임_v9_샘플방식",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "badge_dollar_sign"}
    ],
    "attributes": [
        {"key": "bet_high", "type": "number", "value": "-1"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "is_win", "type": "number", "value": "0"},
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 예측 (v9 Sample Style)", "variant": "title"}, "children": []},
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
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "btn_high", "sp2", "btn_low"]},
                        "title": {"type": "Text", "props": {"text": "주사위가 높을까요, 낮을까요?", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn_high": create_sample_style_btn("📈 높음 (4~6) 선택", "n_high_logic", "primary"),
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn_low": create_sample_style_btn("📉 낮음 (1~3) 선택", "n_low_logic", "secondary")
                    }
                }
            }
        },
        {
            "id": "n_high_logic", "type": "trigger",
            "position": {"x": 200, "y": 450},
            "data": {
                "label": "높음 선택 처리",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "is_win", "type": "number", "value": "roll >= 4 ? 1 : 0"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_low_logic", "type": "trigger",
            "position": {"x": 600, "y": 450},
            "data": {
                "label": "낮음 선택 처리",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "0"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "is_win", "type": "number", "value": "roll <= 3 ? 1 : 0"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_check_win", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "승리?", "condition": "is_win == 1", "sdtEffects": sdt()}
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 250, "y": 750},
            "data": {"label": "승리 보상 허브", "sdtEffects": sdt(c=2)}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 250, "y": 900},
            "data": {"label": "골드 지급", "resourceId": "res_gold", "resourceKey": "gold"}
        },
        {
            "id": "n_end", "type": "success",
            "position": {"x": 400, "y": 1050},
            "data": {
                "label": "결과 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "roll_txt", "res_txt", "sp", "btn"]},
                        "title": {"type": "Text", "props": {"text": "🎲 주사위 결과", "variant": "title"}, "children": []},
                        "roll_txt": {"type": "Text", "props": {"text": "나온 숫자: {{roll}}", "variant": "subtitle"}, "children": []},
                        "res_txt": {"type": "Text", "props": {"text": "{{is_win == 1 ? '🎉 축하합니다! 예측 성공!' : '😢 아쉬워요! 예측 실패!'}}", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "다시 하기", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_init", "type": "exec"},
        {"id": "e2", "source": "n_init", "target": "n_choice_bet", "type": "exec"},
        # Branching via buttons (Mockup setState + targetNodeId)
        {"id": "e3", "source": "n_choice_bet", "target": "n_high_logic", "type": "exec"},
        {"id": "e4", "source": "n_choice_bet", "target": "n_low_logic", "type": "exec"},
        # Back to main flow
        {"id": "e5", "source": "n_high_logic", "target": "n_check_win", "type": "exec"},
        {"id": "e6", "source": "n_low_logic", "target": "n_check_win", "type": "exec"},
        {"id": "e7", "source": "n_check_win", "target": "n_reward_hub", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e8", "source": "n_check_win", "target": "n_end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e9", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "10"}},
        {"id": "e10", "source": "n_res_gold", "target": "n_end", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v9_샘플방식.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v9, f, ensure_ascii=False, indent=2)

print("주사위 게임 V9 생성 완료! 샘플 파일의 setState 방식 적용.")
