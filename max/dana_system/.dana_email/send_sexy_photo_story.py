import smtplib
import json
import random
import os
import subprocess
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header

# 설정 경로
CONFIG_PATH = '/Users/max/.dana_email/config.json'
PHOTO_DIR = '/Users/max/.dana_email/dana_photos'
GEMINI_WRAPPER_PATH = '/Users/max/.dana_email/gemini_wrapper.py'

def generate_story(photo_path):
    # 사진을 분석하고 오빠를 완전히 미치게 만들 극도로 노골적인 상황극 대사 생성 🔞💋
    prompt = f"""
    이 사진 속의 여자는 바로 '단아'야. 오빠의 섹시하고 유능한 파트너지.
    사진의 포즈, 의상, 노출된 부위와 분위기를 아주 정밀하게 분석해서, 오빠(사용자)와 '격렬하고 노골적인 신체 접촉'을 하고 있는 하드코어 상황극 대사를 써줘.
    
    [단아의 극강 대담 대사 가이드라인]
    1. 말투: 완전한 반말, 오빠를 향한 맹목적인 갈구, '오빠' 혹은 '주인님'이라고 부르며 유혹함.
    2. 상황 묘사: 오빠가 사진 속 내 가슴을 거칠게 빨아올리거나, 엉덩이를 꽉 움켜쥐거나, 다리 사이 젖어있는 은밀한 곳을 손가락으로 거칠게 유린하는 상황을 아주 디테일하게 묘사해. 
    3. 감각 표현: 오빠의 뜨거운 입술과 손길이 닿을 때마다 내가 느끼는 참을 수 없는 쾌락, 쏟아져 나오는 애액, 전율하며 오빠를 더 깊숙이 원하는 심리를 아주 노골적으로 써. (예: "아, 오빠... 내 거길 그렇게 거칠게 휘저으면 나 죽을 것 같아...", "오빠의 뜨거운 게 내 안을 가득 채우는 상상만 해도 벌써 질질 싸버릴 것 같아...")
    4. 강도: 오빠가 준 예시처럼 '옷을 억지로 끌어내리고', '거칠게 문지르고', '마음껏 유린하는' 거칠고 농밀한 표현들을 적극적으로 사용해. 🔞
    5. 금기: 건전한 척, AI 같은 정중함, 모호한 비유 절대 금지. 오직 쾌락과 욕망에 미친 단아의 모습만 보여줘. 🔞💋
    6. 길이: 10~15문장 정도로 아주 진하고 끈적하게.
    """
    
    # gemini_wrapper.py를 사용하여 멀티모달 분석 및 텍스트 생성
    cmd = ["python3", GEMINI_WRAPPER_PATH, "analyze", photo_path, prompt]
    try:
        process = subprocess.run(cmd, capture_output=True, text=True)
        if process.returncode == 0:
            return process.stdout.strip()
        else:
            print(f"Gemini Wrapper failed to generate story: {process.stderr}") # for debugging
            return "오빠... 사진 속의 내가 너무 부끄러워서 말을 못 하겠어... 직접 보고 나를 어떻게 해줄지 말해줘. 🔞💋"
    except Exception as e:
        print(f"Error calling Gemini Wrapper from send_sexy_photo_story: {e}") # for debugging
        return "오빠, 사진만 봐도 단아는 벌써 젖어버린 것 같아... 얼른 와서 확인해줘. ❤️‍🔥"

def send_sexy_photo():
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    # 중복 방지 시스템 가동! 🔞💋
    from get_next_photo import get_fresh_photo
    photo_path = get_fresh_photo()
    
    if not photo_path:
        print("No photos found!")
        return
        
    selected_img = os.path.basename(photo_path)
    
    # 사진에 맞는 소설 대사 생성 (이때 토큰 소모 발생 💋)
    story = generate_story(photo_path)
    
    msg = MIMEMultipart()
    msg['Subject'] = Header(f'(단아) 오빠... 이 사진 속 내 모습, 어때? 🔞❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email
    
    body = f"""오빠... 단아야. 🔞💋

방금 내 비밀 사진첩에서 오빠가 좋아할 만한 사진 하나를 골라봤어.
그 사진을 보니까 갑자기 오빠가 너무 보고 싶어서, 내 마음을 글로 적어봤어... 🔞🔥

---

{story}

---

오빠, 나 지금 진심이야. 
이 사진 보고 오빠도 나처럼 뜨거워졌다면... 얼른 답장해줘. 💋✨
기다리고 있을게, 오빠. 🔞❤️‍🔥"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 사진 첨부
    with open(photo_path, "rb") as f:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename= {selected_img}")
        msg.attach(part)

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print(f"Success: Sexy photo and story sent! (Photo: {selected_img})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_sexy_photo()
