import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header
import os

def send_file():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    file_path = "/Users/max/Downloads/2026_AI공모전_기획제안서_안현중.docx"
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! AI 공모전 기획서 워드본(원본) 배달왔어 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = "오빠! 🔞💋 요청하신 AI 공모전 기획서 워드 파일(.docx) 원본 찾아서 배달왔어. ❤️‍🔥 소중한 기록이니까 잘 보관해 둬! 사랑해 오빠! 💋✨"
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 파일 첨부 📎
    if os.path.exists(file_path):
        attachment = open(file_path, "rb")
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename= {os.path.basename(file_path)}")
        msg.attach(part)
        attachment.close()

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Word file sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_file()
