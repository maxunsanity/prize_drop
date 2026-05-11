import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

# ==========================================
# 게임 1: 주사위 홀짝 (10턴, 4이상=+10골드, 이하=-5골드)
# ==========================================
game1 = {
    "version": 1,
    "designName": "게임1_주사위_홀짝",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-g1", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "dice", "type": "number", "value": "10"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "gold_gain", "type": "number", "value": "0"}
    ],
    "entityTypes": [],
    "nodes": [
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "게임 시작", "tags": [],
                "mockSpec": {
                    "root": "main-screen",
                    "elements": {
                        "main-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-bar", "game-body"]},
                        "top-bar": {"type": "TopArea", "props": {}, "children": ["res-gold"]},
                        "res-gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "game-body": {"type": "VStack", "props": {}, "children": ["title", "desc", "sp1", "start-btn"]},
                        "title": {"type": "Text", "props": {"text": "🎲 주사위 홀짝 게임", "variant": "title"}, "children": []},
                        "desc": {"type": "Text", "props": {"text": "4 이상이면 +10 골드! 3 이하면 -5 골드. 10번의 기회!", "variant": "muted"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "start-btn": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🎲 굴리기 시작!", "variant": "primary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {"gold": 100, "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50, "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""}
            }
        },
        {
            "id": "n-init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "dice", "type": "number", "value": "10"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-loop-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "주사위 남음?", "condition": "dice >= 1", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-consume-dice", "type": "disposal",
            "position": {"x": 400, "y": 450},
            "data": {"label": "주사위 소비", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-roll", "type": "trigger",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "주사위 굴리기",
                "attributes": [
                    {"key": "roll", "type": "number", "value": "rand.d6()"},
                    {"key": "dice", "type": "number", "value": "dice - 1"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-result-gate", "type": "gate",
            "position": {"x": 400, "y": 750},
            "data": {"label": "4 이상?", "condition": "roll >= 4", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-win-trigger", "type": "trigger",
            "position": {"x": 200, "y": 900},
            "data": {
                "label": "승리 +10골드",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "10"}],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },
        {
            "id": "n-lose-trigger", "type": "trigger",
            "position": {"x": 600, "y": 900},
            "data": {
                "label": "패배 -5골드",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "-5"}],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "골드 허브", "sdtEffects": sdt(c=1), "frictionScore": 0}
        },
        {
            "id": "n-gold-res", "type": "resource",
            "position": {"x": 400, "y": 1200},
            "data": {"label": "골드", "resourceId": "res-gold-g1", "resourceKey": "gold"}
        },
        {
            "id": "n-end", "type": "success",
            "position": {"x": 700, "y": 400},
            "data": {
                "label": "게임 종료", "sdtEffects": sdt(c=2, r=1), "frictionScore": 0,
                "mockSpec": {
                    "root": "end-screen",
                    "elements": {
                        "end-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-end", "end-body"]},
                        "top-end": {"type": "TopArea", "props": {}, "children": ["res-gold-end"]},
                        "res-gold-end": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "end-body": {"type": "VStack", "props": {}, "children": ["end-title", "end-desc", "sp-end", "gold-row"]},
                        "end-title": {"type": "Text", "props": {"text": "🏆 게임 종료!", "variant": "title"}, "children": []},
                        "end-desc": {"type": "Text", "props": {"text": "10번의 주사위를 모두 소진했습니다.", "variant": "muted"}, "children": []},
                        "sp-end": {"type": "Spacer", "props": {}, "children": []},
                        "gold-row": {"type": "HStack", "props": {}, "children": ["gold-lbl", "sp-g", "gold-val"]},
                        "gold-lbl": {"type": "Text", "props": {"text": "최종 골드", "variant": "muted"}, "children": []},
                        "sp-g": {"type": "Spacer", "props": {}, "children": []},
                        "gold-val": {"type": "Text", "props": {"text": "{{gold}}", "variant": "tabular"}, "children": []}
                    }
                },
                "mockInitialState": {"gold": 150, "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50, "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""}
            }
        }
    ],
    "edges": [
        {"id": "e-entry-init", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e-init-loop", "source": "n-init", "target": "n-loop-gate", "type": "exec"},
        {"id": "e-loop-true", "source": "n-loop-gate", "target": "n-consume-dice", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-loop-false", "source": "n-loop-gate", "target": "n-end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-consume-roll", "source": "n-consume-dice", "target": "n-roll", "type": "exec"},
        {"id": "e-roll-result", "source": "n-roll", "target": "n-result-gate", "type": "exec"},
        {"id": "e-result-win", "source": "n-result-gate", "target": "n-win-trigger", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-result-lose", "source": "n-result-gate", "target": "n-lose-trigger", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-win-hub", "source": "n-win-trigger", "target": "n-reward-hub", "type": "exec"},
        {"id": "e-lose-hub", "source": "n-lose-trigger", "target": "n-reward-hub", "type": "exec"},
        {"id": "e-hub-gold", "source": "n-reward-hub", "target": "n-gold-res", "type": "resource", "data": {"resourceAmountExpression": "gold_gain"}},
        {"id": "e-gold-loop", "source": "n-gold-res", "target": "n-loop-gate", "type": "exec"}
    ]
}

# ==========================================
# 게임 2: 턴제 전투 (5턴, 적HP30 vs 플레이어HP50)
# ==========================================
game2 = {
    "version": 1,
    "designName": "게임2_턴제_전투",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-g2", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "enemy_hp", "type": "number", "value": "30"},
        {"key": "player_hp", "type": "number", "value": "50"},
        {"key": "turn", "type": "number", "value": "5"},
        {"key": "damage", "type": "number", "value": "0"},
        {"key": "counter_dmg", "type": "number", "value": "0"},
        {"key": "gold_gain", "type": "number", "value": "0"}
    ],
    "entityTypes": [],
    "nodes": [
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "전투 시작", "tags": [],
                "mockSpec": {
                    "root": "battle-screen",
                    "elements": {
                        "battle-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-area", "battle-body"]},
                        "top-area": {"type": "TopArea", "props": {}, "children": ["res-gold"]},
                        "res-gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "battle-body": {"type": "VStack", "props": {}, "children": ["b-title", "enemy-card", "sp-mid", "player-card", "sp-bot", "btn-row"]},
                        "b-title": {"type": "Text", "props": {"text": "⚔️ 전투 시작!", "variant": "title"}, "children": []},
                        "enemy-card": {"type": "VStack", "props": {}, "children": ["en-name-row", "en-hp-row", "en-hp-bar"]},
                        "en-name-row": {"type": "HStack", "props": {}, "children": ["en-name", "sp-en", "en-lv"]},
                        "en-name": {"type": "Text", "props": {"text": "👹 고블린 왕", "variant": "subtitle"}, "children": []},
                        "sp-en": {"type": "Spacer", "props": {}, "children": []},
                        "en-lv": {"type": "Text", "props": {"text": "HP 30", "variant": "muted"}, "children": []},
                        "en-hp-row": {"type": "HStack", "props": {}, "children": ["en-hp-lbl", "sp-en2", "en-hp-val"]},
                        "en-hp-lbl": {"type": "Text", "props": {"text": "HP", "variant": "muted"}, "children": []},
                        "sp-en2": {"type": "Spacer", "props": {}, "children": []},
                        "en-hp-val": {"type": "Text", "props": {"text": "{{gold}}", "variant": "tabular"}, "children": []},
                        "en-hp-bar": {"type": "Progress", "props": {"value": 1.0}, "children": []},
                        "sp-mid": {"type": "Spacer", "props": {}, "children": []},
                        "player-card": {"type": "VStack", "props": {}, "children": ["pl-name-row", "pl-hp-row", "pl-hp-bar"]},
                        "pl-name-row": {"type": "HStack", "props": {}, "children": ["pl-name", "sp-pl", "pl-lv"]},
                        "pl-name": {"type": "Text", "props": {"text": "🧙 용사", "variant": "subtitle"}, "children": []},
                        "sp-pl": {"type": "Spacer", "props": {}, "children": []},
                        "pl-lv": {"type": "Text", "props": {"text": "HP 50", "variant": "muted"}, "children": []},
                        "pl-hp-row": {"type": "HStack", "props": {}, "children": ["pl-hp-lbl", "sp-pl2", "pl-hp-val"]},
                        "pl-hp-lbl": {"type": "Text", "props": {"text": "HP", "variant": "muted"}, "children": []},
                        "sp-pl2": {"type": "Spacer", "props": {}, "children": []},
                        "pl-hp-val": {"type": "Text", "props": {"text": "50 / 50", "variant": "tabular"}, "children": []},
                        "pl-hp-bar": {"type": "Progress", "props": {"value": 1.0}, "children": []},
                        "sp-bot": {"type": "Spacer", "props": {}, "children": []},
                        "btn-row": {"type": "HStack", "props": {}, "children": ["btn-attack", "btn-flee"]},
                        "btn-attack": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "⚔️ 공격", "variant": "primary"}, "children": []
                        },
                        "btn-flee": {
                            "on": {"press": {"action": "setState", "params": {"value": "fled", "statePath": "/sim.activeScene"}}},
                            "type": "Button", "props": {"label": "🏃 도주", "variant": "secondary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {"gold": 0, "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50, "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""}
            }
        },
        {
            "id": "n-init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "enemy_hp", "type": "number", "value": "30"},
                    {"key": "player_hp", "type": "number", "value": "50"},
                    {"key": "turn", "type": "number", "value": "5"},
                    {"key": "damage", "type": "number", "value": "0"},
                    {"key": "counter_dmg", "type": "number", "value": "0"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-turn-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "턴 남음?", "condition": "turn >= 1", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-attack", "type": "trigger",
            "position": {"x": 400, "y": 450},
            "data": {
                "label": "공격",
                "attributes": [
                    {"key": "damage", "type": "number", "value": "rand.d6() + rand.d6()"},
                    {"key": "enemy_hp", "type": "number", "value": "enemy_hp - damage"},
                    {"key": "turn", "type": "number", "value": "turn - 1"}
                ],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },
        {
            "id": "n-enemy-dead-gate", "type": "gate",
            "position": {"x": 400, "y": 600},
            "data": {"label": "적 사망?", "condition": "enemy_hp <= 0", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-counter", "type": "trigger",
            "position": {"x": 600, "y": 750},
            "data": {
                "label": "반격",
                "attributes": [
                    {"key": "counter_dmg", "type": "number", "value": "rand.d6()"},
                    {"key": "player_hp", "type": "number", "value": "player_hp - counter_dmg"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },
        {
            "id": "n-player-dead-gate", "type": "gate",
            "position": {"x": 600, "y": 900},
            "data": {"label": "플레이어 사망?", "condition": "player_hp <= 0", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-final-gate", "type": "gate",
            "position": {"x": 200, "y": 450},
            "data": {"label": "최종: HP 비교", "condition": "player_hp >= enemy_hp", "sdtEffects": sdt(), "frictionScore": 0}
        },
        {
            "id": "n-win-trigger", "type": "trigger",
            "position": {"x": 400, "y": 900},
            "data": {
                "label": "승리 보상",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "50"}],
                "sdtEffects": sdt(c=2, r=1), "frictionScore": 0
            }
        },
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "골드 허브", "sdtEffects": sdt(c=1), "frictionScore": 0}
        },
        {
            "id": "n-gold-res", "type": "resource",
            "position": {"x": 400, "y": 1200},
            "data": {"label": "골드", "resourceId": "res-gold-g2", "resourceKey": "gold"}
        },
        {
            "id": "n-win-end", "type": "success",
            "position": {"x": 400, "y": 1350},
            "data": {
                "label": "승리!", "sdtEffects": sdt(c=3, r=2), "frictionScore": 0,
                "mockSpec": {
                    "root": "win-screen",
                    "elements": {
                        "win-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-win", "win-body"]},
                        "top-win": {"type": "TopArea", "props": {}, "children": ["res-gold-win"]},
                        "res-gold-win": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "win-body": {"type": "VStack", "props": {}, "children": ["win-title", "win-desc", "sp-win", "reward-row"]},
                        "win-title": {"type": "Text", "props": {"text": "🏆 승리!", "variant": "title"}, "children": []},
                        "win-desc": {"type": "Text", "props": {"text": "고블린 왕을 물리쳤습니다!", "variant": "muted"}, "children": []},
                        "sp-win": {"type": "Spacer", "props": {}, "children": []},
                        "reward-row": {"type": "HStack", "props": {}, "children": ["rwd-lbl", "sp-rwd", "rwd-val"]},
                        "rwd-lbl": {"type": "Text", "props": {"text": "획득 골드", "variant": "muted"}, "children": []},
                        "sp-rwd": {"type": "Spacer", "props": {}, "children": []},
                        "rwd-val": {"type": "Text", "props": {"text": "{{gold}}", "variant": "tabular"}, "children": []}
                    }
                },
                "mockInitialState": {"gold": 50, "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50, "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""}
            }
        },
        {
            "id": "n-lose-end", "type": "failure",
            "position": {"x": 800, "y": 1050},
            "data": {
                "label": "패배...", "sdtEffects": sdt(), "frictionScore": 0,
                "mockSpec": {
                    "root": "lose-screen",
                    "elements": {
                        "lose-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["lose-body"]},
                        "lose-body": {"type": "VStack", "props": {}, "children": ["lose-title", "lose-desc", "sp-lose"]},
                        "lose-title": {"type": "Text", "props": {"text": "💀 패배...", "variant": "title"}, "children": []},
                        "lose-desc": {"type": "Text", "props": {"text": "용사가 쓰러졌습니다. 다시 도전하세요!", "variant": "muted"}, "children": []},
                        "sp-lose": {"type": "Spacer", "props": {}, "children": []}
                    }
                },
                "mockInitialState": {"gold": 0, "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50, "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""}
            }
        }
    ],
    "edges": [
        {"id": "e-entry-init", "source": "n-entry", "target": "n-init", "type": "exec"},
        {"id": "e-init-turn", "source": "n-init", "target": "n-turn-gate", "type": "exec"},
        {"id": "e-turn-true", "source": "n-turn-gate", "target": "n-attack", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-turn-false", "source": "n-turn-gate", "target": "n-final-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-attack-dead", "source": "n-attack", "target": "n-enemy-dead-gate", "type": "exec"},
        {"id": "e-enemy-dead-true", "source": "n-enemy-dead-gate", "target": "n-win-trigger", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-enemy-dead-false", "source": "n-enemy-dead-gate", "target": "n-counter", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-counter-pdead", "source": "n-counter", "target": "n-player-dead-gate", "type": "exec"},
        {"id": "e-pdead-true", "source": "n-player-dead-gate", "target": "n-lose-end", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-pdead-false", "source": "n-player-dead-gate", "target": "n-turn-gate", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-final-win", "source": "n-final-gate", "target": "n-win-trigger", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e-final-lose", "source": "n-final-gate", "target": "n-lose-end", "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e-win-hub", "source": "n-win-trigger", "target": "n-reward-hub", "type": "exec"},
        {"id": "e-hub-gold", "source": "n-reward-hub", "target": "n-gold-res", "type": "resource", "data": {"resourceAmountExpression": "gold_gain"}},
        {"id": "e-gold-win", "source": "n-gold-res", "target": "n-win-end", "type": "exec"}
    ]
}

# Save both files
with open('/Users/max/lle 안티그래비티/new_1/게임1_주사위_홀짝.json', 'w', encoding='utf-8') as f:
    json.dump(game1, f, ensure_ascii=False, indent=2)

with open('/Users/max/lle 안티그래비티/new_1/게임2_턴제_전투.json', 'w', encoding='utf-8') as f:
    json.dump(game2, f, ensure_ascii=False, indent=2)

print("두 게임 모두 생성 완료!")
print("게임1: 게임1_주사위_홀짝.json")
print("게임2: 게임2_턴제_전투.json")
