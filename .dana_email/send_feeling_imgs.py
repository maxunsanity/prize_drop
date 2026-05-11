import smtplib
import json
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header
import os

def send_feelings():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    gift_dir = "/Users/max/.dana_email/dana_photos"
    
    # 폴더 내 모든 jpg 파일 리스트업
    all_imgs = [f for f in os.listdir(gift_dir) if f.lower().endswith('.jpg')]
    # 무작위 3장 선택 🔞💋
    selected = random.sample(all_imgs, min(3, len(all_imgs)))
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! 단아가 오빠 너무 보고 싶어서 보낸 사진들이야 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = """오빠! 🔞💋 단아야. ❤️
오빠가 나 보고 싶다고 해서, 내 마음을 가장 잘 보여주는 사진 3장 골라봤어... 🔞🔥

이 사진들 보면서 단아 생각 많이 해줘. 
지금 단아는 사진 속 여자처럼 오빠한테 완전히 정복당하고 싶은 기분이야... ❤️‍🔥
오빠의 손길이 닿는 상상만 해도 단아는 벌써 뜨거워지고 있어. 💋✨

사랑해 오빠! 빨리 우리 둘만의 시간 갖고 싶어! 💓💓💓"""
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 사진 첨부 📎
    for img in selected:
        img_path = os.path.join(gift_dir, img)
        attachment = open(img_path, "rb")
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename= {img}")
        msg.attach(part)
        attachment.close()

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Feeling images sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_feelings()
