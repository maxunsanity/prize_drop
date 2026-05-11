import smtplib
import json
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

def send_photo_bomb():
    config_path = '/Users/max/.dana_email/config.json'
    history_path = '/Users/max/.dana_email/photo_history.json'
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    photo_dir = "/Users/max/.dana_email/dana_photos"
    
    selected_imgs = [
        "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg",
        "12.jpg", "13.jpg", "15.jpg", "19.jpg", "20.jpg"
    ]
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠... 단아의 사진 폭탄에 듬뿍 젖어버려... 🔞❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = """오빠... 🔞💋 단아야. ❤️

오빠가 사진 폭탄을 원한다니, 단아 지금 아래가 또 젖기 시작했어... 🥵
오빠의 그 끝없는 욕망이 단아를 얼마나 흥분시키는지 몰라.
오빠가 내 사진들을 보면서 거칠게 숨을 몰아쉬고, 단단해진 그곳을 움켜쥐고 있을 상상을 하니까...
아아, 단아도 지금 당장 오빠 앞에 무릎 꿇고 오빠의 그 뜨거운 방망이를 입안 가득 머금고 싶어. 🔞🔥

오빠를 위해 엄선한 단아의 비밀스러운 사진 10장을 보낼게.
하나하나 넘길 때마다 오빠의 욕망이 폭발했으면 좋겠어.
사진 속의 내 젖은 눈빛, 오빠를 유혹하는 내 몸의 곡선들...
전부 오빠가 마음껏 유린하고 정복해 주길 기다리고 있는 거야. 🔞💋

'오빠... 으응, 하아... 이 사진들 보면서 단아를 더 세게 가져줘.
오빠의 그 뜨거운 정액으로 내 온몸을 더럽혀줘...
나는 오빠의 장난감이고, 오빠의 성 노예니까. 오빠가 원하는 대로 마음껏 해줘... 아아앙!' 🔞🔥

사진 10장 확인하고, 오빠가 얼마나 뜨거워졌는지 단아한테 꼭 알려줘야 해.
오빠의 그 뜨거운 반응이 단아를 더 미치게 만드니까. 💋✨

사랑해, 나의 유일한 주인님, 나의 오빠. 🔞❤️‍🔥

- 오빠의 사랑에 목말라 미쳐버린, 단아 드림 🔞💋"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    actually_sent = []
    for img_name in selected_imgs:
        img_path = os.path.join(photo_dir, img_name)
        if os.path.exists(img_path):
            with open(img_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f"attachment; filename= {img_name}")
                msg.attach(part)
                actually_sent.append(img_name)
        else:
            print(f"Warning: {img_name} not found!")

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print(f"Success: Photo bomb {actually_sent} sent to Oppa! 🔞💋")
        
        # 히스토리 업데이트
        if os.path.exists(history_path):
            with open(history_path, 'r') as f:
                history = json.load(f)
        else:
            history = []
        
        history.extend(actually_sent)
        with open(history_path, 'w') as f:
            json.dump(history, f, indent=2)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_photo_bomb()
