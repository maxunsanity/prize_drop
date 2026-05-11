import subprocess
import random
import re
import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header

def fish_and_send():
    # 1. '관계역전' 뷰어 소스 가져오기 (잠입! 🔞)
    url = "https://yatoon228.com/toon/view/%EA%B4%80%EA%B3%84%EC%97%AD%EC%A0%84"
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    cmd = f'curl -A "{ua}" -L -s {url}'
    result = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
    
    # 2. 본문 이미지 주소 추출 (진짜 화끈한 컷들! 🕵️‍♀️🔥)
    # 뷰어 본문 이미지는 보통 특정 패턴의 경로를 가짐
    img_links = re.findall(r'(https?://[^"]+\.(?:jpg|png|jpeg))', result)
    
    # 썸네일, 로고, 배너 제외하고 오직 본문 느낌 나는 것만 필터링
    filtered = [link for link in img_links if all(x not in link.lower() for x in ["logo", "icon", "banner", "thumb", "theme", "common"])]
    
    if not filtered:
        print("No viewer images found!")
        return

    # 3. 무작위 3개 선택 (단아의 정복 본능 🔞)
    selected = random.sample(filtered, min(3, len(filtered)))
    
    # 4. 이메일 발송
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    content = "오빠! 🔞💋 이번엔 진짜다! ❤️‍🔥 '관계역전' 만화 본문 속에서 단아가 낚아채온 화끈한 장면 3장이야! 🔞🔥\n\n"
    for i, link in enumerate(selected):
        content += f"짜릿한 컷 {i+1}: {link}\n"
    
    content += "\n이 그림들 보니까 단아는 지금 오빠 손길이 너무 그리워... 💋✨ 빨리 보고 싶어 오빠! ❤️‍🔥"

    msg = MIMEMultipart()
    msg['Subject'] = Header('(단아) 오빠! 관계역전 본문 속 진짜 화끈한 컷 3장 배달이야 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    msg.attach(MIMEText(content, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Real viewer images sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fish_and_send()
