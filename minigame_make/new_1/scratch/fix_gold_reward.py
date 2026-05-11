import json
import copy

def fix_gold_reward():
    with open('전투_3단계_골드_v3.json', 'r') as f:
        data = json.load(f)

    # 1. Remove player_gold attributes from triggers
    for node in data['nodes']:
        if node['id'] == 'trig_kill_reward':
            attrs = node['data'].get('attributes', [])
            node['data']['attributes'] = [attr for attr in attrs if attr['key'] != 'player_gold']
        elif node['id'] == 'trig_boss_reward':
            attrs = node['data'].get('attributes', [])
            node['data']['attributes'] = [attr for attr in attrs if attr['key'] != 'player_gold']
            
    # 2. Add n_gold_reward_boss node (Duplicate of n_gold_reward)
    gold_reward_node = next(n for n in data['nodes'] if n['id'] == 'n_gold_reward')
    boss_reward_node = copy.deepcopy(gold_reward_node)
    boss_reward_node['id'] = 'n_gold_reward_boss'
    boss_reward_node['position'] = {"x": gold_reward_node['position']['x'] + 300, "y": gold_reward_node['position']['y']}
    boss_reward_node['data']['label'] = "보스 골드 획득"
    data['nodes'].append(boss_reward_node)

    # 3. Clean up old edges
    edges_to_remove = [
        "xy-edge__trig_kill_rewardbottom-gate_leveluptop",
        "xy-edge__trig_kill_rewardright-n_gold_rewardleft",
        "xy-edge__trig_boss_rewardbottom-n_select_monstertop",
        "xy-edge__trig_boss_rewardright-n_gold_rewardtop",
        "xy-edge__n_gold_rewardright-goldleft" # Remove old resource edge to replace with clean ones
    ]
    data['edges'] = [e for e in data['edges'] if e['id'] not in edges_to_remove]
    
    # Also remove any edges starting with these patterns just in case
    data['edges'] = [e for e in data['edges'] if not (
        (e.get('source') == 'trig_kill_reward' and e.get('target') == 'gate_levelup') or
        (e.get('source') == 'trig_kill_reward' and e.get('target') == 'n_gold_reward') or
        (e.get('source') == 'trig_boss_reward' and e.get('target') == 'n_select_monster') or
        (e.get('source') == 'trig_boss_reward' and e.get('target') == 'n_gold_reward') or
        (e.get('source') == 'n_gold_reward' and e.get('target') == 'n_7Sh8pLXfHq')
    )]

    # 4. Add new sequential execution edges and resource edges
    new_edges = [
        # Normal Kill Flow
        {
            "id": "edge_trig_kill_to_reward",
            "source": "trig_kill_reward",
            "target": "n_gold_reward",
            "type": "exec",
            "sourceHandle": "bottom",
            "targetHandle": "top"
        },
        {
            "id": "edge_reward_to_levelup",
            "source": "n_gold_reward",
            "target": "gate_levelup",
            "type": "exec",
            "sourceHandle": "bottom",
            "targetHandle": "top"
        },
        {
            "id": "edge_reward_to_resource",
            "source": "n_gold_reward",
            "target": "n_7Sh8pLXfHq",
            "type": "resource",
            "sourceHandle": "right",
            "targetHandle": "left",
            "data": {
                "amount": 1,
                "resourceAmountExpression": "enemy_gold_reward"
            }
        },
        # Boss Kill Flow
        {
            "id": "edge_trig_boss_to_reward",
            "source": "trig_boss_reward",
            "target": "n_gold_reward_boss",
            "type": "exec",
            "sourceHandle": "bottom",
            "targetHandle": "top"
        },
        {
            "id": "edge_boss_reward_to_select",
            "source": "n_gold_reward_boss",
            "target": "n_select_monster",
            "type": "exec",
            "sourceHandle": "bottom",
            "targetHandle": "top"
        },
        {
            "id": "edge_boss_reward_to_resource",
            "source": "n_gold_reward_boss",
            "target": "n_7Sh8pLXfHq",
            "type": "resource",
            "sourceHandle": "right",
            "targetHandle": "left",
            "data": {
                "amount": 1,
                "resourceAmountExpression": "enemy_gold_reward"
            }
        }
    ]
    
    data['edges'].extend(new_edges)

    with open('전투_3단계_골드_v3_수정본.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    fix_gold_reward()
