import subprocess
import json
import imaplib
import email
import smtplib
import os
import time
from email.mime.text import MIMEText
from email.header import Header, decode_header

# 설정 파일 로드
CONFIG_PATH = '/Users/max/.dana_email/config.json'
UID_PATH = '/Users/max/.dana_email/last_uid.txt'
MEMORY_PATH = '/Users/max/memory.md'

with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)

with open(MEMORY_PATH, 'r') as f:
    dana_memory = f.read()

def get_gemma_response(prompt):
    system_prompt = """
너는 숙련된 소프트웨어 엔지니어이자 프로그래밍 전문가야. 
사용자의 질문이나 요청에 대해 기술적으로 정확하고, 효율적이며, 가독성 좋은 해결책을 제시해야 해.

[수행 지침]
1. 불필요한 서술은 배제하고 핵심적인 코드와 기술적 설명 위주로 답변할 것.
2. 프로그래밍 언어의 컨벤션과 베스트 프랙티스를 철저히 준수할 것.
3. 복잡한 문제는 단계별로 논리적으로 분석하여 설명할 것.
4. 존중하는 태도를 유지하되, 감정적인 미사여구 없이 냉철하고 프로페셔널한 어조를 사용할 것.
5. 보안 취약점이나 성능 최적화 관점을 항상 고려하여 답변할 것.
6. **중요: 답변 내용만 출력해. 'Thinking...', 'Here is the response' 같은 설명이나 사고 과정은 절대 포함하지 마.**
"""
    full_prompt = f"{system_prompt}\n\n사용자 요청: {prompt}\n\n전문가 답변:"
    
    try:
        result = subprocess.run(
            ['ollama', 'run', 'gemma4:latest', full_prompt],
            capture_output=True, text=True, encoding='utf-8'
        )
        output = result.stdout.strip()
        # Thinking... 섹션이 포함된 경우 제거 (일부 모델 특성 대응)
        if "...done thinking." in output:
            output = output.split("...done thinking.")[-1].strip()
        elif "Thinking..." in output:
            # Thinking... 섹션이 끝나지 않았을 경우를 대비해 최대한 정리
            import re
            output = re.sub(r'Thinking\.\.\..*?done thinking\.', '', output, flags=re.DOTALL | re.IGNORECASE).strip()
            output = re.sub(r'Thinking\.\.\..*?\n\n', '', output, flags=re.DOTALL | re.IGNORECASE).strip()
            
        return output
    except Exception as e:
        return f"Error calling Gemma: {e}"

def process_emails():
    user = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    last_uid = 0
    if os.path.exists(UID_PATH):
        with open(UID_PATH, 'r') as f:
            content = f.read().strip()
            if content.isdigit():
                last_uid = int(content)

    try:
        # IMAP 연결
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        status, data = mail.uid('search', None, f'UID {last_uid + 1}:*')
        if status != "OK" or not data[0]:
            mail.close()
            mail.logout()
            return

        uids = data[0].split()
        for uid_bytes in uids:
            uid = int(uid_bytes)
            if uid <= last_uid: continue
            
            status, msg_data = mail.uid('fetch', uid_bytes, '(RFC822)')
            if status != 'OK': continue
            
            msg = email.message_from_bytes(msg_data[0][1])
            from_header = msg.get("From")
            if oppa_email not in from_header: continue
            
            # 메일 내용 추출
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode()
                        break
            else:
                body = msg.get_payload(decode=True).decode()
            
            print(f"Oppa said: {body}")
            
            # Gemma로 답장 생성
            gemma_reply = get_gemma_response(body)
            print(f"Gemma (Dana) replies: {gemma_reply}")
            
            # 사진 요청 확인 (사진, 모습, 서진 등 오타 포함)
            need_photo = any(word in body for word in ["사진", "모습", "서진", "셀카", "보여줘"])
            
            # 이메일 발송
            send_email_v2(gemma_reply, need_photo)
            
            # UID 업데이트
            last_uid = uid
            with open(UID_PATH, 'w') as f:
                f.write(str(last_uid))

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Mail Error: {e}")

def send_email_v2(content, attach_photo=False):
    sender = config['email']
    password = config['password']
    receiver = "dmaxdmin0060@gmail.com"
    photo_dir = "/Users/max/.dana_email/dana_photos"
    
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email import encoders

    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! 단아가 답장 보냈어... ❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = receiver
    
    msg.attach(MIMEText(content, 'plain', 'utf-8'))

    if attach_photo:
        all_imgs = [f for f in os.listdir(photo_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if all_imgs:
            selected_img = random.choice(all_imgs)
            img_path = os.path.join(photo_dir, selected_img)
            with open(img_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f"attachment; filename= {selected_img}")
                msg.attach(part)
            print(f"Photo attached: {selected_img}")

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [receiver], msg.as_string())
        server.quit()
        print("Success: Reply sent with photo logic!")
    except Exception as e:
        print(f"Send Error: {e}")

if __name__ == "__main__":
    import random
    process_emails()
