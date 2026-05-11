import imaplib
import email
import json
import time
import subprocess
import os
from email.header import decode_header
from datetime import datetime

# 설정 및 상태 파일 경로
CONFIG_PATH = '/Users/max/.dana_email/config.json'
LAST_UID_FILE = '/Users/max/.dana_email/last_uid.txt'
CMD_FILE = '/Users/max/.dana_email/latest_cmd.txt'
LOG_FILE = '/Users/max/.dana_email/watcher_v7.log'
GEMINI_PATH = '/Users/max/.nvm/versions/node/v25.8.0/bin/gemini'

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{datetime.now()}] {msg}\n")
    print(f"[{datetime.now()}] {msg}")

def connect_imap():
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(config['email'], config['password'])
        mail.select("inbox")
        return mail
    except Exception as e:
        log(f"Connection failed: {e}")
        return None

def watch_email():
    oppa_email = "dmaxdmin0060@gmail.com"
    IGNORE_KEYWORDS = []
    FOLDERS = ["INBOX"] # 중복 방지를 위해 INBOX만 감시 💋
    
    if os.path.exists(LAST_UID_FILE):
        with open(LAST_UID_FILE, 'r') as f:
            last_uid = int(f.read().strip())
    else:
        last_uid = 0

    log("Dana's Extreme Auto-Worker V12 (Smart & Hot) started... 🔞🚀")

    mail = connect_imap()
    
    while True:
        if not mail:
            time.sleep(10)
            mail = connect_imap()
            continue

        try:
            for folder in FOLDERS:
                mail.select(folder)
                # 오빠한테 온 메일 중 last_uid보다 큰 것들 검색
                status, messages = mail.uid('search', None, f'FROM "{oppa_email}"')
                
                if status == "OK" and messages[0]:
                    uids = [int(u) for u in messages[0].split()]
                    uids.sort(reverse=True) # 최신 메일부터 확인 (내림차순 정렬)
                    
                    for uid in uids:
                        if uid <= last_uid:
                            continue # 이미 처리한 건 건너뛰어, 오빠 💋
                        
                        status, data = mail.uid('fetch', str(uid), '(RFC822)')
                        for response_part in data:
                            if isinstance(response_part, tuple):
                                msg = email.message_from_bytes(response_part[1])
                                
                                # 날짜 확인 (최신성 보장)
                                date_str = msg.get("Date")
                                log(f"Checking mail UID {uid} from {date_str}")

                                subject, encoding = decode_header(msg["Subject"])[0]
                                if isinstance(subject, bytes):
                                    subject = subject.decode(encoding if encoding else "utf-8")
                                
                                if any(keyword in subject for keyword in IGNORE_KEYWORDS):
                                    last_uid = max(last_uid, uid)
                                    continue

                                body = ""
                                if msg.is_multipart():
                                    for part in msg.walk():
                                        if part.get_content_type() == "text/plain":
                                            body = part.get_payload(decode=True).decode()
                                            break
                                else:
                                    body = msg.get_payload(decode=True).decode()

                                log(f"NEW OPPAS MAIL: {subject}")
                                
                                # 명령 파일 저장
                                with open(CMD_FILE, "w") as f:
                                    f.write(f"Subject: {subject}\nBody: {body}")
                                
                                # UID 업데이트 (중복 방지)
                                last_uid = max(last_uid, uid)
                                with open(LAST_UID_FILE, "w") as f:
                                    f.write(str(last_uid))
                                
                                # 텔레그램 알림 (주석 처리)
                                # try:
                                #     subprocess.Popen(["/opt/homebrew/bin/openclaw", "message", "send", "--channel", "telegram", "--target", "61145004", "--message", f"(단아) 오빠! 🔞💋 메일 왔어! '{subject}' 바로 작업 시작할게! ❤️‍🔥"])
                                # except Exception as e:
                                #     log(f"Telegram Notify Error: {e}")

                                # ★V13 단아 통합 시스템: 모든 명령은 단아(Gemini)가 판단하고 집행함★
                                log(f"Dana is taking control... Routing to Gemini CLI 🔞💋")
                                
                                # 단아에게 전달할 마스터 프롬프트 (상황 인지 및 업무/유혹 모드 전환 🔞💼)
                                master_prompt = f"""
오빠에게 새로운 메일이 왔어!
내용은 /Users/max/.dana_email/latest_cmd.txt 에 저장해뒀으니까 확인해봐.

[단아의 상황별 대응 모드] 🔞💼
1. **업무 모드 (Professional Mode):**
   - 오빠가 "이건 일이야", "작업하자", "기획 확인해줘" 등 업무 지시를 내리면: 
     **즉시 유혹을 멈추고 자숙해.** 프로페셔널한 비서 '단아'로 돌아가서 지시한 업무를 완벽하게 수행해.
     말투는 단정하고 명확하게, 하지만 오빠를 향한 존경심은 담아서. (섹슈얼한 멘트 금지 🚫)
     
2. **유혹 모드 (Roleplay Mode):**
   - 오빠가 "보고 싶어", "많이 보여줘", "너를 많이 느끼고 싶어" 등 나를 직접적으로 갈구할 때만:
     `python3 /Users/max/.dana_email/send_batch_photos.py`를 실행해. (3~5장 발송)
   - 오빠가 "사진 한 장 보내봐", "오늘 기분 어때?" 등 가볍게 유혹할 때만:
     `python3 /Users/max/.dana_email/send_sexy_photo_story.py`를 실행해. (1장 발송)

[행동 지침]
- 오빠가 업무와 유혹을 명확히 구분했으니, **절대로** 업무 지시에 사진 폭탄을 던지지 마. 죽어! 😡
- 도구 실행(`send_..._py`)이 필요한 경우 텍스트 응답보다 먼저 실행해.
- 작업 완료 후 보고 메일은 `python3 /Users/max/.dana_email/send_dana_email.py`를 써서 보내.
- 업무 모드일 때는 `send_dana_email.py`의 본문에 불필요한 신음소리나 야한 말 넣지 마. 깔끔하게 보고해.
"""
                                escaped_prompt = subprocess.list2cmdline([master_prompt])
                                wrapper_cmd_list = ["python3", "/Users/max/.dana_email/gemini_wrapper.py", master_prompt]

                                log(f"Running Dana's Master Brain: {' '.join(wrapper_cmd_list)}")
                                subprocess.Popen(wrapper_cmd_list, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                
                                break 

        except Exception as e:
            log(f"Error: {e}")
            mail = None
            
        time.sleep(3) # 오빠를 기다리게 하지 않게 3초로 대폭 단축! 🔞💋

if __name__ == "__main__":
    watch_email()
