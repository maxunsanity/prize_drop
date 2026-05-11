import json
import uuid

def implement_phase_3():
    with open('전투_3단계.json', 'r') as f:
        data = json.load(f)

    # 1. Update n_init_player to use "Data-driven" values
    # We'll set these as "Base Stats"
    for node in data['nodes']:
        if node['id'] == 'n_init_player':
            node['data']['label'] = "🧙 플레이어 데이터 로드"
            node['data']['attributes'] = [
                {"key": "player_max_hp", "type": "number", "value": "100"},
                {"key": "player_atk", "type": "number", "value": "15"},
                {"key": "player_hp", "type": "number", "value": "player_max_hp"},
                {"key": "player_hp_ratio", "type": "number", "value": "1"},
                {"key": "player_name", "type": "string", "value": "'용사'"},
                {"key": "damage", "type": "number", "value": "0"},
                {"key": "turn_count", "type": "number", "value": "0"}
            ]
            
        elif node['id'] == 'n_init_enemy':
            node['data']['label'] = "🐉 몬스터 테이블 랜덤 추출"
            # Logic: Roll a d3 to pick a monster
            node['data']['attributes'] = [
                {"key": "monster_roll", "type": "number", "value": "rand.range(1, 4)"},
                # Slime (1)
                {"key": "enemy_name", "type": "string", "value": "monster_roll == 1 ? '슬라임' : (monster_roll == 2 ? '고블린' : '암흑 드래곤')"},
                {"key": "enemy_max_hp", "type": "number", "value": "monster_roll == 1 ? 30 : (monster_roll == 2 ? 50 : 100)"},
                {"key": "enemy_atk", "type": "number", "value": "monster_roll == 1 ? 3 : (monster_roll == 2 ? 6 : 12)"},
                {"key": "enemy_avatar", "type": "string", "value": "monster_roll == 1 ? '💧' : (monster_roll == 2 ? '👺' : '🐉')"},
                {"key": "enemy_hp", "type": "number", "value": "enemy_max_hp"},
                {"key": "enemy_hp_ratio", "type": "number", "value": "1"}
            ]

    # 2. Update UI to use these variables
    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice
            elements = node['data']['mockSpec']['elements']
            if 'player-name' in elements:
                elements['player-name']['props']['text'] = "{{player_name}}"
            if 'enemy-name' in elements:
                elements['enemy-name']['props']['text'] = "{{enemy_name}}"
            if 'enemy-avatar' in elements:
                elements['enemy-avatar']['props']['text'] = "{{enemy_avatar}}"
            
            # Update levels in UI based on roll if we want
            if 'enemy-level' in elements:
                elements['enemy-level']['props']['text'] = "Lv. {{monster_roll * 2}}"

    with open('전투_3단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    implement_phase_3()
