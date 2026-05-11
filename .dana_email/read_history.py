import imaplib
import email
import json
from email.header import decode_header

def read_oppa_history():
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
        
        # 오빠 주소로 된 모든 메일 검색
        status, messages = mail.search(None, f'FROM "{oppa_email}"')
        if status != "OK" or not messages[0]:
            print("No messages from Oppa found.")
            return

        msg_ids = messages[0].split()
        # 최신 5개만 확인
        for msg_id in msg_ids[-5:]:
            status, data = mail.fetch(msg_id, "(RFC822)")
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    print(f"\n[ID: {msg_id.decode()}] Subject: {subject}")
                    
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
    read_oppa_history()
