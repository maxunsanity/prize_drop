import json
from datetime import datetime

def sdt(c=0, r=0):
    return {"autonomy": 0, "competence": c, "relatedness": r, "motivation": 0}

NOW = datetime.utcnow().isoformat() + "Z"

MOCK_INIT = {
    "gold": 100,
    "sdt.autonomy": 50, "sdt.competence": 50, "sdt.motivation": 50, "sdt.relatedness": 50,
    "sim.activeModal": "", "sim.activeScene": "", "sim.currentStep": 0, "sim.activeScreen": ""
}

game1 = {
    "version": 1,
    "designName": "게임1_주사위_홀짝_v2",
    "exportedAt": NOW,
    "resources": [
        {"id": "res-gold-g1", "key": "gold", "name": "골드", "color": "#FFD700", "icon": "coin"}
    ],
    "attributes": [
        {"key": "dice", "type": "number", "value": "10"},
        {"key": "roll", "type": "number", "value": "0"},
        {"key": "bet_high", "type": "number", "value": "1"},
        {"key": "gold_gain", "type": "number", "value": "0"}
    ],
    "entityTypes": [],
    "nodes": [
        # ── 1. Entry ──────────────────────────────────
        {
            "id": "n-entry", "type": "entry",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "게임 시작", "tags": [],
                "mockSpec": {
                    "root": "start-screen",
                    "elements": {
                        "start-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-bar", "start-body"]},
                        "top-bar": {"type": "TopArea", "props": {}, "children": ["res-gold"]},
                        "res-gold": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "start-body": {"type": "VStack", "props": {}, "children": ["s-title", "s-desc", "s-rule1", "s-rule2", "sp1", "start-btn"]},
                        "s-title": {"type": "Text", "props": {"text": "🎲 주사위 예측 게임", "variant": "title"}, "children": []},
                        "s-desc": {"type": "Text", "props": {"text": "주사위 결과를 예측하세요! 10번의 기회가 있습니다.", "variant": "muted"}, "children": []},
                        "s-rule1": {"type": "Text", "props": {"text": "✅ 높음(4~6) 예측 성공 → +10 골드", "variant": "muted"}, "children": []},
                        "s-rule2": {"type": "Text", "props": {"text": "✅ 낮음(1~3) 예측 성공 → +10 골드  ❌ 실패 → -5 골드", "variant": "muted"}, "children": []},
                        "sp1": {"type": "Spacer", "props": {}, "children": []},
                        "start-btn": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🎲 게임 시작!", "variant": "primary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },

        # ── 2. Init ───────────────────────────────────
        {
            "id": "n-init", "type": "trigger",
            "position": {"x": 400, "y": 150},
            "data": {
                "label": "초기화",
                "attributes": [
                    {"key": "dice", "type": "number", "value": "10"},
                    {"key": "roll", "type": "number", "value": "0"},
                    {"key": "bet_high", "type": "number", "value": "1"},
                    {"key": "gold_gain", "type": "number", "value": "0"}
                ],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },

        # ── 3. Loop Gate ──────────────────────────────
        {
            "id": "n-loop-gate", "type": "gate",
            "position": {"x": 400, "y": 300},
            "data": {"label": "주사위 남음?", "condition": "dice >= 1", "sdtEffects": sdt(), "frictionScore": 0}
        },

        # ── 4. Consume Dice ───────────────────────────
        {
            "id": "n-consume-dice", "type": "disposal",
            "position": {"x": 400, "y": 450},
            "data": {"label": "주사위 소비", "sdtEffects": sdt(), "frictionScore": 0}
        },

        # ── 5. Choice Scene (높음/낮음 선택) ──────────
        {
            "id": "n-choice-bet", "type": "choice",
            "position": {"x": 400, "y": 600},
            "data": {
                "label": "예측 선택", "tags": [],
                "mockSpec": {
                    "root": "bet-screen",
                    "elements": {
                        "bet-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-bet", "bet-body"]},
                        "top-bet": {"type": "TopArea", "props": {}, "children": ["res-gold-bet"]},
                        "res-gold-bet": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "bet-body": {"type": "VStack", "props": {}, "children": ["bet-title", "bet-sub", "dice-remain-row", "sp-bet", "btn-high", "btn-low"]},
                        "bet-title": {"type": "Text", "props": {"text": "🎲 어느 쪽이 나올까요?", "variant": "title"}, "children": []},
                        "bet-sub": {"type": "Text", "props": {"text": "주사위 눈의 범위를 예측하세요!", "variant": "muted"}, "children": []},
                        "dice-remain-row": {"type": "HStack", "props": {}, "children": ["dice-lbl", "sp-dc", "dice-val"]},
                        "dice-lbl": {"type": "Text", "props": {"text": "남은 기회", "variant": "muted"}, "children": []},
                        "sp-dc": {"type": "Spacer", "props": {}, "children": []},
                        "dice-val": {"type": "Text", "props": {"text": "{{gold}} G 보유", "variant": "tabular"}, "children": []},
                        "sp-bet": {"type": "Spacer", "props": {}, "children": []},
                        "btn-high": {
                            "on": {"press": {"action": "setState", "params": {"value": 1, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🔼 높음 (4 ~ 6)", "variant": "primary"}, "children": []
                        },
                        "btn-low": {
                            "on": {"press": {"action": "setState", "params": {"value": 2, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "🔽 낮음 (1 ~ 3)", "variant": "secondary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },

        # ── 6a. 높음 선택 세팅 ───────────────────────
        {
            "id": "n-set-high", "type": "trigger",
            "position": {"x": 200, "y": 750},
            "data": {
                "label": "높음 선택",
                "attributes": [{"key": "bet_high", "type": "number", "value": "1"}],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },

        # ── 6b. 낮음 선택 세팅 ───────────────────────
        {
            "id": "n-set-low", "type": "trigger",
            "position": {"x": 600, "y": 750},
            "data": {
                "label": "낮음 선택",
                "attributes": [{"key": "bet_high", "type": "number", "value": "0"}],
                "sdtEffects": sdt(c=1), "frictionScore": 0
            }
        },

        # ── 7. Roll ──────────────────────────────────
        {
            "id": "n-roll", "type": "trigger",
            "position": {"x": 400, "y": 900},
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

        # ── 8. 높음/낮음 분기 ───────────────────────
        {
            "id": "n-bet-gate", "type": "gate",
            "position": {"x": 400, "y": 1050},
            "data": {"label": "높음 선택?", "condition": "bet_high == 1", "sdtEffects": sdt(), "frictionScore": 0}
        },

        # ── 9a. 높음 결과 게이트 ────────────────────
        {
            "id": "n-high-result-gate", "type": "gate",
            "position": {"x": 200, "y": 1200},
            "data": {"label": "주사위 4이상?", "condition": "roll >= 4", "sdtEffects": sdt(), "frictionScore": 0}
        },

        # ── 9b. 낮음 결과 게이트 ────────────────────
        {
            "id": "n-low-result-gate", "type": "gate",
            "position": {"x": 600, "y": 1200},
            "data": {"label": "주사위 3이하?", "condition": "roll <= 3", "sdtEffects": sdt(), "frictionScore": 0}
        },

        # ── 10a. 승리 Trigger ────────────────────────
        {
            "id": "n-win-trigger", "type": "trigger",
            "position": {"x": 200, "y": 1350},
            "data": {
                "label": "예측 성공! +10골드",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "10"}],
                "sdtEffects": sdt(c=2, r=1), "frictionScore": 0
            }
        },

        # ── 10b. 패배 Trigger ────────────────────────
        {
            "id": "n-lose-trigger", "type": "trigger",
            "position": {"x": 600, "y": 1350},
            "data": {
                "label": "예측 실패 -5골드",
                "attributes": [{"key": "gold_gain", "type": "number", "value": "-5"}],
                "sdtEffects": sdt(), "frictionScore": 0
            }
        },

        # ── 11a. 승리 Result Scene ───────────────────
        {
            "id": "n-win-result", "type": "scene",
            "position": {"x": 200, "y": 1500},
            "data": {
                "label": "승리 결과", "tags": [], "loadingTime": "instant",
                "mockSpec": {
                    "root": "win-screen",
                    "elements": {
                        "win-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-win", "win-body"]},
                        "top-win": {"type": "TopArea", "props": {}, "children": ["res-gold-win"]},
                        "res-gold-win": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "win-body": {"type": "VStack", "props": {}, "children": ["win-title", "roll-row", "gain-row", "sp-win", "next-btn"]},
                        "win-title": {"type": "Text", "props": {"text": "🎉 예측 성공!", "variant": "title"}, "children": []},
                        "roll-row": {"type": "HStack", "props": {}, "children": ["roll-lbl", "sp-r", "roll-val"]},
                        "roll-lbl": {"type": "Text", "props": {"text": "주사위 결과", "variant": "muted"}, "children": []},
                        "sp-r": {"type": "Spacer", "props": {}, "children": []},
                        "roll-val": {"type": "Text", "props": {"text": "🎲 {{gold}}", "variant": "tabular"}, "children": []},
                        "gain-row": {"type": "HStack", "props": {}, "children": ["gain-lbl", "sp-g", "gain-val"]},
                        "gain-lbl": {"type": "Text", "props": {"text": "획득 골드", "variant": "muted"}, "children": []},
                        "sp-g": {"type": "Spacer", "props": {}, "children": []},
                        "gain-val": {"type": "Text", "props": {"text": "+10 골드 💰", "variant": "tabular"}, "children": []},
                        "sp-win": {"type": "Spacer", "props": {}, "children": []},
                        "next-btn": {
                            "on": {"press": {"action": "setState", "params": {"value": 0, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "다음 라운드 ▶", "variant": "primary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },

        # ── 11b. 패배 Result Scene ───────────────────
        {
            "id": "n-lose-result", "type": "scene",
            "position": {"x": 600, "y": 1500},
            "data": {
                "label": "패배 결과", "tags": [], "loadingTime": "instant",
                "mockSpec": {
                    "root": "lose-screen",
                    "elements": {
                        "lose-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-lose", "lose-body"]},
                        "top-lose": {"type": "TopArea", "props": {}, "children": ["res-gold-lose"]},
                        "res-gold-lose": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "lose-body": {"type": "VStack", "props": {}, "children": ["lose-title", "roll-row-l", "pen-row", "sp-lose", "next-btn-l"]},
                        "lose-title": {"type": "Text", "props": {"text": "😢 예측 실패...", "variant": "title"}, "children": []},
                        "roll-row-l": {"type": "HStack", "props": {}, "children": ["roll-lbl-l", "sp-rl", "roll-val-l"]},
                        "roll-lbl-l": {"type": "Text", "props": {"text": "주사위 결과", "variant": "muted"}, "children": []},
                        "sp-rl": {"type": "Spacer", "props": {}, "children": []},
                        "roll-val-l": {"type": "Text", "props": {"text": "🎲 {{gold}}", "variant": "tabular"}, "children": []},
                        "pen-row": {"type": "HStack", "props": {}, "children": ["pen-lbl", "sp-p", "pen-val"]},
                        "pen-lbl": {"type": "Text", "props": {"text": "페널티", "variant": "muted"}, "children": []},
                        "sp-p": {"type": "Spacer", "props": {}, "children": []},
                        "pen-val": {"type": "Text", "props": {"text": "-5 골드 💸", "variant": "tabular"}, "children": []},
                        "sp-lose": {"type": "Spacer", "props": {}, "children": []},
                        "next-btn-l": {
                            "on": {"press": {"action": "setState", "params": {"value": 0, "statePath": "/sim.currentStep"}}},
                            "type": "Button", "props": {"label": "다음 라운드 ▶", "variant": "secondary"}, "children": []
                        }
                    }
                },
                "mockInitialState": {**MOCK_INIT}
            }
        },

        # ── 12. Reward Hub ───────────────────────────
        {
            "id": "n-reward-hub", "type": "reward",
            "position": {"x": 400, "y": 1680},
            "data": {"label": "골드 허브", "sdtEffects": sdt(c=1), "frictionScore": 0}
        },

        # ── 13. Gold Resource ────────────────────────
        {
            "id": "n-gold-res", "type": "resource",
            "position": {"x": 400, "y": 1830},
            "data": {"label": "골드", "resourceId": "res-gold-g1", "resourceKey": "gold"}
        },

        # ── 14. Game End ─────────────────────────────
        {
            "id": "n-end", "type": "success",
            "position": {"x": 800, "y": 300},
            "data": {
                "label": "최종 결과", "sdtEffects": sdt(c=2, r=1), "frictionScore": 0,
                "mockSpec": {
                    "root": "end-screen",
                    "elements": {
                        "end-screen": {"type": "Screen", "props": {"scrollable": False}, "children": ["top-end", "end-body"]},
                        "top-end": {"type": "TopArea", "props": {}, "children": ["res-gold-end"]},
                        "res-gold-end": {"type": "ResourceMeter", "props": {"resourceKey": "gold"}, "children": []},
                        "end-body": {"type": "VStack", "props": {}, "children": ["end-title", "end-desc", "sp-end", "final-row"]},
                        "end-title": {"type": "Text", "props": {"text": "🏆 게임 종료!", "variant": "title"}, "children": []},
                        "end-desc": {"type": "Text", "props": {"text": "10번의 예측이 모두 끝났습니다.", "variant": "muted"}, "children": []},
                        "sp-end": {"type": "Spacer", "props": {}, "children": []},
                        "final-row": {"type": "HStack", "props": {}, "children": ["final-lbl", "sp-final", "final-val"]},
                        "final-lbl": {"type": "Text", "props": {"text": "최종 골드", "variant": "muted"}, "children": []},
                        "sp-final": {"type": "Spacer", "props": {}, "children": []},
                        "final-val": {"type": "Text", "props": {"text": "{{gold}} 골드", "variant": "tabular"}, "children": []}
                    }
                },
                "mockInitialState": {**MOCK_INIT, "gold": 150}
            }
        }
    ],

    "edges": [
        {"id": "e01", "source": "n-entry",            "target": "n-init",             "type": "exec"},
        {"id": "e02", "source": "n-init",             "target": "n-loop-gate",        "type": "exec"},
        {"id": "e03", "source": "n-loop-gate",        "target": "n-consume-dice",     "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e04", "source": "n-loop-gate",        "target": "n-end",              "type": "exec", "data": {"gateBranch": "false"}},
        {"id": "e05", "source": "n-consume-dice",     "target": "n-choice-bet",       "type": "exec"},
        # choice 분기
        {"id": "e06", "source": "n-choice-bet",       "target": "n-set-high",         "type": "exec"},
        {"id": "e07", "source": "n-choice-bet",       "target": "n-set-low",          "type": "exec"},
        # 선택 후 roll
        {"id": "e08", "source": "n-set-high",         "target": "n-roll",             "type": "exec"},
        {"id": "e09", "source": "n-set-low",          "target": "n-roll",             "type": "exec"},
        # roll → bet 분기
        {"id": "e10", "source": "n-roll",             "target": "n-bet-gate",         "type": "exec"},
        {"id": "e11", "source": "n-bet-gate",         "target": "n-high-result-gate", "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e12", "source": "n-bet-gate",         "target": "n-low-result-gate",  "type": "exec", "data": {"gateBranch": "false"}},
        # 높음 결과
        {"id": "e13", "source": "n-high-result-gate", "target": "n-win-trigger",      "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e14", "source": "n-high-result-gate", "target": "n-lose-trigger",     "type": "exec", "data": {"gateBranch": "false"}},
        # 낮음 결과
        {"id": "e15", "source": "n-low-result-gate",  "target": "n-win-trigger",      "type": "exec", "data": {"gateBranch": "true"}},
        {"id": "e16", "source": "n-low-result-gate",  "target": "n-lose-trigger",     "type": "exec", "data": {"gateBranch": "false"}},
        # 결과 → scene
        {"id": "e17", "source": "n-win-trigger",      "target": "n-win-result",       "type": "exec"},
        {"id": "e18", "source": "n-lose-trigger",     "target": "n-lose-result",      "type": "exec"},
        # scene → reward hub
        {"id": "e19", "source": "n-win-result",       "target": "n-reward-hub",       "type": "exec"},
        {"id": "e20", "source": "n-lose-result",      "target": "n-reward-hub",       "type": "exec"},
        # reward → resource → loop
        {"id": "e21", "source": "n-reward-hub",       "target": "n-gold-res",         "type": "resource", "data": {"resourceAmountExpression": "gold_gain"}},
        {"id": "e22", "source": "n-gold-res",         "target": "n-loop-gate",        "type": "exec"}
    ]
}

with open('/Users/max/lle 안티그래비티/new_1/게임1_주사위_홀짝_v2.json', 'w', encoding='utf-8') as f:
    json.dump(game1, f, ensure_ascii=False, indent=2)

print("게임1 v2 생성 완료! (높음/낮음 선택 + 결과 화면 추가)")
