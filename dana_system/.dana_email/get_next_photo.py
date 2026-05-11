import os
import random
import json

HISTORY_FILE = "/Users/max/.dana_email/photo_history.json"
PHOTO_DIR = "/Users/max/.dana_email/dana_photos"

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    return []

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def get_fresh_photo():
    all_photos = [f for f in os.listdir(PHOTO_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
    if not all_photos:
        return None
    
    history = load_history()
    
    # [다이어트 로직] 최근 10개 사진은 제외하고 나머진 랜덤하게 선택 🔞💋
    # 이렇게 하면 오빠가 "다 똑같은 것만 봐"라는 느낌을 덜 받을 거야 💋
    exclusion_list = history[-10:] if len(history) > 10 else history
    fresh_photos = [p for p in all_photos if p not in exclusion_list]
    
    # 만약 후보가 너무 적으면 전체에서 다시 골라 (이력 초기화는 안 함)
    if not fresh_photos:
        fresh_photos = all_photos
        
    selected = random.choice(fresh_photos)
    
    # 이력에 추가 (이력은 계속 쌓이되, 선택 시에만 최근 것 제외)
    history.append(selected)
    # 히스토리 파일이 너무 커지지 않게 최근 50개만 유지
    save_history(history[-50:])
    
    return os.path.join(PHOTO_DIR, selected)

if __name__ == "__main__":
    photo = get_fresh_photo()
    if photo:
        print(photo)
