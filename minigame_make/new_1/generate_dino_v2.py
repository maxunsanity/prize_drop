import json
from datetime import datetime

def sdt(c=0, m=0):
    return {"autonomy": 0, "competence": c, "relatedness": 0, "motivation": m}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "hp": 3, "score": 0, "obs_type": 0, "user_act": -1, "is_safe": 1,
    "total_evade": 0, "sdt": sdt(0, 50),
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# Edge-to-Edge Top Area
def ui_top_bar():
    return {
        "top": {"type": "TopArea", "props": {}, "children": ["header_row"]},
        "header_row": {"type": "HStack", "props": {"spacing": 0}, "children": ["hp_box", "h_sp", "sc_box"]},
        "hp_box": {"type": "ResourceMeter", "props": {"resourceKey": "hp"}},
        "h_sp": {"type": "Spacer", "props": {}},
        "sc_box": {"type": "ResourceMeter", "props": {"resourceKey": "score"}}
    }

# Footer Status
def ui_footer_status():
    return {
        "footer": {"type": "VStack", "props": {"spacing": 10}, "children": ["f_divider", "f_row"]},
        "f_divider": {"type": "Divider", "props": {}},
        "f_row": {"type": "HStack", "props": {"spacing": 0}, "children": ["f_evade", "f_sp", "f_msg"]},
        "f_evade": {"type": "Text", "props": {"text": "🏃 회피 성공: {{total_evade}}회", "variant": "muted"}},
        "f_sp": {"type": "Spacer", "props": {}},
        "f_msg": {"type": "Text", "props": {"text": "🔥 계속 달리세요!", "variant": "muted"}}
    }

