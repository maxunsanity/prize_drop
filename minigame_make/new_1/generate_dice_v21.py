import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "bet_high": -1, "roll": 0, "money_gain": 0, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# Professional UI Elements (Matching Sample Style)
def ui_top_area():
    return {
        "top": {"type": "TopArea", "props": {}, "children": ["header_box"]},
        "header_box": {"type": "HStack", "props": {"spacing": 12}, "children": ["m_gold", "m_dice"]},
        "m_gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
        "m_dice": {"type": "ResourceMeter", "props": {"resourceKey": "dice"}, "children": []}
    }

def ui_footer_info():
    return {
        "footer": {"type": "VStack", "props": {"spacing": 4}, "children": ["line", "info_row"]},
        "line": {"type": "Divider", "props": {}, "children": []},
        "info_row": {"type": "HStack", "props": {"spacing": 16}, "children": ["rate_lbl", "sp_f", "dice_lbl"]},
        "rate_lbl": {"type": "Text", "props": {"text": "📈 성공률: {{win_rate}}%", "variant": "muted"}, "children": []},
        "sp_f": {"type": "Spacer", "props": {}, "children": []},
        "dice_lbl": {"type": "Text", "props": {"text": "🎲 주사위: {{dice}}개", "variant": "muted"}, "children": []}
    }

dice_v21 = {
    "version": 1,
    "designName": "주사위_게임_v21_UI폴리싱",
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
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["t_box", "sp", "btn"]},
                        "t_box": {"type": "VStack", "props": {}, "children": ["t1", "t2"]},
                        "t1": {"type": "Text", "props": {"text": "🎲 DICE MASTER", "variant": "title"}, "children": []},
                        "t2": {"type": "Text", "props": {"text": "운명을 결정하는 한 번의 투척", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "모험 시작하기", "variant": "primary", "targetNodeId": "n_global_init"}, "children": []}
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
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_area(),
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["title_grp", "sp1", "btn_row", "sp2"]},
                        "title_grp": {"type": "VStack", "props": {"spacing": 8}, "children": ["t", "st"]},
                        "t": {"type": "Text", "props": {"text": "주사위를 던지세요!", "variant": "title"}, "children": []},
                        "st": {"type": "Text", "props": {"text": "다음 숫자는 높을까요, 낮을까요?", "variant": "subtitle"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "btn_row": {"type": "HStack", "props": {"spacing": 16}, "children": ["btn_h", "btn_l"]},
                        "btn_h": {"type": "Button", "props": {"label": "📈 높음 (4-6)", "variant": "primary", "targetNodeId": "n_high_calc"}},
                        "btn_l": {"type": "Button", "props": {"label": "📉 낮음 (1-3)", "variant": "secondary", "targetNodeId": "n_low_calc"}},
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        **ui_footer_info()
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
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_area(),
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["win_t", "dice_v", "sp", "btn"]},
                        "win_t": {"type": "Text", "props": {"text": "🎉 예측 성공!", "variant": "title"}, "children": []},
                        "dice_v": {"type": "Text", "props": {"text": "결과: {{roll}}", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "💰 보상 받기 (1G)", "variant": "primary", "targetNodeId": "n_reward_hub"}},
                        **ui_footer_info()
                    }
                }
            }
        },
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
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_area(),
                        "body": {"type": "VStack", "props": {"spacing": 20}, "children": ["fail_t", "dice_v", "sp", "btn"]},
                        "fail_t": {"type": "Text", "props": {"text": "😢 예측 실패", "variant": "title"}, "children": []},
                        "dice_v": {"type": "Text", "props": {"text": "결과: {{roll}}", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 하기", "variant": "secondary", "targetNodeId": "n_gate_dice_check"}},
                        **ui_footer_info()
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
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_area(),
                        "body": {"type": "VStack", "props": {"spacing": 24}, "children": ["t", "m", "sp", "b1", "b2"]},
                        "t": {"type": "Text", "props": {"text": "💰 정산 완료!", "variant": "title"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "자산이 안전하게 기록되었습니다.", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "b1": {"type": "Button", "props": {"label": "🎲 다음 라운드", "variant": "primary", "targetNodeId": "n_gate_dice_check"}},
                        "b2": {"type": "Button", "props": {"label": "🚪 모험 종료", "variant": "secondary", "targetNodeId": "n_final_score"}},
                        **ui_footer_info()
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
                        "body": {"type": "VStack", "props": {"spacing": 24}, "children": ["t", "list", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏁 최종 결과 리포트", "variant": "title"}},
                        "list": {"type": "VStack", "props": {"spacing": 12}, "children": ["r1", "r2", "r3"]},
                        "r1": {"type": "HStack", "props": {}, "children": ["l1", "s1", "v1"]},
                        "l1": {"type": "Text", "props": {"text": "획득 골드", "variant": "muted"}, "children": []},
                        "s1": {"type": "Spacer", "props": {}, "children": []},
                        "v1": {"type": "Text", "props": {"text": "{{gold}} G", "variant": "subtitle"}, "children": []},
                        "r2": {"type": "HStack", "props": {}, "children": ["l2", "s2", "v2"]},
                        "l2": {"type": "Text", "props": {"text": "총 게임수", "variant": "muted"}, "children": []},
                        "s2": {"type": "Spacer", "props": {}, "children": []},
                        "v2": {"type": "Text", "props": {"text": "{{total_games}} 회", "variant": "subtitle"}, "children": []},
                        "r3": {"type": "HStack", "props": {}, "children": ["l3", "s3", "v3"]},
                        "l3": {"type": "Text", "props": {"text": "최종 승률", "variant": "muted"}, "children": []},
                        "s3": {"type": "Spacer", "props": {}, "children": []},
                        "v3": {"type": "Text", "props": {"text": "{{win_rate}} %", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "메인 화면으로", "variant": "primary", "targetNodeId": "n_entry"}}
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
        {"id": "e_restart", "source": "n_final_score", "target": "n_entry", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v21_UI폴리싱.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v21, f, ensure_ascii=False, indent=2)

print("주사위 게임 V21 생성 완료! 샘플 스타일 가이드 기반 UI 폴리싱 적용.")
