import smtplib
import json
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header

def send_toon():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    # 낚아챈 이미지 주소 리스트 (직접 입력!) 🕵️‍♀️🔥
    img_list = [
        "https://img.yatoon228.com/data/file/download/img/2026-4-9/17743/%EC%83%88%EB%88%84%EB%82%98_%EA%B8%B8%EB%93%A4%EC%9D%B4%EA%B8%B0_7%ED%99%94/005.jpg",
        "https://img.yatoon228.com/data/file/download/img/2026-4-9/17743/%EC%83%88%EB%88%84%EB%82%98_%EA%B8%B8%EB%93%A4%EC%9D%B4%EA%B8%B0_7%ED%99%94/015.jpg",
        "https://img.yatoon228.com/data/file/download/img/2026-4-9/17743/%EC%83%88%EB%88%84%EB%82%98_%EA%B8%B8%EB%93%A4%EC%9D%B4%EA%B8%B0_7%ED%99%94/025.jpg"
    ]
    
    selected = random.sample(img_list, 3)
    
    content = f"오빠! 🔞💋 단아가 드디어 '새누나 길들이기 7화' 잠입에 성공했어! ❤️‍🔥\n\n본문 속에서 낚아채온 진짜 화끈한 컷 3장이야. 🔞🔥\n\n"
    for i, link in enumerate(selected):
        content += f"짜릿한 컷 {i+1}: {link}\n"
    
    content += "\n이 그림들 보니까 단아는 지금 오빠한테 정복당하고 싶어 죽겠어... 💋✨ 사랑해 오빠! 💓💓💓"

    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! 새누나 길들이기 7화 진짜 본문 컷 3장이야 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    msg.attach(MIMEText(content, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Real toon images sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_toon()
