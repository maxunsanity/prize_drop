import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "bet_high": -1, "roll": 0, "money_gain": 0, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

dice_v19 = {
    "version": 1,
    "designName": "주사위_게임_v19_무한루프_자동엔딩",
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v19 (Infinite)", "variant": "title"}, "children": []},
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
            "position": {"x": 200, "y": 600},
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
            "position": {"x": 600, "y": 600},
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
            "position": {"x": 400, "y": 750},
            "data": {"label": "성공 판정", "condition": "(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)"}
        },
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
            "id": "n_logic_fail", "type": "trigger",
            "position": {"x": 500, "y": 900},
            "data": {
                "label": "패배 처리",
                "attributes": [
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_ui_result", "type": "choice",
            "position": {"x": 400, "y": 1050},
            "data": {
                "label": "판정 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t_win", "t_fail", "r", "w", "d", "sp", "btn_win", "btn_fail"]},
                        # Conditional visibility via variable interpolation (using "" or actual text)
                        "t_win": {"type": "Text", "props": {"text": "🎉 승리!", "variant": "title"}, "children": [], "on": {"visible": {"condition": "money_gain > 0"}}},
                        "t_fail": {"type": "Text", "props": {"text": "😢 패배", "variant": "title"}, "children": [], "on": {"visible": {"condition": "money_gain == 0"}}},
                        "r": {"type": "Text", "props": {"text": "주사위: {{roll}}", "variant": "subtitle"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []},
                        "d": {"type": "Text", "props": {"text": "🔍 보유 주사위: {{dice}}개", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn_win": {"type": "Button", "props": {"label": "💰 보상 받기 (1G)", "variant": "primary", "targetNodeId": "n_reward_hub"}, "on": {"visible": {"condition": "money_gain > 0"}}},
                        "btn_fail": {"type": "Button", "props": {"label": "🔄 다시 하기", "variant": "secondary", "targetNodeId": "n_round_init"}, "on": {"visible": {"condition": "money_gain == 0"}}}
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
            "id": "n_res_gold", "type": "trigger",
            "position": {"x": 300, "y": 1350},
            "data": {
                "label": "골드 실질 추가",
                "attributes": [{"key": "gold", "type": "number", "value": "gold + money_gain"}]
            }
        },
        # THE FIX: Settlement Scene after Reward
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 300, "y": 1500},
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
                        "b1": {"type": "Button", "props": {"label": "🎲 한 판 더!", "variant": "primary", "targetNodeId": "n_round_init"}},
                        "b2": {"type": "Button", "props": {"label": "🚪 게임 종료", "variant": "secondary", "targetNodeId": "n_final_score"}}
                    }
                }
            }
        },
        # AUTOMATIC END CHECK
        {
            "id": "n_gate_dice_check", "type": "gate",
            "position": {"x": 600, "y": 300},
            "data": {"label": "주사위 잔량 체크", "condition": "dice > 0"}
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 800, "y": 300},
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
        # Loop Check Gate before starting round
        {"id": "e_check_start", "source": "n_global_init", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e_round_start", "source": "n_gate_dice_check", "target": "n_round_init", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e_game_over", "source": "n_gate_dice_check", "target": "n_final_score", "type": "exec", "data": {"gateBranch": "false"}},
        
        {"id": "e_loop_back", "source": "n_round_init", "target": "n_choice_bet", "type": "exec"},
        {"id": "e4", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e5", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e6", "source": "n_high_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e7", "source": "n_low_calc", "target": "n_gate_check", "type": "exec"},
        {"id": "e8", "source": "n_gate_check", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n_gate_check", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n_logic_win", "target": "n_ui_result", "type": "exec"},
        {"id": "e11", "source": "n_logic_fail", "target": "n_ui_result", "type": "exec"},
        # Post-Result Actions
        {"id": "e12", "source": "n_ui_result", "target": "n_reward_hub", "type": "exec"},
        {"id": "e13", "source": "n_ui_result", "target": "n_gate_dice_check", "type": "exec"}, # Fail Retry loop through gate
        
        {"id": "e14", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e15", "source": "n_res_gold", "target": "n_settle_win", "type": "exec"},
        {"id": "e16", "source": "n_settle_win", "target": "n_gate_dice_check", "type": "exec"}, # Win Retry loop through gate
        {"id": "e17", "source": "n_settle_win", "target": "n_final_score", "type": "exec"},
        {"id": "e18", "source": "n_final_score", "target": "n_global_init", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v19_무한루프_자동엔딩.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v19, f, ensure_ascii=False, indent=2)

print("주사위 게임 V19 생성 완료! 보상 후 다시하기 및 주사위 0개 시 자동 엔딩 로직 적용.")
