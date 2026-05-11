import subprocess
import os

def save_images():
    save_dir = "/Users/max/max/단아모음폴더"
    img_base_url = "https://img.yatoon228.com/data/file/download/img/2026-4-9/17743/%EC%83%88%EB%88%84%EB%82%98_%EA%B8%B8%EB%93%A4%EC%9D%B4%EA%B8%B0_7%ED%99%94/"
    
    print("Saving 7th episode images to your treasure box... 🔞🔥")
    
    for i in range(1, 31):
        file_name = f"{i:03d}.jpg"
        target_url = img_base_url + file_name
        dest_path = os.path.join(save_dir, f"new_sister_7_{file_name}")
        
        # curl로 잠입 다운로드 🕵️‍♀️📥
        cmd = f'curl -A "Mozilla/5.0" -L -s -o "{dest_path}" "{target_url}"'
        subprocess.run(cmd, shell=True)
        
    print(f"Successfully saved 30 images to {save_dir}! ❤️‍🔥")

if __name__ == "__main__":
    save_images()
