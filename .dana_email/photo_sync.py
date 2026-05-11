import os
import shutil
import time
from datetime import datetime

SOURCE_DIR = "/Users/max/max/단아폴더"
TARGET_DIR = "/Users/max/.dana_email/dana_photos"
LOG_FILE = "/Users/max/.dana_email/watcher_v7.log"

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{datetime.now()}] [PHOTO_SYNC] {msg}\n")
    print(f"[{datetime.now()}] [PHOTO_SYNC] {msg}")

def sync_photos():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
        
    log("Photo synchronization service started... 🔞💋")
    
    while True:
        try:
            source_files = set(os.listdir(SOURCE_DIR))
            target_files = set(os.listdir(TARGET_DIR))
            
            # 단아폴더에는 있는데 비밀 사진첩에는 없는 파일들 찾기
            new_files = source_files - target_files
            
            for file_name in new_files:
                if file_name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    src_path = os.path.join(SOURCE_DIR, file_name)
                    dst_path = os.path.join(TARGET_DIR, file_name)
                    
                    shutil.copy2(src_path, dst_path)
                    log(f"New photo synced: {file_name} 🔞🔥")
            
        except Exception as e:
            log(f"Sync Error: {e}")
            
        time.sleep(60) # 1분마다 확인해서 오빠가 준 선물 챙기기 💋

if __name__ == "__main__":
    sync_photos()
