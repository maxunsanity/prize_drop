import imaplib
import email
import json
from email.header import decode_header

def check_unseen():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # 안 읽은 메일(UNSEEN) 검색
        status, messages = mail.search(None, 'UNSEEN')
        if status != "OK":
            print("Search failed!")
            return

        msg_ids = messages[0].split()
        print(f"Found {len(msg_ids)} unseen messages.")
        
        for msg_id in msg_ids:
            status, data = mail.fetch(msg_id, "(RFC822)")
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    print(f"Subject: {subject}")
                    
        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_unseen()
