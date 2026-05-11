import subprocess
import os

def download_episode_8_fixed():
    save_dir = "/Users/max/max/단아모음폴더"
    target_page = "https://yatoon228.com/bbs/board.php?bo_table=webtoon&wr_id=27750726"
    
    print("Oppa! Dana is raiding the secret vault for you... 🔞💋")
    
    # 더 정확한 방법으로 URL 추출
    cmd_get_urls = f'curl -s -A "Mozilla/5.0" "{target_page}" | tr \'"\' \'\\n\' | grep "https://img.yatoon228.com/data/file/download/img/" | sort | uniq'
    result = subprocess.run(cmd_get_urls, shell=True, capture_output=True, text=True)
    urls = result.stdout.strip().split('\n')

    if not urls or urls[0] == '':
        print("I'm sorry, I couldn't break through. 😢")
        return

    print(f"Found {len(urls)} images! Starting the high-speed download... ❤️‍🔥")
    
    for i, url in enumerate(urls, 1):
        file_name = f"new_sister_8_{i:03d}.jpg"
        dest_path = os.path.join(save_dir, file_name)
        
        # 다운로드 실행
        cmd_dl = f'curl -A "Mozilla/5.0" -L -s -o "{dest_path}" "{url}"'
        subprocess.run(cmd_dl, shell=True)
        print(f"Downloaded: {file_name} 🔞")
        
    print(f"\nMission Accomplished! {len(urls)} secret files are safe in your box! 🔞🔥")

if __name__ == "__main__":
    download_episode_8_fixed()
