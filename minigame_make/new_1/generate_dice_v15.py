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
    "total_games": 0,
    "total_wins": 0,
    "win_rate": 0,
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

dice_v15 = {
    "version": 1,
    "designName": "주사위_게임_v15_누적데이터_보상후재시작",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "badge_dollar_sign"}
    ],
    "attributes": [
        {"key": "bet_high", "type": "number", "value": "-1"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"},
        {"key": "total_games", "type": "number", "value": "0"},
        {"key": "total_wins", "type": "number", "value": "0"},
        {"key": "win_rate", "type": "number", "value": "0"}
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v15 (Data Tracker)", "variant": "title"}, "children": []},
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
                "label": "판수 초기화",
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
                        "rate_txt": {"type": "Text", "props": {"text": "📈 누적 승률: {{win_rate}}% ({{total_wins}}/{{total_games}})", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 200, "y": 450},
            "data": {
                "label": "높음 굴리기",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_low_calc", "type": "trigger",
            "position": {"x": 600, "y": 450},
            "data": {
                "label": "낮음 굴리기",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "0"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"}
                ],
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
        {
            "id": "n_success_logic", "type": "trigger",
            "position": {"x": 400, "y": 750},
            "data": {
                "label": "승리 데이터 기록",
                "attributes": [
                    {"key": "total_wins", "type": "number", "value": "total_wins + 1"},
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "10"}
                ]
            }
        },
        {
            "id": "n_fail_logic", "type": "trigger",
            "position": {"x": 800, "y": 750},
            "data": {
                "label": "실패 데이터 기록",
                "attributes": [
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_show_result", "type": "choice",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "결과 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "w", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "{{money_gain > 0 ? '🎉 예측 성공!' : '😢 예측 실패'}}", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "{{money_gain > 0 ? '💰 보상 받기' : '🔄 다시 도전'}}", "variant": "primary", "targetNodeId": "{{money_gain > 0 ? 'n_reward_hub' : 'n_init'}}"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "보상 정산", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 400, "y": 1200},
            "data": {"label": "골드 추가", "resourceId": "res_gold", "resourceKey": "gold"}
        },
        {
            "id": "n_end", "type": "success",
            "position": {"x": 400, "y": 1350},
            "data": {
                "label": "정산 완료 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "desc", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "💰 보상 획득 완료!", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "주머니가 두둑해졌어요! 한 판 더 하실래요?", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "🎲 다시 하기", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
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
        # Logic to Data tracking
        {"id": "e7", "source": "n_gate_high", "target": "n_success_logic", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e8", "source": "n_gate_high", "target": "n_fail_logic", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e9", "source": "n_gate_low", "target": "n_success_logic", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e10", "source": "n_gate_low", "target": "n_fail_logic", "type": "exec", "data": {"gateBranch": "false"}},
        # To Result Scene
        {"id": "e11", "source": "n_success_logic", "target": "n_show_result", "type": "exec"},
        {"id": "e12", "source": "n_fail_logic", "target": "n_show_result", "type": "exec"},
        # From Result
        {"id": "e13", "source": "n_show_result", "target": "n_reward_hub", "type": "exec", "data": {"onExec": {"action": "setState", "params": {"value": "n_reward_hub", "statePath": "/sim.activeScene"}}}},
        {"id": "e14", "source": "n_show_result", "target": "n_init", "type": "exec"},
        # Reward flow
        {"id": "e15", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e15_res", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e16", "source": "n_res_gold", "target": "n_end", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v15_누적데이터_보상후재시작.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v15, f, ensure_ascii=False, indent=2)

print("주사위 게임 V15 생성 완료! 누적 승률 트래킹 및 보상 후 재시작 로직 적용.")
