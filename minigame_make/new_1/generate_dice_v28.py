import json
from datetime import datetime

def sdt(c=0, m=0):
    return {"autonomy": 0, "competence": c, "relatedness": 0, "motivation": m}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0, "dice": 10, "total_games": 0, "total_wins": 0, "win_rate": 0,
    "bet_high": -1, "roll": 0, "money_gain": 0,
    "sdt": sdt(0, 50),
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

def ui_top_bar_edge():
    return {
        "top": {"type": "TopArea", "props": {}, "children": ["header_row"]},
        "header_row": {"type": "HStack", "props": {"spacing": 0}, "children": ["m_gold", "h_sp", "m_dice"]},
        "m_gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}},
        "h_sp": {"type": "Spacer", "props": {}},
        "m_dice": {"type": "ResourceMeter", "props": {"resourceKey": "dice"}}
    }

def ui_footer_edge():
    return {
        "footer": {"type": "VStack", "props": {"spacing": 10}, "children": ["f_divider", "f_row"]},
        "f_divider": {"type": "Divider", "props": {}},
        "f_row": {"type": "HStack", "props": {"spacing": 0}, "children": ["f_rate", "f_sp", "f_total"]},
        "f_rate": {"type": "Text", "props": {"text": "📊 성공률: {{win_rate}}%", "variant": "muted"}},
        "f_sp": {"type": "Spacer", "props": {}},
        "f_total": {"type": "Text", "props": {"text": "🏁 플레이: {{total_games}}회", "variant": "muted"}}
    }

