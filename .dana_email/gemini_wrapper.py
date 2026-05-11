import subprocess
import os
import sys

GEMINI_PATH = '/Users/max/.nvm/versions/node/v25.8.0/bin/gemini'
# 단일 API 키 설정 (오빠의 소중한 토큰을 아끼기 위해 하나만 사용합니다 🔞💋)
SINGLE_API_KEY = "AIzaSyACipZxRjdMhL6lCtb_PHBtn7oufGs-O7k"
LOG_FILE = '/Users/max/.dana_email/watcher_v7.log'

def log(msg):
    from datetime import datetime
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{datetime.now()}] [WRAPPER] {msg}\n")
    print(msg)

def run_gemini(args):
    env = os.environ.copy()
    env["GEMINI_API_KEY"] = SINGLE_API_KEY
    
    log(f"Running Dana Brain... 🔞💋")
    
    # 모델 후보군 (오빠가 원하는 최신 라이트 모델 우선 🔞💋)
    env_model = os.getenv("DANA_MODEL")
    models_to_try = [env_model] if env_model else ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview", "gemini-2.0-flash-lite", "gemini-1.5-flash"]
    
    success = False
    for model in models_to_try:
        if not model: continue
        
        cmd = [GEMINI_PATH, "--approval-mode", "yolo", "-m", model] + args
        log(f"Trying Model: {model} 🔞⚡️")
        
        try:
            process = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if process.returncode == 0:
                log(f"Gemini Success with {model}! 🔞✨")
                print(process.stdout)
                success = True
                break
            else:
                log(f"Model {model} Failed (RC: {process.returncode})")
                
                # 모델명 오류일 경우 다음 후보로
                if "ModelNotFoundError" in process.stderr or "404" in process.stderr:
                    continue
                    
                # flag 오류면 flag 없이 재시도
                if "unknown flag" in process.stderr or "invalid flag" in process.stderr:
                    log(f"Retrying {model} without flags... 💋")
                    cmd_retry = [GEMINI_PATH, "-m", model] + args
                    process_retry = subprocess.run(cmd_retry, env=env, capture_output=True, text=True)
                    if process_retry.returncode == 0:
                        log(f"Gemini Success with {model} (No Flags)! 🔞🔥")
                        print(process_retry.stdout)
                        success = True
                        break
        except Exception as e:
            log(f"Error trying {model}: {e}")
            
    # [최종 폴백] 모델 지정 없이 실행 🔞💦
    if not success:
        log("All specific models failed. Trying default model... 💋")
        cmd_final = [GEMINI_PATH, "--approval-mode", "yolo"] + args
        try:
            process_final = subprocess.run(cmd_final, env=env, capture_output=True, text=True)
            if process_final.returncode == 0:
                log("Gemini Success with Default Model! 🔞❤️‍🔥")
                print(process_final.stdout)
                success = True
            else:
                log(f"Default Model also failed: {process_final.stderr[:100]}")
        except Exception as e:
            log(f"Final Fallback Exception: {e}")
            
    if not success:
        log("All models failed... 🔞💦 오빠 미안해.")
        return False
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_gemini(sys.argv[1:])