dino_v2 = {
    "version": 1,
    "designName": "공룡_런너_v2_세이프랜덤",
    "exportedAt": NOW,
    "resources": [
        {"id": "res_hp", "key": "hp", "name": "체력", "color": "#FF4D4D", "icon": "heart"},
        {"id": "res_score", "key": "score", "name": "점수", "color": "#4DFF4D", "icon": "trending_up"}
    ],
    "attributes": [
        {"key": "hp", "type": "number", "value": "3"},
        {"key": "score", "type": "number", "value": "0"},
        {"key": "obs_type", "type": "number", "value": "0"},
        {"key": "user_act", "type": "number", "value": "-1"},
        {"key": "total_evade", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "DINO RUN",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 30}, "children": ["s1", "t_grp", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t_grp": {"type": "VStack", "props": {"spacing": 10}, "children": ["t1", "t2"]},
                        "t1": {"type": "Text", "props": {"text": "🦖 DINO RUNNER", "variant": "title"}},
                        "t2": {"type": "Text", "props": {"text": "장애물을 피하고 한계에 도전하세요", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "🏁 달리기 시작!", "variant": "primary", "targetNodeId": "n_setup"}},
                        "s3": {"type": "Spacer", "props": {}}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_setup", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "철통 초기화",
                "attributes": [
                    {"key": "hp", "type": "number", "value": "3"},
                    {"key": "score", "type": "number", "value": "0"},
                    {"key": "total_evade", "type": "number", "value": "0"},
                    {"key": "obs_type", "type": "number", "value": "0"},
                    {"key": "user_act", "type": "number", "value": "-1"}
                ]
            }
        },
        # THE FIX: Use rand.d6() instead of rand.int()
        {
            "id": "n_obs_gen", "type": "trigger",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "장애물 등장",
                "attributes": [
                    {"key": "obs_type", "type": "number", "value": "rand.d6() <= 3 ? 0 : 1"},
                    {"key": "user_act", "type": "number", "value": "-1"}
                ]
            }
        },
        {
            "id": "n_choice_act", "type": "choice",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "회피 선택",
                "motivation": 20, "autonomy": 10,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar(),
                        "body": {"type": "VStack", "props": {"spacing": 30}, "children": ["s1", "obs_card", "btns", "s2"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "obs_card": {"type": "VStack", "props": {"spacing": 10}, "children": ["obs_t", "obs_v"]},
                        "obs_t": {"type": "Text", "props": {"text": "⚠️ 장애물 출현!", "variant": "title"}},
                        "obs_v": {"type": "Text", "props": {"text": "앞에 {{obs_type == 0 ? '🌵 선인장' : '🕊️ 익룡'}}이 나타났어요!", "variant": "subtitle"}},
                        "btns": {"type": "VStack", "props": {"spacing": 16}, "children": ["b_jump", "tip", "b_duck"]},
                        "b_jump": {"type": "Button", "props": {"label": "⬆️ 점프하기", "variant": "secondary", "targetNodeId": "n_jump_logic"}},
                        "tip": {"type": "Text", "props": {"text": "💡 선인장은 점프, 익룡은 숙이세요!", "variant": "muted"}},
                        "b_duck": {"type": "Button", "props": {"label": "⬇️ 숙이기", "variant": "secondary", "targetNodeId": "n_duck_logic"}},
                        "s2": {"type": "Spacer", "props": {}},
                        **ui_footer_status()
                    }
                }
            }
        },
        {
            "id": "n_jump_logic", "type": "trigger",
            "position": {"x": 200, "y": 600},
            "data": {
                "label": "점프 수행",
                "attributes": [{"key": "user_act", "type": "number", "value": "1"}]
            }
        },
        {
            "id": "n_duck_logic", "type": "trigger",
            "position": {"x": 600, "y": 600},
            "data": {
                "label": "숙이기 수행",
                "attributes": [{"key": "user_act", "type": "number", "value": "0"}]
            }
        },
        {
            "id": "n_gate_judge", "type": "gate",
            "position": {"x": 400, "y": 750},
            "data": {"label": "회피 성공?", "condition": "(obs_type == 0 && user_act == 1) || (obs_type == 1 && user_act == 0)"}
        },
        {
            "id": "n_evade_success", "type": "trigger",
            "position": {"x": 200, "y": 900},
            "data": {
                "label": "성공 정산",
                "attributes": [
                    {"key": "score", "type": "number", "value": "score + 100"},
                    {"key": "total_evade", "type": "number", "value": "total_evade + 1"}
                ]
            }
        },
        {
            "id": "n_ui_success", "type": "choice",
            "position": {"x": 200, "y": 1050},
            "data": {
                "label": "회피 성공 화면",
                "motivation": 30, "competence": 20,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar(),
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "m", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "✨ 나이스 회피!", "variant": "title"}},
                        "m": {"type": "Text", "props": {"text": "+100 점 획득!", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "🏃 계속 달리기", "variant": "primary", "targetNodeId": "n_obs_gen"}},
                        "s3": {"type": "Spacer", "props": {}},
                        **ui_footer_status()
                    }
                }
            }
        },
        {
            "id": "n_evade_fail", "type": "trigger",
            "position": {"x": 600, "y": 900},
            "data": {
                "label": "실패 정산",
                "attributes": [{"key": "hp", "type": "number", "value": "hp - 1"}]
            }
        },
        {
            "id": "n_ui_fail", "type": "choice",
            "position": {"x": 600, "y": 1050},
            "data": {
                "label": "충돌 화면",
                "motivation": -10, "competence": -10,
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["top", "body", "footer"]},
                        **ui_top_bar(),
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "m", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "💥 아야!", "variant": "title"}},
                        "m": {"type": "Text", "props": {"text": "장애물에 부딪혔어요. (HP -1)", "variant": "subtitle"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "💪 다시 힘내기", "variant": "secondary", "targetNodeId": "n_gate_hp_check"}},
                        "s3": {"type": "Spacer", "props": {}},
                        **ui_footer_status()
                    }
                }
            }
        },
        {
            "id": "n_gate_hp_check", "type": "gate",
            "position": {"x": 600, "y": 1200},
            "data": {"label": "생존 확인", "condition": "hp > 0"}
        },
        {
            "id": "n_final_score", "type": "success",
            "position": {"x": 900, "y": 1350},
            "data": {
                "label": "게임 오버",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {"spacing": 40}, "children": ["s1", "t", "list", "s2", "btn", "s3"]},
                        "s1": {"type": "Spacer", "props": {}},
                        "t": {"type": "Text", "props": {"text": "🏁 레이스 종료", "variant": "title"}},
                        "list": {"type": "VStack", "props": {"spacing": 16}, "children": ["r1", "r2"]},
                        "r1": {"type": "HStack", "props": {}, "children": ["l1", "sp1", "v1"]},
                        "l1": {"type": "Text", "props": {"text": "최종 점수", "variant": "muted"}},
                        "sp1": {"type": "Spacer", "props": {}},
                        "v1": {"type": "Text", "props": {"text": "{{score}} m", "variant": "title"}},
                        "r2": {"type": "HStack", "props": {}, "children": ["l2", "sp2", "v2"]},
                        "l2": {"type": "Text", "props": {"text": "회피 성공", "variant": "muted"}},
                        "sp2": {"type": "Spacer", "props": {}},
                        "v2": {"type": "Text", "props": {"text": "{{total_evade}} 회", "variant": "title"}},
                        "s2": {"type": "Spacer", "props": {}},
                        "btn": {"type": "Button", "props": {"label": "다시 달리기", "variant": "primary", "targetNodeId": "n_entry"}},
                        "s3": {"type": "Spacer", "props": {}}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_setup", "type": "exec"},
        {"id": "e2", "source": "n_setup", "target": "n_obs_gen", "type": "exec"},
        {"id": "e3", "source": "n_obs_gen", "target": "n_choice_act", "type": "exec"},
        {"id": "e4", "source": "n_choice_act", "target": "n_jump_logic", "type": "exec"},
        {"id": "e5", "source": "n_choice_act", "target": "n_duck_logic", "type": "exec"},
        {"id": "e6", "source": "n_jump_logic", "target": "n_gate_judge", "type": "exec"},
        {"id": "e7", "source": "n_duck_logic", "target": "n_gate_judge", "type": "exec"},
        {"id": "e8", "source": "n_gate_judge", "target": "n_evade_success", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e9", "source": "n_gate_judge", "target": "n_evade_fail", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e10", "source": "n_evade_success", "target": "n_ui_success", "type": "exec"},
        {"id": "e11", "source": "n_ui_success", "target": "n_obs_gen", "type": "exec"},
        {"id": "e12", "source": "n_evade_fail", "target": "n_ui_fail", "type": "exec"},
        {"id": "e13", "source": "n_ui_fail", "target": "n_gate_hp_check", "type": "exec"},
        {"id": "e14", "source": "n_gate_hp_check", "target": "n_obs_gen", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e15", "source": "n_gate_hp_check", "target": "n_final_score", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e16", "source": "n_final_score", "target": "n_entry", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/공룡_런너_v2_세이프랜덤.json', 'w', encoding='utf-8') as f:
    json.dump(dino_v2, f, ensure_ascii=False, indent=2)

print("공룡 런너 V2 생성 완료! rand.d6() 기반의 안정적인 장애물 생성 시스템 적용.")