dice_v28 = {
    "version": 1,
    "designName": "주사위_게임_v28_화이트버튼",
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
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "진입",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 30}, "children": ["s1", "t_grp", "s2", "btn_grp", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t_grp": {"type": "VStack", "props": {"spacing": 10}, "children": ["t1", "t2"]},
                        "t1": {"type": "Text", "props": {"text": "🎲 DICE MASTER", "variant": "title"}},
                        "t2": {"type": "Text", "props": {"text": "화이트 빅 버튼 에디션", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn_grp": {"type": "VStack", "props": {"spacing": 16}, "children": ["b_enter"]},
                        "b_enter": {"type": "Button", "props": {"label": "🏰 입장하기", "variant": "primary", "targetNodeId": "n_initial_setup"}},
                        "s3": {"type": "Spacer", "props": {}}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_initial_setup", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "철통 초기화",
                "attributes": [
                    {"key": "gold", "type": "number", "value": "0"},
                    {"key": "dice", "type": "number", "value": "10"},
                    {"key": "total_games", "type": "number", "value": "0"},
                    {"key": "total_wins", "type": "number", "value": "0"},
                    {"key": "win_rate", "type": "number", "value": "0"},
                    {"key": "bet_high", "type": "number", "value": "-1"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        {
            "id": "n_lobby", "type": "choice",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "로비",
                "motivation": 10, "competence": 5, "relatedness": 0, "autonomy": 5,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 30}, "children": ["s1", "t", "d_card", "s2", "btns", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "🏠 게임 로비", "variant": "title"}},
                        "d_card": {"type": "VStack", "props": {"spacing": 8}, "children": ["dc_t", "dc_v"]},
                        "dc_t": {"type": "Text", "props": {"text": "현재 보유 주사위", "variant": "muted"}},
                        "dc_v": {"type": "Text", "props": {"text": "🎲 {{dice}}개", "variant": "title"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btns": {"type": "VStack", "props": {"spacing": 12}, "children": ["b_start", "b_refill"]},
                        "b_start": {"type": "Button", "props": {"label": "🎮 게임 시작하기", "variant": "primary", "targetNodeId": "n_round_init"}},
                        "b_refill": {"type": "Button", "props": {"label": "🔋 주사위 10개 충전", "variant": "secondary", "targetNodeId": "n_refill_logic"}},
                        "s3": {"type": "Spacer", "props": {}}
                    }
                }
            }
        },
        {
            "id": "n_refill_logic", "type": "trigger",
            "position": {"x": 600, "y": 300},
            "data": {
                "label": "주사위 충전",
                "attributes": [{"key": "dice", "type": "number", "value": "dice + 10"}]
            }
        },
        {
            "id": "n_round_init", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "준비",
                "attributes": [{"key": "money_gain", "type": "number", "value": "0"}]
            }
        },
        {
            "id": "n_gate_dice_check", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "잔량 확인", "condition": "dice > 0"}
        },
        {
            "id": "n_choice_bet", "type": "choice",
            "position": {"x": 200, "y": 750},
            "data": {
                "label": "베팅 선택",
                "motivation": 20, "competence": 5, "autonomy": 10,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar_edge(),
                        "body": {"type": "VStack", "props": {"spacing": 30}, "children": ["s1", "t_grp", "bh", "guide", "bl", "s2"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t_grp": {"type": "VStack", "props": {"spacing": 10}, "children": ["t", "st"]},
                        "t": {"type": "Text", "props": {"text": "주사위를 던지세요!", "variant": "title"}},
                        "st": {"type": "Text", "props": {"text": "높을까요? 낮을까요?", "variant": "subtitle"}},
                        # BOTH WHITE BUTTONS + TIP IN BETWEEN
                        "bh": {"type": "Button", "props": {"label": "📈 높음 (4, 5, 6)", "variant": "secondary", "targetNodeId": "n_high_calc"}},
                        "guide": {"type": "Text", "props": {"text": "💡 팁: 행운을 빌어요!", "variant": "muted"}},
                        "bl": {"type": "Button", "props": {"label": "📉 낮음 (1, 2, 3)", "variant": "secondary", "targetNodeId": "n_low_calc"}},
                        "s2": {"type": "Spacer", "props": {}},
                        **ui_footer_edge()
                    }
                }
            }
        },
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 100, "y": 900},
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
            "position": {"x": 300, "y": 900},
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
            "id": "n_gate_judge", "type": "gate",
            "position": {"x": 200, "y": 1050},
            "data": {"label": "판정", "condition": "(bet_high == 1 && roll >= 4) || (bet_high == 0 && roll <= 3)"}
        },
        {
            "id": "n_ui_win", "type": "choice",
            "position": {"x": 100, "y": 1200},
            "data": {
                "label": "승리",
                "motivation": 30, "competence": 20,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar_edge(),
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "res_box", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "🎉 예측 성공!", "variant": "title"}},
                        "res_box": {"type": "VStack", "props": {"spacing": 10}, "children": ["r_v", "r_m"]},
                        "r_v": {"type": "Text", "props": {"text": "🎲 결과: {{roll}}", "variant": "title"}},
                        "r_m": {"type": "Text", "props": {"text": "대단해요! 보상을 획득하세요.", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "💰 보상 받기 (1G)", "variant": "primary", "targetNodeId": "n_reward_hub"}},
                        "s3": {"type": "Spacer", "props": {}},
                        **ui_footer_edge()
                    }
                }
            }
        },
        {
            "id": "n_ui_fail", "type": "choice",
            "position": {"x": 400, "y": 1200},
            "data": {
                "label": "패배",
                "motivation": -10, "competence": -5,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar_edge(),
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "res_box", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "😢 예측 실패", "variant": "title"}},
                        "res_box": {"type": "VStack", "props": {"spacing": 10}, "children": ["r_v", "r_m"]},
                        "r_v": {"type": "Text", "props": {"text": "🎲 결과: {{roll}}", "variant": "title"}},
                        "r_m": {"type": "Text", "props": {"text": "다음 기회를 노려보세요!", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "🔄 다시 도전하기", "variant": "secondary", "targetNodeId": "n_gate_dice_check"}},
                        "s3": {"type": "Spacer", "props": {}},
                        **ui_footer_edge()
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 100, "y": 1350},
            "data": {
                "label": "보상 허브",
                "results": {"autonomy": 5, "competence": 10, "relatedness": 0, "motivation": 15}
            }
        },
        {
            "id": "n_res_gold", "type": "trigger",
            "position": {"x": 100, "y": 1500},
            "data": {
                "label": "골드 +1",
                "attributes": [{"key": "gold", "type": "number", "value": "gold + 1"}]
            }
        },
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 100, "y": 1650},
            "data": {
                "label": "정산 화면",
                "motivation": 10, "competence": 10,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar_edge(),
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "m", "s2", "btns", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "💰 정산 완료!", "variant": "title"}},
                        "m": {"type": "Text", "props": {"text": "오빠의 금고가 든든해졌어요!", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btns": {"type": "VStack", "props": {"spacing": 16}, "children": ["b1", "b2"]},
                        "b1": {"type": "Button", "props": {"label": "🎲 계속 플레이하기", "variant": "primary", "targetNodeId": "n_gate_dice_check"}},
                        "b2": {"type": "Button", "props": {"label": "🏠 로비로 돌아가기", "variant": "secondary", "targetNodeId": "n_lobby"}},
                        "s3": {"type": "Spacer", "props": {}},
                        **ui_footer_edge()
                    }
                }
            }
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 700, "y": 600},
            "data": {
                "label": "최종 결과",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "list", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "🏁 최종 성적표", "variant": "title"}},
                        "list": {"type": "VStack", "props": {"spacing": 16}, "children": ["r1", "r2", "r3"]},
                        "r1": {"type": "HStack", "props": {}, "children": ["l1", "sp1", "v1"]},
                        "l1": {"type": "Text", "props": {"text": "총 획득 골드", "variant": "muted"}},
                        "sp1": {"type": "Spacer", "props": {}},
                        "v1": {"type": "Text", "props": {"text": "{{gold}} G", "variant": "title"}},
                        "r2": {"type": "HStack", "props": {}, "children": ["l2", "sp2", "v2"]},
                        "l2": {"type": "Text", "props": {"text": "총 플레이 횟수", "variant": "muted"}},
                        "sp2": {"type": "Spacer", "props": {}},
                        "v2": {"type": "Text", "props": {"text": "{{total_games}} 회", "variant": "title"}},
                        "r3": {"type": "HStack", "props": {}, "children": ["l3", "sp3", "v3"]},
                        "l3": {"type": "Text", "props": {"text": "최종 성공 확률", "variant": "muted"}},
                        "sp3": {"type": "Spacer", "props": {}},
                        "v3": {"type": "Text", "props": {"text": "{{win_rate}} %", "variant": "title"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "다시 처음으로", "variant": "primary", "targetNodeId": "n_lobby"}},
                        "s3": {"type": "Spacer", "props": {}}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_initial_setup", "type": "exec"},
        {"id": "e2", "source": "n_initial_setup", "target": "n_lobby", "type": "exec"},
        {"id": "e3", "source": "n_lobby", "target": "n_round_init", "type": "exec"},
        {"id": "e4", "source": "n_lobby", "target": "n_refill_logic", "type": "exec"},
        {"id": "e5", "source": "n_refill_logic", "target": "n_lobby", "type": "exec"},
        {"id": "e6", "source": "n_round_init", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e7", "source": "n_gate_dice_check", "target": "n_choice_bet", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e8", "source": "n_gate_dice_check", "target": "n_final_score", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e9", "source": "n_choice_bet", "target": "n_high_calc", "type": "exec"},
        {"id": "e10", "source": "n_choice_bet", "target": "n_low_calc", "type": "exec"},
        {"id": "e11", "source": "n_high_calc", "target": "n_gate_judge", "type": "exec"},
        {"id": "e12", "source": "n_low_calc", "target": "n_gate_judge", "type": "exec"},
        {"id": "e13", "source": "n_gate_judge", "target": "n_ui_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e14", "source": "n_gate_judge", "target": "n_ui_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e15", "source": "n_ui_win", "target": "n_reward_hub", "type": "exec"},
        {"id": "e16", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e17", "source": "n_res_gold", "target": "n_settle_win", "type": "exec"},
        {"id": "e18", "source": "n_settle_win", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e19", "source": "n_settle_win", "target": "n_lobby", "type": "exec"},
        {"id": "e20", "source": "n_ui_fail", "target": "n_gate_dice_check", "type": "exec"},
        {"id": "e21", "source": "n_final_score", "target": "n_lobby", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v28_화이트버튼.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v28, f, ensure_ascii=False, indent=2)

print("주사위 게임 V28 생성 완료! 화이트 빅 버튼 수직 배치 및 팁 샌드위치 적용.")
