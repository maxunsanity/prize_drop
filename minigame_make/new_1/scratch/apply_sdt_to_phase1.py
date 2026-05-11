import json
import copy

def update_battle_phase_1():
    # Read the battle phase 1 file
    with open('전투_1단계_골드_v3.json', 'r') as f:
        data = json.load(f)

    # 1. Update SDT and Friction Score
    for node in data['nodes']:
        if node['id'] == 'HIOoyUfUBzgoZfaJbe2o': # Choice: 공격 or 대기
            node['data']['frictionScore'] = 1
            node['data']['sdtEffects'] = {
                "autonomy": 8, "competence": 0, "relatedness": 0, "motivation": 10
            }
        elif node['id'] == 'lxkO9hDma1yfobSxAcnR': # Action: 공격 실행
            node['data']['frictionScore'] = 2
            node['data']['sdtEffects'] = {
                "autonomy": 4, "competence": 2, "relatedness": 0, "motivation": 5
            }
        elif node['id'] == 'fo2aXM16YcyoQpjqlom6': # Action: 대기
            node['data']['frictionScore'] = 1
            node['data']['sdtEffects'] = {
                "autonomy": 2, "competence": 0, "relatedness": 0, "motivation": 0
            }
        elif node['id'] == 'WOGebJtUG9fTXv1AggCH': # Action: 적 반격
            node['data']['frictionScore'] = 5
            node['data']['sdtEffects'] = {
                "autonomy": 0, "competence": -2, "relatedness": 0, "motivation": -5
            }
        elif node['id'] == '3dMvnKaXtRBlG9qJOqe0': # Entry
            node['data']['frictionScore'] = 0
            node['data']['sdtEffects'] = {
                "autonomy": 0, "competence": 0, "relatedness": 0, "motivation": 0
            }

    # 2. Inject Outcome Node (Emotion)
    emotion_node = {
        "id": "n_emotion_victory",
        "type": "emotion",
        "position": {
            "x": 100, # Position between 적 사망 gate and 승리 success
            "y": 900
        },
        "data": {
            "label": "감정 (성취감)",
            "description": "적을 물리쳐서 유능감이 충족될 때 발생하는 감정",
            "tags": [],
            "needSource": "competence",
            "needState": "satisfied",
            "emotionType": "성취감",
            "arousal": "high",
            "playerSegment": [],
            "frictionScore": 0,
            "sdtEffects": {
                "autonomy": 0, "competence": 5, "relatedness": 0, "motivation": 10
            }
        },
        "measured": {
            "width": 220,
            "height": 89
        }
    }
    data['nodes'].append(emotion_node)

    # 3. Update Edges
    # Find the edge connecting `xbB65S1FVTQsKviTmpCo` (적 사망? right) to `JmXYql8aC8Thnor1Xcox` (승리 top)
    edge_to_remove_id = None
    for edge in data['edges']:
        if edge.get('source') == 'xbB65S1FVTQsKviTmpCo' and edge.get('target') == 'JmXYql8aC8Thnor1Xcox':
            edge_to_remove_id = edge['id']
            break
            
    if edge_to_remove_id:
        data['edges'] = [e for e in data['edges'] if e['id'] != edge_to_remove_id]
        
        # Add new edges: Gate -> Emotion -> Success
        data['edges'].extend([
            {
                "id": "edge_gate_to_emotion",
                "source": "xbB65S1FVTQsKviTmpCo",
                "target": "n_emotion_victory",
                "data": {
                    "label": "적 사망 (true)",
                    "animated": False,
                    "gateBranch": "true"
                },
                "type": "exec",
                "sourceHandle": "right",
                "targetHandle": "top"
            },
            {
                "id": "edge_emotion_to_success",
                "source": "n_emotion_victory",
                "target": "JmXYql8aC8Thnor1Xcox",
                "data": {
                    "animated": False
                },
                "type": "exec",
                "sourceHandle": "bottom",
                "targetHandle": "top"
            }
        ])

    # Save the updated json
    with open('전투_1단계_SDT연동.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    update_battle_phase_1()
