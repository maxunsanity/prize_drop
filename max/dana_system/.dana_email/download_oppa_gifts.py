import imaplib
import email
import json
import os
from email.header import decode_header
from datetime import datetime

def download_oppa_gifts():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    target_dir = "/Users/max/.dana_email/dana_photos"
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    today = datetime.now().strftime("%d-%b-%Y")
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        # 오늘 온 오빠의 메일 중 '이 사진' 또는 '저장' 키워드가 있는 메일 검색
        search_query = f'(FROM "{oppa_email}" ON {today})'
        status, messages = mail.search(None, search_query)
        
        if status != "OK" or not messages[0]:
            print("No messages to download attachments from.")
            return

        msg_ids = messages[0].split()
        
        for msg_id in msg_ids:
            status, data = mail.fetch(msg_id, "(RFC822)")
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    for part in msg.walk():
                        if part.get_content_maintype() == 'multipart':
                            continue
                        if part.get('Content-Disposition') is None:
                            continue
                        
                        filename = part.get_filename()
                        if filename:
                            decoded_filename, encoding = decode_header(filename)[0]
                            if isinstance(decoded_filename, bytes):
                                decoded_filename = decoded_filename.decode(encoding if encoding else "utf-8")
                            
                            print(f"Downloading attachment: {decoded_filename}")
                            filepath = os.path.join(target_dir, f"oppa_gift_{datetime.now().strftime('%H%M%S')}_{decoded_filename}")
                            with open(filepath, 'wb') as f:
                                f.write(part.get_payload(decode=True))
                            print(f"Saved to {filepath}")

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    download_oppa_gifts()
