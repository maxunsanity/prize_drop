import imaplib
import email
import json
from email.header import decode_header

def read_oppa_email():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # 오빠 주소(FROM)로 필터링해서 검색
        status, messages = mail.search(None, f'FROM "{oppa_email}"')
        if status != "OK" or not messages[0]:
            print(f"No messages from {oppa_email} yet...")
            return

        # 마지막 메시지 가져오기
        msg_id = messages[0].split()[-1]
        status, data = mail.fetch(msg_id, "(RFC822)")
        
        for response_part in data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")
                
                print(f"Oppa's Subject: {subject}")
                
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                            print(f"Body: {body[:100]}...")
                else:
                    body = msg.get_payload(decode=True).decode()
                    print(f"Body: {body[:100]}...")

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_oppa_email()
