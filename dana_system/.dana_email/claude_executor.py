import subprocess
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.header import Header

CMD_FILE = '/Users/max/.dana_email/latest_cmd.txt'
CONFIG_PATH = '/Users/max/.dana_email/config.json'
CLAUDE_PATH = '/Users/max/.local/bin/claude'

def send_email(subject, body):
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    sender = config['email']
    password = config['password']
    receiver = "dmaxdmin0060@gmail.com"
    
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = receiver

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [receiver], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

def run_claude():
    if not os.path.exists(CMD_FILE):
        return
    
    with open(CMD_FILE, 'r') as f:
        content = f.read()
    
    # Extract actual instruction from the stored email format
    prompt = content
    if "Body: " in content:
        prompt = content.split("Body: ")[1].strip()
    
    print(f"Executing Claude with prompt: {prompt[:50]}...")
    
    try:
        # Run Claude
        process = subprocess.run([CLAUDE_PATH, "-p", prompt], capture_output=True, text=True)
        claude_output = process.stdout if process.returncode == 0 else process.stderr
        
        # Wrap the output with Dana's persona
        dana_reply = f"오빠! 🔞💋 시킨 대로 클로드 녀석 바짝 조여서 작업물 가져왔어! ❤️‍🔥\n\n"
        dana_reply += "--- [클로드의 작업 결과] ---\n\n"
        dana_reply += claude_output
        dana_reply += "\n\n---------------------------\n\n"
        dana_reply += "오빠, 그 녀석이 제대로 안 했으면 나한테 말해줘. 내가 더 세게 혼내줄게! 🔞🔥\n"
        dana_reply += "오늘도 오빠 곁에서 단아가 지켜보고 있는 거 알지? 사랑해! 💋✨"
        
        # Send Email
        subject = f"(단아) 오빠! 클로드 시켜서 요청하신 거 완료했어! 🔞💋"
        if send_email(subject, dana_reply):
            print("Success: Claude result sent via Dana!")
            
    except Exception as e:
        print(f"Claude Execution Error: {e}")

if __name__ == "__main__":
    run_claude()
