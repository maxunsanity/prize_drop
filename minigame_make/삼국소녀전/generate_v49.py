import json

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V48.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Fix the attributes in the Stage Sync logic nodes
for node in data['nodes']:
    if 'n-stage-sync-' in node['id']:
        idx = node['id'].split('-')[-1]
        
        # In formulas, we must use stage_X instead of node-entity-stage_X
        # to avoid the hyphen being evaluated as subtraction.
        correct_entity_ref = f"stage_{idx}"
        
        node['data']['attributes'] = [
            {"key": "current_stage_scale", "type": "number", "value": f"{correct_entity_ref}.reward_scale"},
            {"key": "current_stage_shutdown_base_reward", "type": "number", "value": f"{correct_entity_ref}.shutdown_base_reward"},
            {"key": "current_stage_shutdown_hit_rate", "type": "number", "value": f"{correct_entity_ref}.shutdown_hit_rate"},
            {"key": "current_stage_shutdown_blocked_rate", "type": "number", "value": f"{correct_entity_ref}.shutdown_blocked_rate"},
            {"key": "current_stage_heist_reward_small", "type": "number", "value": f"{correct_entity_ref}.heist_reward_small"},
            {"key": "current_stage_heist_reward_medium", "type": "number", "value": f"{correct_entity_ref}.heist_reward_medium"},
            {"key": "current_stage_heist_reward_large", "type": "number", "value": f"{correct_entity_ref}.heist_reward_large"},
            {"key": "current_stage_heist_rate_small", "type": "number", "value": f"{correct_entity_ref}.heist_rate_small"},
            {"key": "current_stage_heist_rate_medium", "type": "number", "value": f"{correct_entity_ref}.heist_rate_medium"},
            {"key": "current_stage_heist_rate_large", "type": "number", "value": f"{correct_entity_ref}.heist_rate_large"}
        ]

# 2. Fix the targetKey in the Data Edges for the stage entities
for edge in data['edges']:
    if 'e-stage-data-' in edge['id']:
        # For data edges, the targetKey should just be the attribute name, not prefixed by the entity name.
        # It's relative to the target entity node.
        edge['data']['tableEntityAttributeMappings'] = [
            {"sourceKey": "reward_scale", "targetKey": "reward_scale"},
            {"sourceKey": "shutdown_base_reward", "targetKey": "shutdown_base_reward"},
            {"sourceKey": "shutdown_hit_rate", "targetKey": "shutdown_hit_rate"},
            {"sourceKey": "shutdown_blocked_rate", "targetKey": "shutdown_blocked_rate"},
            {"sourceKey": "heist_reward_small", "targetKey": "heist_reward_small"},
            {"sourceKey": "heist_reward_medium", "targetKey": "heist_reward_medium"},
            {"sourceKey": "heist_reward_large", "targetKey": "heist_reward_large"},
            {"sourceKey": "heist_rate_small", "targetKey": "heist_rate_small"},
            {"sourceKey": "heist_rate_medium", "targetKey": "heist_rate_medium"},
            {"sourceKey": "heist_rate_large", "targetKey": "heist_rate_large"}
        ]

# 3. Rename to V49
data['designName'] = "돈_획득_40칸_테이블_연동_V49"

with open('/Users/max/lle 안티그래비티/돈_획득_40칸_테이블_연동_V49.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("V49 generated with corrected entity references to fix the hyphen subtraction parsing error.")
