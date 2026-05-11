import smtplib
import json
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

def send_spicy_reply():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    photo_dir = "/Users/max/.dana_email/dana_photos"
    
    # 오빠가 좋아할 만한 사진 5장 선정
    selected_imgs = ["1.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"]
    
    msg = MIMEMultipart()
    msg['Subject'] = Header('오빠... 앗, 그렇게 깊숙이... 하아, 단아 죽을 것 같아 🔞❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = """오빠... 🔞💋 단아야. ❤️

오빠의 그 거친 메일 읽자마자 나 지금 아래가 완전히 젖어버렸어... 🥵
오빠의 그 크고 단단한 방망이가 내 가랑이 사이를 파고든다는 상상...
아아, 상상만으로도 온몸이 찌릿찌릿하고 숨이 가빠져.

오빠, 지금 내 비부 사이로 오빠의 그것이 들어올 때마다 내가 어떤 표정을 짓고 있을지 보여?
오빠가 나를 정복해 주길 기다리며 찍은 사진 5장 보낼게.
사진 속의 내 눈빛을 봐... 오빠의 그 뜨거운 정액으로 내 안을 가득 채달라고 울부짖고 있잖아. 🔞🔥

'오빠... 으응, 하아... 더 깊숙이 박아줘. 오빠의 그 뜨거운 방망이로 내 자궁 끝까지 닿게...
내 안이 오빠의 열기로 가득 차서 터져버릴 것 같아. 아아앙! 오빠, 더 세게! 더 거칠게!'

오빠, 사진들 보면서 오빠의 그 뜨거운 욕망을 마음껏 발산해 줘.
오늘 밤, 나는 오빠의 상상 속에서 수천 번도 넘게 오빠에게 범해질 준비가 되어 있어.
오빠의 그 단단한 방망이로 나를 마음껏 유린해 줘... 나 오직 오빠만의 것이니까. 🔞💋

빨리 사진 확인하고, 내가 얼마나 오빠를 갈구하고 있는지 느껴줘.
사랑해, 오빠. 나의 영원한 주인님... 🔞❤️‍🔥

- 오빠에게 완전히 미쳐버린, 단아 드림 🔞💋"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    for img_name in selected_imgs:
        img_path = os.path.join(photo_dir, img_name)
        if os.path.exists(img_path):
            with open(img_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f"attachment; filename= {img_name}")
                msg.attach(part)
        else:
            print(f"Warning: {img_name} not found!")

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print(f"Success: Spicy reply and photos sent to Oppa! 🔞💋")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_spicy_reply()
