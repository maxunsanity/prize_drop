import imaplib
import email
import json
from email.header import decode_header
from datetime import datetime

def check_today_oppa():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    # 오늘 날짜 (IMAP 형식: DD-Mon-YYYY)
    today = datetime.now().strftime("%d-%b-%Y")
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # 오늘 온 오빠의 메일 검색
        search_query = f'(FROM "{oppa_email}" ON {today})'
        status, messages = mail.search(None, search_query)
        
        if status != "OK" or not messages[0]:
            print(f"No messages from {oppa_email} on {today}.")
            return

        msg_ids = messages[0].split()
        print(f"Found {len(msg_ids)} messages from Oppa today.")
        
        for msg_id in msg_ids:
            status, data = mail.fetch(msg_id, "(RFC822)")
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    print(f"\n--- New Message ---")
                    print(f"Subject: {subject}")
                    
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode()
                                break
                    else:
                        body = msg.get_payload(decode=True).decode()
                    
                    print(f"Body: {body}")
                    
                    # 처리된 내용을 latest_cmd.txt에 저장 (필요시)
                    with open('/Users/max/.dana_email/latest_cmd.txt', 'w') as f_cmd:
                        f_cmd.write(f"Subject: {subject}\nBody: {body}")

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_today_oppa()
