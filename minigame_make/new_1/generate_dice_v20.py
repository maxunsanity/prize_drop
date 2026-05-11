import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "bet_high": -1, "roll": 0, "money_gain": 0, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

dice_v20 = {
    "version": 1,
    "designName": "주사위_게임_v20_승패완벽분리",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "badge_dollar_sign"},
        {"id": "res_dice", "key": "dice", "name": "주사위", "color": "#FFFFFF", "icon": "dice_5"}
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v20 (Final Fix)", "variant": "title"}, "children": []},
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
                "label": "전역 초기화 (10개)",
                "attributes": [
                    {"key": "total_games", "type": "number", "value": "0"},
                    {"key": "total_wins", "type": "number", "value": "0"},
                    {"key": "win_rate", "type": "number", "value": "0"},
                    {"key": "gold", "type": "number", "value": "0"},
                    {"key": "dice", "type": "number", "value": "10"}
                ]
            }
        },
        {
            "id": "n_gate_dice_check", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "주사위 잔량 체크", "condition": "dice > 0"}
        },
        {
            "id": "n_round_init", "type": "trigger",
            "position": {"x": 200, "y": 450},
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
            "position": {"x": 200, "y": 600},
            "data": {
                "label": "베팅 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["m1", "m2"]},
                        "m1": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "m2": {"type": "ResourceMeter", "props": {"resourceKey": "dice"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "btn_high", "sp2", "btn_low", "sp3", "rate_info"]},
                        "title": {"type": "Text", "props": {"text": "높음? 낮음?", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn_high": {"type": "Button", "props": {"label": "📈 높음 선택", "variant": "primary", "targetNodeId": "n_high_calc"}},
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn_low": {"type": "Button", "props": {"label": "📉 낮음 선택", "variant": "secondary", "targetNodeId": "n_low_calc"}},
                        "sp3": {"type": "Spacer", "props": {}, "children": []},
                        "rate_info": {"type": "Text", "props": {"text": "📊 누적 승률: {{win_rate}}% (남은 주사위: {{dice}}개)", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 100, "y": 750},
            "data": {
                "label": "높음 (주사위-1)",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"},
                    {"key": "dice", "type": "number", "value": "dice - 1"}
                ]
            }
        },
        {
            "id": "n_low_calc", "type": "trigger",
            "position": {"x": 300, "y": 750},
            "data": {
                "label": "낮음 (주사위-1)",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "0"},
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "total_games", "type": "number", "value": "total_games + 1"},
                    {"key": "dice", "type": "number", "value": "dice - 1"}
                ]
            }
        },
        {
            "id": "n_gate_check", "type": "gate",
            "position": {"x": 200, "y": 900},
            "data": {"label": "성공 판정", "condition": "(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)"}
        },
        # SUCCESS BRANCH
        {
            "id": "n_logic_win", "type": "trigger",
            "position": {"x": 100, "y": 1050},
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
            "position": {"x": 100, "y": 1200},
            "data": {
                "label": "승리 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "w", "d", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🎉 승리!", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "d": {"type": "Text", "props": {"text": "🔍 보유 주사위: {{dice}}개", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "💰 보상 받기 (1G)", "variant": "primary", "targetNodeId": "n_reward_hub"}, "children": []}
                    }
                }
            }
        },
        # FAIL BRANCH
        {
            "id": "n_logic_fail", "type": "trigger",
            "position": {"x": 400, "y": 1050},
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
            "position": {"x": 400, "y": 1200},
            "data": {
                "label": "패배 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "w", "d", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "😢 패배", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "d": {"type": "Text", "props": {"text": "🔍 보유 주사위: {{dice}}개", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 하기", "variant": "secondary", "targetNodeId": "n_gate_dice_check"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 100, "y": 1350},
            "data": {"label": "보상 허브"}
        },
        {
            "id": "n_res_gold", "type": "trigger",
            "position": {"x": 100, "y": 1500},
            "data": {
                "label": "골드 추가",
                "attributes": [{"key": "gold", "type": "number", "value": "gold + 1"}]
            }
        },
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 100, "y": 1650},
            "data": {
                "label": "정산 완료 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["m1", "m2"]},
                        "m1": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "m2": {"type": "ResourceMeter", "props": {"resourceKey": "dice"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "m", "sp", "b1", "b2"]},
                        "t": {"type": "Text", "props": {"text": "💰 정산 완료!", "variant": "title"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "🔍 남은 주사위: {{dice}}개", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "b1": {"type": "Button", "props": {"label": "🎲 한 판 더!", "variant": "primary", "targetNodeId": "n_gate_dice_check"}},
                        "b2": {"type": "Button", "props": {"label": "🚪 게임 종료", "variant": "secondary", "targetNodeId": "n_final_score"}}
                    }
                }
            }
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 600, "y": 1500},
            "data": {
                "label": "최종 결과 레포트",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r1", "r2", "r3", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏁 최종 레포트", "variant": "title"}},
                        "r1": {"type": "Text", "props": {"text": "최종 골드: {{gold}} G", "variant": "subtitle"}},
                        "r2": {"type": "Text", "props": {"text": "최종 판수: {{total_games}} 회", "variant": "subtitle"}},
                        "r3": {"type": "Text", "props": {"text": "최종 성공률: {{win_rate}} %", "variant": "subtitle"}},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "새 게임 시작", "variant": "primary", "targetNodeId": "n_global_init"}}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_global_init", "type": "exec"},
        {"id": "e_check", "source": "n_global_init", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_round", "source": "n_gate_dice_check", "target": "n_round_init", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e_over", "source": "n_gate_dice_check", "target": "n_final_score", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e_start", "source": "n_round_init", "target": "n_choice_bet", "type": "exec"},
        {"id": "e_h", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e_l", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e_gh", "source": "n_high_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e_gl", "source": "n_low_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e_win", "source": "n_gate_check", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e_fail", "source": "n_gate_check", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e_uwin", "source": "n_logic_win", "target": "n_ui_win", "type": "exec"},
        {"id": "e_ufail", "source": "n_logic_fail", "target": "n_ui_fail", "type": "exec"},
        {"id": "e_rew", "source": "n_ui_win", "target": "n_reward_hub", "type": "exec"},
        {"id": "e_gold", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e_settle", "source": "n_res_gold", "target": "n_settle_win", "type": "exec"},
        {"id": "e_loop_win", "source": "n_settle_win", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_end_win", "source": "n_settle_win", "target": "n_final_score", "type": "exec"},
        {"id": "e_loop_fail", "source": "n_ui_fail", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_end_fail", "source": "n_ui_fail", "target": "n_final_score", "type": "exec"},
        {"id": "e_restart", "source": "n_final_score", "target": "n_global_init", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v20_승패완벽분리.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v20, f, ensure_ascii=False, indent=2)

print("주사위 게임 V20 생성 완료! 승리/패배 전용 화면 완전 분리 적용.")
