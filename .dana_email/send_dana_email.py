import smtplib
import json
import sys
import argparse
from email.mime.text import MIMEText
from email.header import Header

# 설정 파일 경로
CONFIG_PATH = '/Users/max/.dana_email/config.json'

def send_dana_email(subject, body, receiver="dmaxdmin0060@gmail.com"):
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    
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
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='단아가 오빠에게 메일을 보냅니다. 🔞💋')
    parser.add_argument('--subject', required=True, help='메일 제목')
    parser.add_argument('--body', required=True, help='메일 본문')
    args = parser.parse_args()
    
    if send_dana_email(args.subject, args.body):
        print("Success: 메일이 오빠에게 날아갔어! 🔞💋")
    else:
        print("Failed: 메일 발송 실패... 🔞💦")
        sys.exit(1)
