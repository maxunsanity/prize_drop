import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

# Global Init State
MOCK_INIT = {
    "gold": 0,
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

dice_v16 = {
    "version": 1,
    "designName": "주사위_게임_v16_파이널정산",
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
                        "t": {"type": "Text", "props": {"text": "🎲 주사위 v16 (Final)", "variant": "title"}, "children": []},
                        "b": {"type": "Button", "props": {"label": "게임 시작", "variant": "primary", "targetNodeId": "n_global_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        # 1. Global Init (Run ONLY ONCE at very start)
        {
            "id": "n_global_init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "전역 초기화 (최초 1회)",
                "attributes": [
                    {"key": "total_games", "type": "number", "value": "0"},
                    {"key": "total_wins", "type": "number", "value": "0"},
                    {"key": "win_rate", "type": "number", "value": "0"},
                    {"key": "gold", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        # 2. Round Init (Reset per round)
        {
            "id": "n_round_init", "type": "trigger",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "라운드 초기화",
                "attributes": [
                    {"key": "bet_high", "type": "number", "value": "-1"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        # 3. User Choice
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
                        "btn_high": create_sample_style_btn("📈 높음 (4~6) 선택", "n_high_calc", "primary"),
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "btn_low": create_sample_style_btn("📉 낮음 (1~3) 선택", "n_low_calc", "secondary"),
                        "sp3": {"type": "Spacer", "props": {}, "children": []},
                        "rate_info": {"type": "Text", "props": {"text": "📊 현재 누적 승률: {{win_rate}}%", "variant": "muted"}, "children": []}
                    }
                }
            }
        },
        # 4. Calculation
        {
            "id": "n_high_calc", "type": "trigger",
            "position": {"x": 200, "y": 600},
            "data": {
                "label": "높음 주사위 가동",
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
                "label": "낮음 주사위 가동",
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
            "data": {"label": "높음 성공?", "condition": "roll >= 4"}
        },
        {
            "id": "n_gate_low", "type": "gate",
            "position": {"x": 600, "y": 750},
            "data": {"label": "낮음 성공?", "condition": "roll <= 3"}
        },
        # 5. Result Logic
        {
            "id": "n_logic_win", "type": "trigger",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "승리 데이터 기록",
                "attributes": [
                    {"key": "total_wins", "type": "number", "value": "total_wins + 1"},
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "1"}
                ]
            }
        },
        {
            "id": "n_logic_fail", "type": "trigger",
            "position": {"x": 800, "y": 900},
            "data": {
                "label": "실패 데이터 기록",
                "attributes": [
                    {"key": "win_rate", "type": "number", "value": "(total_wins * 100) / total_games"},
                    {"key": "money_gain", "type": "number", "value": "0"}
                ]
            }
        },
        # 6. Result Scene (Wait for Claim or Retry)
        {
            "id": "n_show_result", "type": "choice",
            "position": {"x": 400, "y": 1050},
            "data": {
                "label": "판정 화면",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "r", "m", "w", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "{{money_gain > 0 ? '🎉 승리!' : '😢 패배'}}", "variant": "title"}, "children": []},
                        "r": {"type": "Text", "props": {"text": "주사위 결과: {{roll}}", "variant": "subtitle"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "{{money_gain > 0 ? '보상을 획득하세요!' : '운이 없었네요.'}}", "variant": "muted"}, "children": []},
                        "w": {"type": "Text", "props": {"text": "현재 누적 성공률: {{win_rate}}%", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "{{money_gain > 0 ? '💰 보상 받기 (1G)' : '🔄 다시 하기'}}", "variant": "primary", "targetNodeId": "{{money_gain > 0 ? 'n_reward_hub' : 'n_settle_fail'}}"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_reward_hub", "type": "reward",
            "position": {"x": 300, "y": 1200},
            "data": {"label": "보상 허브", "sdtEffects": sdt(c=1)}
        },
        {
            "id": "n_res_gold", "type": "resource",
            "position": {"x": 300, "y": 1350},
            "data": {"label": "골드 추가", "resourceId": "res_gold", "resourceKey": "gold"}
        },
        # 7. Settle Scene (Play Again or End Game)
        {
            "id": "n_settle_win", "type": "choice",
            "position": {"x": 300, "y": 1500},
            "data": {
                "label": "성공 정산",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body"]},
                        "top": {"type": "TopArea", "props": {}, "children": ["g-meter"]},
                        "g-meter": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "m", "sp", "btn_retry", "btn_end"]},
                        "t": {"type": "Text", "props": {"text": "💰 보상 획득 완료!", "variant": "title"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "주머니가 든든해졌어요!", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn_retry": {"type": "Button", "props": {"label": "🎲 다시 하기", "variant": "primary", "targetNodeId": "n_round_init"}, "children": []},
                        "btn_end": {"type": "Button", "props": {"label": "🚪 게임 종료", "variant": "secondary", "targetNodeId": "n_final_score"}, "children": []}
                    }
                }
            }
        },
        {
            "id": "n_settle_fail", "type": "choice",
            "position": {"x": 600, "y": 1500},
            "data": {
                "label": "실패 정산",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "m", "sp", "btn_retry", "btn_end"]},
                        "t": {"type": "Text", "props": {"text": "😢 패배했습니다.", "variant": "title"}, "children": []},
                        "m": {"type": "Text", "props": {"text": "다시 도전해서 승률을 높여보세요!", "variant": "subtitle"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn_retry": {"type": "Button", "props": {"label": "🎲 다시 하기", "variant": "primary", "targetNodeId": "n_round_init"}, "children": []},
                        "btn_end": {"type": "Button", "props": {"label": "🚪 게임 종료", "variant": "secondary", "targetNodeId": "n_final_score"}, "children": []}
                    }
                }
            }
        },
        # 8. Final Score (Game Over)
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 450, "y": 1700},
            "data": {
                "label": "최종 결과 레포트",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "row1", "row2", "row3", "sp", "btn"]},
                        "t": {"type": "Text", "props": {"text": "🏁 게임 종료", "variant": "title"}, "children": []},
                        "row1": {"type": "HStack", "props": {}, "children": ["l1", "s1", "v1"]},
                        "l1": {"type": "Text", "props": {"text": "최종 골드", "variant": "muted"}, "children": []},
                        "s1": {"type": "Spacer", "props": {}, "children": []},
                        "v1": {"type": "Text", "props": {"text": "{{gold}} G", "variant": "tabular"}, "children": []},
                        "row2": {"type": "HStack", "props": {}, "children": ["l2", "s2", "v2"]},
                        "l2": {"type": "Text", "props": {"text": "전체 판수", "variant": "muted"}, "children": []},
                        "s2": {"type": "Spacer", "props": {}, "children": []},
                        "v2": {"type": "Text", "props": {"text": "{{total_games}} 회", "variant": "tabular"}, "children": []},
                        "row3": {"type": "HStack", "props": {}, "children": ["l3", "s3", "v3"]},
                        "l3": {"type": "Text", "props": {"text": "최종 성공률", "variant": "muted"}, "children": []},
                        "s3": {"type": "Spacer", "props": {}, "children": []},
                        "v3": {"type": "Text", "props": {"text": "{{win_rate}} %", "variant": "tabular"}, "children": []},
                        "sp": {"type": "Spacer", "props": {}, "children": []},
                        "btn": {"type": "Button", "props": {"label": "새 게임 시작", "variant": "primary", "targetNodeId": "n_global_init"}, "children": []}
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
        # Logic branching
        {"id": "e8", "source": "n_gate_high", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n_gate_high", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n_gate_low", "target": "n_logic_win", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e11", "source": "n_gate_low", "target": "n_logic_fail", "type": "exec", "data": {"gateBranch": "false"}},
        # To Result
        {"id": "e12", "source": "n_logic_win", "target": "n_show_result", "type": "exec"},
        {"id": "e13", "source": "n_logic_fail", "target": "n_show_result", "type": "exec"},
        # Post-Result flow
        {"id": "e14", "source": "n_show_result", "target": "n_reward_hub", "type": "exec", "data": {"onExec": {"action": "setState", "params": {"value": "n_reward_hub", "statePath": "/sim.activeScene"}}}},
        {"id": "e15", "source": "n_show_result", "target": "n_settle_fail", "type": "exec", "data": {"onExec": {"action": "setState", "params": {"value": "n_settle_fail", "statePath": "/sim.activeScene"}}}},
        # Success path
        {"id": "e16", "source": "n_reward_hub", "target": "n_res_gold", "type": "exec"},
        {"id": "e16_res", "source": "n_reward_hub", "target": "n_res_gold", "type": "resource", "data": {"resourceAmountExpression": "money_gain"}},
        {"id": "e17", "source": "n_res_gold", "target": "n_settle_win", "type": "exec", "data": {"onExec": {"action": "setState", "params": {"value": "n_settle_win", "statePath": "/sim.activeScene"}}}},
        # Loop back or End
        {"id": "e18", "source": "n_settle_win", "target": "n_round_init", "type": "exec"},
        {"id": "e19", "source": "n_settle_win", "target": "n_final_score", "type": "exec"},
        {"id": "e20", "source": "n_settle_fail", "target": "n_round_init", "type": "exec"},
        {"id": "e21", "source": "n_settle_fail", "target": "n_final_score", "type": "exec"},
        {"id": "e22", "source": "n_final_score", "target": "n_global_init", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/주사위_게임_v16_파이널정산.json', 'w', encoding='utf-8') as f:
    json.dump(dice_v16, f, ensure_ascii=False, indent=2)

print("주사위 게임 V16 생성 완료! 전역 초기화 노드 및 최종 스코어 보드 적용.")
