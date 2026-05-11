import json

with open('전투_2단계.json', 'r') as f:
    data = json.load(f)

print(json.dumps(data.get('resources', []), indent=2, ensure_ascii=False))
