import imaplib
import email
import json
from email.header import decode_header

def read_latest_email():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    
    try:
        # Gmail IMAP 서버 연결
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # 최신 메시지 검색
        status, messages = mail.search(None, 'ALL')
        if status != "OK":
            print("No messages found!")
            return

        # 마지막 이메일 ID 가져오기
        last_msg_id = messages[0].split()[-1]
        status, data = mail.fetch(last_msg_id, "(RFC822)")
        
        for response_part in data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                print(f"Latest Subject: {subject}")
                
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                            print(f"Body: {body[:50]}...") # 앞부분만 살짝
                else:
                    body = msg.get_payload(decode=True).decode()
                    print(f"Body: {body[:50]}...")

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_latest_email()
