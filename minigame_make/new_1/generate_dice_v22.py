import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "bet_high": -1, "roll": 0, "money_gain": 0, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

dice_v22 = {
    "version": 1,
    "designName": "주사위_게임_v22_무한충전소",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_gold", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "circle_dollar_sign"},
        {"id": "res_dice", "key": "dice", "name": "주사위", "color": "#FFFFFF", "icon": "dice_5"}
    ],
    "attributes": [
        {"key": "total_games", "type": "number", "value": "0"},
        {"key": "total_wins", "type": "number", "value": "0"},
        {"key": "win_rate", "type": "number", "value": "0"},
        {"key": "bet_high", "type": "number", "value": "-1"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"},
        {"key": "dice", "type": "number", "value": "10"}
    ],
    "nodes": [
        # THE FIX: Entry now shows dice and has refill button
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "메인 로비",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t_box", "d_info", "sp", "btn_start", "btn_refill"]},
                        "t_box": {"type": "VStack", "props": {}, "children": ["t1", "t2"]},
                        "t1": {"type": "Text", "props": {"text": "🎲 DICE MASTER", "variant": "title"}, "children": []},
                        "t2": {"type": "Text", "props": {"text": "운명을 향한 무한한 투척", "variant": "subtitle"}, "children": []},
                        "d_info": {"type": "Text", "props": {"text": "현재 보유 주사위: {{dice}}개", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn_start": {"type": "Button", "props": {"label": "모험 시작하기", "variant": "primary", "targetNodeId": "n_global_init"}},
                        "btn_refill": {"type": "Button", "props": {"label": "🔋 주사위 10개 충전", "variant": "secondary", "targetNodeId": "n_refill_logic"}}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_refill_logic", "type": "trigger",
            "position": {"x": 600, "y": 150},
            "data": {
                "label": "주사위 충전 (+10)",
                "attributes": [{"key": "dice", "type": "number", "value": "dice + 10"}]
            }
        },
        {
            "id": "n_global_init", "type": "trigger",
            "position": {"x": 400, "y": 200},
            "data": {
                "label": "게임 데이터 정렬",
                "attributes": [
                    {"key": "total_games", "type": "number", "value": "0"},
                    {"key": "total_wins", "type": "number", "value": "0"},
                    {"key": "win_rate", "type": "number", "value": "0"},
                    {"key": "gold", "type": "number", "value": "0"}
                    # dice is kept from entry
                ]
            }
        },
        {
            "id": "n_gate_dice_check", "type": "gate",
            "position": {"x": 400, "y": 350},
            "data": {"label": "주사위 잔량 체크", "condition": "dice > 0"}
        },
        {
            "id": "n_round_init", "type": "trigger",
            "position": {"x": 200, "y": 500},
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
            "position": {"x": 200, "y": 650},
            "data": {
                "label": "베팅 선택",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["m1", "m2"]},
                        "m1": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}},
                        "m2": {"type": "ResourceMeter", "props": {"resourceKey": "dice"}},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t_grp", "sp1", "btn_row", "sp2"]},
                        "t_grp": {"type": "VStack", "props": {"spacing": 8}, "children": ["t", "st"]},
                        "t": {"type": "Text", "props": {"text": "주사위를 던지세요!", "variant": "title"}},
                        "st": {"type": "Text", "props": {"text": "높을까요, 낮을까요?", "variant": "subtitle"}},
                        "sp1": {"type": "Spacer", "props": {}},
                        "btn_row": {"type": "HStack", "props": {"spacing": 16}, "children": ["bh", "bl"]},
                        "bh": {"type": "Button", "props": {"label": "📈 높음", "variant": "primary", "targetNodeId": "n_high_calc"}},
                        "bl": {"type": "Button", "props": {"label": "📉 낮음", "variant": "secondary", "targetNodeId": "n_low_calc"}},
                        "sp2": {"type": "Spacer", "props": {}},
                        "footer": {"type": "HStack", "props": {}, "children": ["f_t", "sp_f", "f_d"]},
                        "f_t": {"type": "Text", "props": {"text": "📊 성공률: {{win_rate}}%", "variant": "muted"}},
                        "sp_f": {"type": "Spacer", "props": {}},
                        "f_d": {"type": "Text", "props": {"text": "🎲 주사위: {{dice}}개", "variant": "muted"}}
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 100, "y": 800},
            "data": {
                "label": "높음 (-1)",
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
            "position": {"x": 300, "y": 800},
            "data": {
                "label": "낮음 (-1)",
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
            "position": {"x": 200, "y": 950},
            "data": {"label": "판정", "condition": "(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)"}
        },
        {
            "id": "n_ui_win", "type": "choice",
            "position": {"x": 100, "y": 1100},
            "data": {
                "label": "승리",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t", "r", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🎉 승리!", "variant": "title"}},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}},
                        "sp": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "💰 보상 받기", "variant": "primary", "targetNodeId": "n_reward_hub"}}
                    }
                }
            }
        },
        {
            "id": "n_ui_fail", "type": "choice",
            "position": {"x": 400, "y": 1100},
            "data": {
                "label": "패배",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t", "r", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "😢 패배", "variant": "title"}},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}},
                        "sp": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 하기", "variant": "secondary", "targetNodeId": "n_gate_dice_check"}}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 100, "y": 1250},
            "data": {"label": "보상 허브"}
        },
        {
            "id": "n_res_gold", "type": "trigger",
            "position": {"x": 100, "y": 1400},
            "data": {
                "label": "골드 +1",
                "attributes": [{"key": "gold", "type": "number", "value": "gold + 1"}]
            }
        },
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 100, "y": 1550},
            "data": {
                "label": "정산 완료",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t", "sp", "b1", "b2"]},
                        "t": {"type": "Text", "props": {"text": "💰 정산 완료!", "variant": "title"}},
                        "sp": {"type": "Spacer", "props": {}},
                        "b1": {"type": "Button", "props": {"label": "🎲 한 판 더", "variant": "primary", "targetNodeId": "n_gate_dice_check"}},
                        "b2": {"type": "Button", "props": {"label": "🚪 종료", "variant": "secondary", "targetNodeId": "n_final_score"}}
                    }
                }
            }
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 600, "y": 1400},
            "data": {
                "label": "리포트",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t", "r1", "r2", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏁 최종 결과", "variant": "title"}},
                        "r1": {"type": "Text", "props": {"text": "골드: {{gold}} G", "variant": "subtitle"}},
                        "r2": {"type": "Text", "props": {"text": "승률: {{win_rate}} %", "variant": "subtitle"}},
                        "sp": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "로비로", "variant": "primary", "targetNodeId": "n_entry"}}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e_refill", "source": "n_entry", "target": "n_refill_logic", "type": "exec"},
        {"id": "e_back", "source": "n_refill_logic", "target": "n_entry", "type": "exec"},
        {"id": "e_init", "source": "n_entry", "target": "n_global_init", "type": "exec"},
        {"id": "e_check", "source": "n_global_init", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_round", "source": "n_gate_dice_check", "target": "n_round_init", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e_over", "source": "n_gate_dice_check", "target": "n_final_score", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e_start", "source": "n_round_init", "target": "n_choice_bet", "type": "exec"},
        {"id": "e_h", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e_l", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e_gh", "source": "n_high_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e_gl", "source": "n_low_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e_win", "source": "n_gate_check", "target": "n_ui_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e_fail", "source": "n_gate_check", "target": "n_ui_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e_rew", "source": "n_ui_win", "target": "n_reward_hub", "type": "exec"},
        {"id": "e_gold", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e_settle", "source": "n_res_gold", "target": "n_settle_win", "type": "exec"},
        {"id": "e_loop_win", "source": "n_settle_win", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_end_win", "source": "n_settle_win", "target": "n_final_score", "type": "exec"},
        {"id": "e_loop_fail", "source": "n_ui_fail", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_end_fail", "source": "n_ui_fail", "target": "n_final_score", "type": "exec"},
        {"id": "e_restart", "source": "n_final_score", "target": "n_entry", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v22_무한충전소.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v22, f, ensure_ascii=False, indent=2)

print("주사위 게임 V22 생성 완료! 메인 화면 주사위 정보 및 충전 시스템 적용.")
