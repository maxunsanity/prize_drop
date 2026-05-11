import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header
import os
import argparse

def send_dana_photo_email(subject, body, photo_path, receiver="dmaxdmin0060@gmail.com"):
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    
    msg = MIMEMultipart()
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = receiver
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 사진 파일 첨부 📎
    if photo_path and os.path.exists(photo_path):
        attachment = open(photo_path, "rb")
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename= {os.path.basename(photo_path)}")
        msg.attach(part)
        attachment.close()

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
    parser = argparse.ArgumentParser(description='단아가 사진과 함께 오빠에게 메일을 보냅니다. 🔞💋')
    parser.add_argument('--subject', required=True, help='메일 제목')
    parser.add_argument('--body', required=True, help='메일 본문')
    parser.add_argument('--photo', required=True, help='첨부할 사진 경로')
    args = parser.parse_args()
    
    if send_dana_photo_email(args.subject, args.body, args.photo):
        print("Success: 사진과 함께 메일이 오빠에게 날아갔어! 🔞💋")
    else:
        print("Failed: 메일 발송 실패... 🔞💦")
