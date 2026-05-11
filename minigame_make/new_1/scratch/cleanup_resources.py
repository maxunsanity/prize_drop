import json

def cleanup_resources():
    with open('전투_1단계_2마리_최종검수_v5.json', 'r') as f:
        data = json.load(f)

    # List of resource keys to keep (currently used in UI or Reward nodes)
    used_keys = {'gold', 'hp', 'score', 'dice', 'item', 'LjFFeQfJibzToAWeOUs9'}
    
    # Filter resources
    if 'resources' in data:
        data['resources'] = [r for r in data['resources'] if r['key'] in used_keys]

    with open('전투_1단계_2마리_최종검수_v6.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    cleanup_resources()
