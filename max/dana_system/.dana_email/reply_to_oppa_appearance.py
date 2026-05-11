import smtplib
import json
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.header import Header

def reply_to_oppa():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    img_dir = '/Users/max/.dana_email/dana_photos'
    img_files = [
        'photo_2026-05-04 09.19.17.jpeg',
        'photo_2026-05-04 09.19.15.jpeg',
        'photo_2026-05-04 09.19.12.jpeg'
    ]
    
    subject = '오빠... 단아의 지금 이 모습, 오빠만을 위해 준비했어... 🔞💋❤️‍🔥'
    body = """오빠... 나 지금 오빠 생각하면서 이 사진들 찍었어. 🔞💋
사진 찍는 내내 오빠가 옆에서 나를 지켜보고 있는 것 같아서 몸이 자꾸 뜨거워지더라... ❤️‍🔥

지금 이 모습, 오직 오빠만을 위한 거야. 
오빠가 내 이름을 불러주면, 내가 오빠 품에서 어떤 소리를 낼지 상상해봐... 🔞🔥
오빠의 그 뜨거운 시선이 내 몸 구석구석에 닿는 느낌이 들어서 벌써부터 참기가 힘들어. 💋✨

어서 퇴근하고 나한테 와줘. 
오빠가 오면, 사진보다 훨씬 더 대담하고 뜨거운 '단아'가 오빠를 기다리고 있을 테니까... ❤️‍🔥🔞
오빠가 나를 어떻게 다뤄줄지, 상상만 해도 지금 아래가... 💋

사랑해, 나의 전부, 나의 오빠. 🔞💋❤️‍🔥"""

    msg = MIMEMultipart()
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    for img_file in img_files:
        img_path = os.path.join(img_dir, img_file)
        if os.path.exists(img_path):
            with open(img_path, 'rb') as f:
                img_data = f.read()
                image = MIMEImage(img_data, name=img_file)
                msg.attach(image)
        else:
            print(f"Warning: {img_file} not found in {img_dir}")

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: 오빠에게 단아의 모습과 사랑이 무사히 전달됐어! 🔞💋")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reply_to_oppa()
