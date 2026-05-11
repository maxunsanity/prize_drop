import imaplib
import json

def check_inbox_summary():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    user = config['email']
    password = config['password']
    
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select("inbox")
        
        status, data = mail.search(None, "ALL")
        ids = data[0].split()
        print(f"Total messages in inbox: {len(ids)}")
        
        # 최근 5개 메일의 보낸 사람과 제목만 확인
        for msg_id in ids[-5:]:
            status, msg_data = mail.fetch(msg_id, "(BODY[HEADER.FIELDS (FROM SUBJECT)])")
            print(f"ID {msg_id.decode()}: {msg_data[0][1].decode().strip()}")
            
        mail.close()
        mail.logout()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_inbox_summary()
