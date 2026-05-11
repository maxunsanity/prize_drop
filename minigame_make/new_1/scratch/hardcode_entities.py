import json
import re

def hardcode_entities():
    with open('전투_3단계_성장특화_최종_v3.json', 'r') as f:
        data = json.load(f)

    # Replacement Mapping (Entity -> Value)
    replacements = {
        'character.hp': '100',
        'character.max_hp': '100',
        'character.atk': '15',
        'character.def': '5',
        'character.level': '1',
        'character.exp': '0',
        'character.gold': '0',
        'goblin.hp': '30',
        'goblin.max_hp': '30',
        'goblin.atk': '8',
        'goblin.def': '3',
        'goblin.exp_reward': '20',
        'goblin.gold_reward': '10',
        'boss.hp': '150',
        'boss.max_hp': '150',
        'boss.atk': '20',
        'boss.def': '10',
        'boss.exp_reward': '150',
        'boss.gold_reward': '60',
        'levelup_1.exp_to_next': '100',
        'fireball.cooldown_max': '3'
    }

    def replace_value(val):
        if not isinstance(val, str):
            return val
        for k, v in replacements.items():
            # Use regex to match exact word to avoid partial replacements
            val = re.sub(r'\b' + re.escape(k) + r'\b', v, val)
        return val

    # Apply to all nodes (Attributes and Labels)
    for node in data['nodes']:
        # Attributes
        if 'attributes' in node['data']:
            for attr in node['data']['attributes']:
                if 'value' in attr:
                    attr['value'] = replace_value(attr['value'])
        
        # Gates
        if 'condition' in node['data']:
            node['data']['condition'] = replace_value(node['data']['condition'])
            
        # UI labels (for consistency)
        if 'label' in node['data']:
            node['data']['label'] = replace_value(node['data']['label'])

    with open('전투_3단계_성장특화_최종_v4.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    hardcode_entities()
