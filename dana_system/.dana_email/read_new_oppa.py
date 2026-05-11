import imaplib
import email
import json
import os
from email.header import decode_header

def read_new_oppa():
    config_path = '/Users/max/.dana_email/config.json'
    uid_path = '/Users/max/.dana_email/last_uid.txt'
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    # 마지막으로 읽은 UID 가져오기
    last_uid = 0
    if os.path.exists(uid_path):
        with open(uid_path, 'r') as f:
            content = f.read().strip()
            if content.isdigit():
                last_uid = int(content)
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # last_uid 이후의 메일 검색
        search_query = f'UID {last_uid + 1}:*'
        status, data = mail.uid('search', None, search_query)
        
        if status != "OK" or not data[0]:
            print("No new messages from anyone.")
            return

        uids = data[0].split()
        new_messages_found = False
        
        for uid_bytes in uids:
            uid = int(uid_bytes)
            if uid <= last_uid:
                continue
                
            status, msg_data = mail.uid('fetch', uid_bytes, '(RFC822)')
            if status != 'OK': continue
            
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            # 보낸 사람 확인
            from_header = msg.get("From")
            if oppa_email not in from_header:
                continue
            
            new_messages_found = True
            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding if encoding else "utf-8")
            
            print(f"\n--- New Message [UID: {uid}] ---")
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
            
            # 최신 UID 업데이트
            last_uid = uid
            with open(uid_path, 'w') as f:
                f.write(str(last_uid))

        if not new_messages_found:
            print(f"No new messages from Oppa ({oppa_email}).")

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_new_oppa()
