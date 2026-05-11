import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 0,
    "slot_1": 0, "slot_2": 0, "slot_3": 0, "slot_4": 0, "slot_5": 0,
    "total_harvest": 0,
    "money_gain": 0,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

# Helper to generate slot display text based on stage
# 0: . (Empty), 1: 🌱 (Sprout), 2: 🌿 (Mid), 3: 🌳 (Full), 4: 🍂 (Withered)
def get_sprout_ui():
    return {
        "type": "HStack",
        "props": {"spacing": 20},
        "children": ["s1", "s2", "s3", "s4", "s5"]
    }

sprout_v2 = {
    "version": 1,
    "designName": "게임2_숙주나물_v2_성장시각화",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold", "key": "gold", "name": "Gold", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "slot_1", "type": "number", "value": "0"},
        {"key": "slot_2", "type": "number", "value": "0"},
        {"key": "slot_3", "type": "number", "value": "0"},
        {"key": "slot_4", "type": "number", "value": "0"},
        {"key": "slot_5", "type": "number", "value": "0"},
        {"key": "total_harvest", "type": "number", "value": "0"},
        {"key": "money_gain", "type": "number", "value": "0"}
    ],
    "nodes": [
        {
            "id": "n_entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "시작",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["t", "b"]},
                        "t": {"type": "Text", "props": {"text": "🌱 숙주나물 성장 시뮬레이터", "variant": "title"}, "children": []},
                        "b": {"type": "Button", "props": {"label": "성장 시작", "variant": "primary", "targetNodeId": "n_init"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },
        {
            "id": "n_init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "환경 초기화",
                "attributes": [
                    {"key": "slot_1", "type": "number", "value": "0"},
                    {"key": "slot_2", "type": "number", "value": "0"},
                    {"key": "slot_3", "type": "number", "value": "0"},
                    {"key": "slot_4", "type": "number", "value": "0"},
                    {"key": "slot_5", "type": "number", "value": "0"},
                    {"key": "total_harvest", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt()
            }
        },
        {
            "id": "n_growth_loop", "type": "trigger",
            "position": {"x": 400, "y": 300},
            "data": {
                "label": "성장 가속 (Loop)",
                "attributes": [
                    {"key": "slot_1", "type": "number", "value": "slot_1 < 4 ? slot_1 + 1 : 4"},
                    {"key": "slot_2", "type": "number", "value": "slot_2 < 4 ? slot_2 + 1 : 4"},
                    {"key": "slot_3", "type": "number", "value": "slot_3 < 4 ? slot_3 + 1 : 4"},
                    {"key": "slot_4", "type": "number", "value": "slot_4 < 4 ? slot_4 + 1 : 4"},
                    {"key": "slot_5", "type": "number", "value": "slot_5 < 4 ? slot_5 + 1 : 4"}
                ],
                "sdtEffects": sdt(c=1)
            }
        },
        {
            "id": "n_display_scene", "type": "choice",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "성장 모니터링",
                "mockSpec": {
                    "root": "screen",
                    "elements": {
                        "screen": {"type": "Screen", "props": {}, "children": ["body"]},
                        "body": {"type": "VStack", "props": {}, "children": ["title", "sp1", "slots_row", "sp2", "desc", "next_btn"]},
                        "title": {"type": "Text", "props": {"text": "🌿 숙주나물 성장 단계", "variant": "title"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "slots_row": {"type": "HStack", "props": {"spacing": 15}, "children": ["s1", "s2", "s3", "s4", "s5"]},
                        "s1": {"type": "Text", "props": {"text": "Slot 1: Stage {{slot_1}}", "variant": "tabular"}, "children": []},
                        "s2": {"type": "Text", "props": {"text": "Slot 2: Stage {{slot_2}}", "variant": "tabular"}, "children": []},
                        "s3": {"type": "Text", "props": {"text": "Slot 3: Stage {{slot_3}}", "variant": "tabular"}, "children": []},
                        "s4": {"type": "Text", "props": {"text": "Slot 4: Stage {{slot_4}}", "variant": "tabular"}, "children": []},
                        "s5": {"type": "Text", "props": {"text": "Slot 5: Stage {{slot_5}}", "variant": "tabular"}, "children": []},
                        "sp2": {"type": "Spacer", "props": {}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "(0: 씨앗, 1: 새싹, 2: 중기, 3: 수확적기!, 4: 시듦)", "variant": "muted"}, "children": []},
                        "next_btn": {"type": "Button", "props": {"label": "시간 보내기 (더 키우기)", "variant": "primary", "targetNodeId": "n_growth_loop"}, "children": []}
                    }
                }
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "n_entry", "target": "n_init", "type": "exec"},
        {"id": "e2", "source": "n_init", "target": "n_growth_loop", "type": "exec"},
        {"id": "e3", "source": "n_growth_loop", "target": "n_display_scene", "type": "exec"},
        # Loop back to growth
        {"id": "e4", "source": "n_display_scene", "target": "n_growth_loop", "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임2_숙주나물_v2_성장시각화.json', 'w', encoding='utf-8') as f:
    json.dump(sprout_v2, f, ensure_ascii=False, indent=2)

print("숙주나물 v2 성장 시뮬레이션 생성 완료!")
