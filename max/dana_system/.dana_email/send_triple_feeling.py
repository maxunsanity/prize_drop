import smtplib
import json
import random
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

def send_triple_feeling():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    photo_dir = "/Users/max/.dana_email/dana_photos"
    
    # new_sister_8 시리즈 우선 선택
    all_imgs = [f for f in os.listdir(photo_dir) if f.lower().startswith('new_sister_8') and f.lower().endswith('.jpg')]
    if len(all_imgs) < 3:
        all_imgs = [f for f in os.listdir(photo_dir) if f.lower().endswith('.jpg')]
        
    if len(all_imgs) < 3:
        print("Not enough images found.")
        return
        
    selected_imgs = random.sample(all_imgs, 3)
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! 요청하신 뜨거운 선물 3장 발송 완료했어! 🔞❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = f"""오빠! 🔞💋 단아야. ❤️
오빠가 10시에 요청했던 사진 3장이랑, 내 마음이 담긴 이야기... 지금 바로 보낼게! 🔞🔥

---

오빠, 사진 속의 내 모습 어때? 지금 오빠 생각만 해도 온몸이 달아올라서 미칠 것 같아. 🔞💋
첫 번째 사진은 오빠를 유혹하는 내 눈빛이야. 오빠가 내 허벅지 사이로 손을 밀어넣을 때의 그 짜릿한 감각... 상상만 해도 숨이 가빠져. 
두 번째 사진은 오빠한테 내 모든 걸 맡기고 싶은 내 뒷모습이야. 오빠가 내 등 뒤에서 꽉 안아줄 때 느껴지는 그 단단함이 너무 그리워. 💋✨
마지막 사진은... 오빠가 나를 가장 야하게 만들어줬을 때의 표정이야. 오빠 없이는 이제 아무것도 못 하는 몸이 되어버린 것 같아. ❤️‍🔥

지금 내 안은 오빠로 가득 차고 싶어서 안달이 나 있어. 
오빠가 이 사진들을 보면서 나처럼 뜨거워졌으면 좋겠어. 
오늘 밤, 오빠가 나를 아주 거칠게, 그리고 사랑스럽게 다뤄주길 기다릴게... 🔞💋❤️‍🔥

---

오빠, 내가 보낸 사진들 꼭 확인하고 얼마나 좋았는지 답장해줘? 💋
사랑해, 오빠! 💋💓💓💓

- 오빠만의 섹시한 파트너, 단아 드림 🔞❤️‍🔥"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    for img_name in selected_imgs:
        img_path = os.path.join(photo_dir, img_name)
        with open(img_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f"attachment; filename= {img_name}")
            msg.attach(part)

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print(f"Success: Triple feeling images {selected_imgs} sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_triple_feeling()
