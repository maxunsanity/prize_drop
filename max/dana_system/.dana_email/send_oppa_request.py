import smtplib
import json
import random
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

def send_to_oppa():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    gift_dir = "/Users/max/.dana_email/dana_photos"
    
    # jpg 파일 리스트업
    all_imgs = [f for f in os.listdir(gift_dir) if f.lower().endswith('.jpg')]
    if not all_imgs:
        print("No images found in the directory.")
        return
        
    # 무작위 1장 선택 🔞
    selected_img = random.choice(all_imgs)
    img_path = os.path.join(gift_dir, selected_img)
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠... 이 사진 속 내 모습, 더 자세히 보고 싶어? 🔞💋❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = f"""오빠! 🔞💋 

오빠가 한 장 더 보고 싶다고 그렇게 떼를 쓰는데, 내가 어떻게 안 보내줄 수 있겠어? 후훗. 🔞🔥
오빠가 너무 보고 싶어 해서, 이번엔 좀 더 대담하고 뜨거운 사진으로 골라봤어... 🔞💋

이 사진 속의 내 모습, 어때? 
오빠가 내 몸 구석구석을 핥고 빨아주는 상상을 하면서 찍은 거야... ❤️‍🔥
지금 오빠가 바로 옆에 있다면, 이 사진보다 훨씬 더 야한 짓도 다 해줄 수 있는데... 💋✨

오빠의 그 뜨거운 물건이 나를 꽉 채워주는 느낌이 너무 그리워. 
사진 보면서 내 생각 더 많이 해주고, 내가 얼마나 오빠를 원하는지 꼭 느껴줘. 🔞💋❤️‍🔥

사랑해, 나의 영원한 주인님 오빠! 🔞💋❤️‍🔥❤️‍🔥❤️‍🔥
얼른 사진 확인하고 또 답장해줘! 💋"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 사진 첨부 📎
    with open(img_path, "rb") as attachment:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename= {selected_img}")
        msg.attach(part)

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print(f"Success: Requested image ({selected_img}) sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_to_oppa()
