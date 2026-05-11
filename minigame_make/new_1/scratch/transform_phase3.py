import json

def transform_phase3_growth():
    with open('전투_3단계_샘플.json', 'r') as f:
        data = json.load(f)

    # 1. Define New Outcome Nodes
    new_nodes = [
        {
            "id": "n_outcome_levelup_prog",
            "type": "progression",
            "position": {"x": -375, "y": 1550},
            "data": {
                "label": "성장 (레벨업!)",
                "progressionType": "level",
                "description": "보스전을 앞두고 강해진 나!",
                "sdtEffects": {"motivation": 15, "competence": 10}
            }
        },
        {
            "id": "n_outcome_levelup_emo",
            "type": "emotion",
            "position": {"x": -375, "y": 1700},
            "data": {
                "label": "감정 (성장의 기쁨)",
                "needSource": "competence",
                "needState": "satisfied",
                "emotionType": "성취감",
                "arousal": "high",
                "description": "더 강력한 보스에 도전할 자격을 얻었습니다.",
                "tags": [], "playerSegment": []
            }
        },
        {
            "id": "n_outcome_boss_emo",
            "type": "emotion",
            "position": {"x": 1000, "y": 1500},
            "data": {
                "label": "감정 (전설적인 성취감)",
                "needSource": "competence",
                "needState": "satisfied",
                "emotionType": "성취감",
                "arousal": "high",
                "description": "마침내 보스를 쓰러뜨리고 전설이 되었습니다!",
                "tags": [], "playerSegment": []
            }
        }
    ]
    data['nodes'].extend(new_nodes)

    # 2. Update Edges for Level Up Flow
    # gate_levelup (id: gate_levelup, Branch: true) -> trig_levelup (or n_levelup_screen)
    # Let's find the original target of gate_levelup (true)
    for edge in data['edges']:
        if edge.get('source') == 'gate_levelup' and edge.get('data', {}).get('gateBranch') == 'true':
            original_target = edge['target']
            edge['target'] = 'n_outcome_levelup_prog'
            break
            
    data['edges'].extend([
        {
            "id": "edge_prog_to_emo_lv",
            "source": "n_outcome_levelup_prog", "target": "n_outcome_levelup_emo",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        },
        {
            "id": "edge_emo_to_screen_lv",
            "source": "n_outcome_levelup_emo", "target": "n_levelup_screen", # Assuming this is the next step
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        }
    ])

    # 3. Inject Boss Victory Gate
    # xbB65S1FVTQsKviTmpCo (적 사망?) -> trig_kill_reward
    # We'll split this based on is_boss
    boss_check_gate = {
        "id": "gate_is_boss",
        "type": "gate",
        "position": {"x": -353, "y": 950},
        "data": {
            "label": "보스인가?",
            "condition": "is_boss == 1",
            "sdtEffects": {"autonomy": 0, "competence": 0, "motivation": 0, "relatedness": 0}
        }
    }
    data['nodes'].append(boss_check_gate)

    # Re-route: xbB65S1FVTQsKviTmpCo (true) -> gate_is_boss
    for edge in data['edges']:
        if edge.get('source') == 'xbB65S1FVTQsKviTmpCo' and edge.get('data', {}).get('gateBranch') == 'true':
            edge['target'] = 'gate_is_boss'
            break
            
    # Add branches for boss check
    data['edges'].extend([
        {
            "id": "edge_boss_true",
            "source": "gate_is_boss", "target": "n_outcome_boss_emo",
            "type": "exec", "sourceHandle": "right", "targetHandle": "top",
            "data": {"gateBranch": "true", "label": "보스 처치!"}
        },
        {
            "id": "edge_boss_false",
            "source": "gate_is_boss", "target": "trig_kill_reward",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top",
            "data": {"gateBranch": "false", "label": "일반몹 처치"}
        },
        {
            "id": "edge_boss_emo_to_reward",
            "source": "n_outcome_boss_emo", "target": "trig_kill_reward",
            "type": "exec", "sourceHandle": "bottom", "targetHandle": "top"
        }
    ])

    # 4. Resource Cleanup (Gold and Score only in UI)
    keep_keys = {'gold', 'player_gold', 'score', 'player_score'} # Mapping both common keys
    for node in data['nodes']:
        mock_spec = node['data'].get('mockSpec', {})
        if not mock_spec: continue
        elements = mock_spec.get('elements', {})
        to_remove = []
        for eid, el in elements.items():
            res_key = el.get('props', {}).get('resourceKey')
            if res_key and res_key not in ['gold', 'player_gold', 'score', 'player_score']:
                to_remove.append(eid)
            if any(k in eid for k in ['hp', 'dice', 'item', 'weapon']):
                if not any(keep in eid for keep in ['gold', 'score']):
                    to_remove.append(eid)
        for rid in set(to_remove):
            if rid in elements: del elements[rid]
        for eid, el in elements.items():
            if 'children' in el and isinstance(el['children'], list):
                el['children'] = [c for c in el['children'] if c not in to_remove]

    # 5. Fix Entry Motivation
    for node in data['nodes']:
        if node['type'] == 'entry':
            node['data']['sdtEffects'] = {"motivation": 100, "autonomy": 20, "competence": 20, "relatedness": 0}

    with open('전투_3단계_성장특화_최종.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    transform_phase3_growth()
