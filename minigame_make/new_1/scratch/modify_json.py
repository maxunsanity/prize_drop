import json
import uuid

def modify():
    with open('전투_1단계.json', 'r') as f:
        data = json.load(f)

    data['designName'] = "전투_2단계"
    data['version'] = 2

    # Add SDT effects where missing
    for node in data['nodes']:
        if node['type'] in ['choice', 'success', 'failure']:
            if 'sdtEffects' not in node['data']:
                node['data']['sdtEffects'] = {}
            node['data']['sdtEffects'].setdefault('autonomy', 0)
            node['data']['sdtEffects'].setdefault('competence', 5)
            node['data']['sdtEffects'].setdefault('relatedness', 0)
            node['data']['sdtEffects'].setdefault('motivation', 20)

    # Gate conditions
    for node in data['nodes']:
        if node['id'] == 'xbB65S1FVTQsKviTmpCo': # 적 사망?
            node['data']['condition'] = "enemy_hp <= 0"
        elif node['id'] == 'dbClGLpmQ22hftQwXs3M': # 플레이어 사망?
            node['data']['condition'] = "player_hp <= 0"

    # Create n_init trigger
    n_init = {
        "id": "n_init",
        "type": "trigger",
        "position": {"x": 320, "y": 120},
        "data": {
            "tags": [],
            "label": "전투 변수 초기화",
            "attributes": [
                {"key": "player_hp", "value": "100"},
                {"key": "enemy_hp", "value": "50"},
                {"key": "player_atk", "value": "10"},
                {"key": "enemy_atk", "value": "5"}
            ],
            "description": ""
        },
        "measured": {"width": 220, "height": 85}
    }

    # Create trig_player_atk trigger
    trig_player_atk = {
        "id": "trig_player_atk",
        "type": "trigger",
        "position": {"x": 147, "y": 640},
        "data": {
            "tags": [],
            "label": "플레이어 공격 계산",
            "attributes": [
                {"key": "damage", "value": "player_atk + rand.d6()"},
                {"key": "enemy_hp", "value": "enemy_hp - damage"}
            ],
            "description": ""
        },
        "measured": {"width": 220, "height": 85}
    }

    # Create trig_enemy_atk trigger
    trig_enemy_atk = {
        "id": "trig_enemy_atk",
        "type": "trigger",
        "position": {"x": 480, "y": 1000},
        "data": {
            "tags": [],
            "label": "적 공격 계산",
            "attributes": [
                {"key": "damage", "value": "enemy_atk + rand.d6()"},
                {"key": "player_hp", "value": "player_hp - damage"}
            ],
            "description": ""
        },
        "measured": {"width": 220, "height": 85}
    }

    data['nodes'].extend([n_init, trig_player_atk, trig_enemy_atk])

    # Re-map edges
    new_edges = []
    for edge in data['edges']:
        if edge['source'] == '3dMvnKaXtRBlG9qJOqe0' and edge['target'] == 'HIOoyUfUBzgoZfaJbe2o': # entry to choice
            # entry -> n_init
            new_edges.append({
                "id": f"xy-edge__3dMvnKaXtRBlG9qJOqe0bottom-n_inittop",
                "source": "3dMvnKaXtRBlG9qJOqe0",
                "target": "n_init",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })
            # n_init -> choice
            new_edges.append({
                "id": f"xy-edge__n_initbottom-HIOoyUfUBzgoZfaJbe2otop",
                "source": "n_init",
                "target": "HIOoyUfUBzgoZfaJbe2o",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })
        elif edge['source'] == 'lxkO9hDma1yfobSxAcnR' and edge['target'] == 'xbB65S1FVTQsKviTmpCo': # attack to gate
            # attack -> trig_player_atk
            new_edges.append({
                "id": f"xy-edge__lxkO9hDma1yfobSxAcnRbottom-trig_player_atktop",
                "source": "lxkO9hDma1yfobSxAcnR",
                "target": "trig_player_atk",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })
            # trig_player_atk -> gate
            new_edges.append({
                "id": f"xy-edge__trig_player_atkbottom-xbB65S1FVTQsKviTmpCotop",
                "source": "trig_player_atk",
                "target": "xbB65S1FVTQsKviTmpCo",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            })
        elif edge['source'] == 'WOGebJtUG9fTXv1AggCH' and edge['target'] == 'dbClGLpmQ22hftQwXs3M': # enemy attack to player dead gate
            # enemy attack -> trig_enemy_atk
            new_edges.append({
                "id": f"xy-edge__WOGebJtUG9fTXv1AggCHbottom-trig_enemy_atkleft",
                "source": "WOGebJtUG9fTXv1AggCH",
                "target": "trig_enemy_atk",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "right",
                "targetHandle": "left"
            })
            # trig_enemy_atk -> player dead gate
            new_edges.append({
                "id": f"xy-edge__trig_enemy_atkright-dbClGLpmQ22hftQwXs3Mleft",
                "source": "trig_enemy_atk",
                "target": "dbClGLpmQ22hftQwXs3M",
                "data": {"animated": False},
                "type": "exec",
                "sourceHandle": "right",
                "targetHandle": "left"
            })
        else:
            new_edges.append(edge)

    data['edges'] = new_edges

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    modify()
