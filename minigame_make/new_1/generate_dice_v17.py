import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "bet_high": -1, "roll": 0, "money_gain": 0, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

dice_v17 = {
    "version": 1,
    "designName": "주사위_게임_v17_수식제거_정공법",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "badge_dollar_sign"}
    ],
    "attributes": [
        {"key": "total_games", "type": "number", "value": "0"},
        {"key": "total_wins", "type": "number", "value": "0"},
        {"key": "win_rate", "type": "number", "value": "0"},
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v17 (Stable)", "variant": "title"}, "children": []},
                        "b": {"type": "Button", "props": {"label": "게임 시작", "variant": "primary", "targetNodeId": "n_global_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_global_init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "전역 초기화",
                "attributes": [
                    {"key": "total_games", "type": "number", "value": "0"},
                    {"key": "total_wins", "type": "number", "value": "0"},
                    {"key": "win_rate", "type": "number", "value": "0"},
                    {"key": "gold", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_round_init", "type": "trigger",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "라운드 초기화",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "-1"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_choice_bet", "type": "choice",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "높음/낮음 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "btn_high", "sp2", "btn_low", "sp3", "rate_info"]},
                        "title": {"type": "Text", "props": {"text": "주사위가 높을까요, 낮을까요?", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn_high": {"type": "Button", "props": {"label": "📈 높음 (4~6) 선택", "variant": "primary", "targetNodeId": "n_high_calc"}},
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn_low": {"type": "Button", "props": {"label": "📉 낮음 (1~3) 선택", "variant": "secondary", "targetNodeId": "n_low_calc"}},
                        "sp3": {"type": "Spacer", "props": {}, "children": []},
                        "rate_info": {"type": "Text", "props": {"text": "📊 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 200, "y": 600},
            "data": {
                "label": "높음 주사위",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"}
                ]
            }
        },
        {
            "id": "n_low_calc", "type": "trigger",
            "position": {"x": 600, "y": 600},
            "data": {
                "label": "낮음 주사위",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "0"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"}
                ]
            }
        },
        {
            "id": "n_gate_high", "type": "gate",
            "position": {"x": 200, "y": 750},
            "data": {"label": "성공?", "condition": "roll >= 4"}
        },
        {
            "id": "n_gate_low", "type": "gate",
            "position": {"x": 600, "y": 750},
            "data": {"label": "성공?", "condition": "roll <= 3"}
        },
        # SUCCESS PATH
        {
            "id": "n_logic_win", "type": "trigger",
            "position": {"x": 300, "y": 900},
            "data": {
                "label": "승리 처리",
                "attributes": [
                    {"key": "total_wins", "type": "number", "value": "total_wins + 1"},
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "1"}
                ]
            }
        },
        {
            "id": "n_ui_win", "type": "choice",
            "position": {"x": 300, "y": 1050},
            "data": {
                "label": "승리 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "w", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🎉 승리!", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "💰 보상 받기 (1G)", "variant": "primary", "targetNodeId": "n_reward_hub"}, "children": []}
                    }
                }
            }
        },
        # FAIL PATH
        {
            "id": "n_logic_fail", "type": "trigger",
            "position": {"x": 700, "y": 900},
            "data": {
                "label": "패배 처리",
                "attributes": [
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_ui_fail", "type": "choice",
            "position": {"x": 700, "y": 1050},
            "data": {
                "label": "패배 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "w", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "😢 패배", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 하기", "variant": "secondary", "targetNodeId": "n_round_init"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 300, "y": 1200},
            "data": {"label": "보상 허브"}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 300, "y": 1350},
            "data": {"label": "골드 지급", "resourceId": "res_gold", "resourceKey": "gold"}
        },
        # SETTLE / END
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 300, "y": 1500},
            "data": {
                "label": "승리 정산 완료",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "m", "sp", "b1", "b2"]},
                        "t": {"type": "Text", "props": {"text": "💰 정산 완료!", "variant": "title"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "주머니가 두둑해졌어요!", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "b1": {"type": "Button", "props": {"label": "🎲 다시 하기", "variant": "primary", "targetNodeId": "n_round_init"}},
                        "b2": {"type": "Button", "props": {"label": "🚪 게임 종료", "variant": "secondary", "targetNodeId": "n_final_score"}}
                    }
                }
            }
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 500, "y": 1700},
            "data": {
                "label": "최종 결과",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r1", "r2", "r3", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏁 최종 스코어", "variant": "title"}},
                        "r1": {"type": "Text", "props": {"text": "최종 골드: {{gold}} G", "variant": "subtitle"}},
                        "r2": {"type": "Text", "props": {"text": "전체 판수: {{total_games}} 회", "variant": "subtitle"}},
                        "r3": {"type": "Text", "props": {"text": "최종 성공률: {{win_rate}} %", "variant": "subtitle"}},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "새 게임", "variant": "primary", "targetNodeId": "n_global_init"}}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_global_init", "type": "exec"},
        {"id": "e2", "source": "n_global_init", "target": "n_round_init", "type": "exec"},
        {"id": "e3", "source": "n_round_init", "target": "n_choice_bet", "type": "exec"},
        {"id": "e4", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e5", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e6", "source": "n_high_calc", "target": "n_gate_high", "type": "exec"},
        {"id": "e7", "source": "n_low_calc", "target": "n_gate_low", "type": "exec"},
        # Logic
        {"id": "e8", "source": "n_gate_high", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n_gate_high", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n_gate_low", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e11", "source": "n_gate_low", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        # To Result Scenes
        {"id": "e12", "source": "n_logic_win", "target": "n_ui_win", "type": "exec"},
        {"id": "e13", "source": "n_logic_fail", "target": "n_ui_fail", "type": "exec"},
        # Success path
        {"id": "e14", "source": "n_ui_win", "target": "n_reward_hub", "type": "exec"},
        {"id": "e15", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e15_res", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e16", "source": "n_res_gold", "target": "n_settle_win", "type": "exec"},
        # Loop or End
        {"id": "e17", "source": "n_settle_win", "target": "n_round_init", "type": "exec"},
        {"id": "e18", "source": "n_settle_win", "target": "n_final_score", "type": "exec"},
        {"id": "e19", "source": "n_ui_fail", "target": "n_round_init", "type": "exec"},
        {"id": "e20", "source": "n_ui_fail", "target": "n_final_score", "type": "exec"},
        {"id": "e21", "source": "n_final_score", "target": "n_global_init", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v17_수식제거_정공법.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v17, f, ensure_ascii=False, indent=2)

print("주사위 게임 V17 생성 완료! 수식 제거 및 승리/패배 화면 분리 적용.")
