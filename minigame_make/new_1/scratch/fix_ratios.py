import json

def fix_ratios():
    with open('전투_2단계.json', 'r') as f:
        data = json.load(f)

    for node in data['nodes']:
        if node['id'] == 'trig_player_atk':
            for attr in node['data']['attributes']:
                if attr['key'] == 'enemy_hp_ratio':
                    attr['value'] = "(enemy_hp - damage) / 50"
        elif node['id'] == 'trig_enemy_atk':
            for attr in node['data']['attributes']:
                if attr['key'] == 'player_hp_ratio':
                    attr['value'] = "(player_hp - damage) / 100"

    with open('전투_2단계.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_ratios()
