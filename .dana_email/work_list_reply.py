import smtplib
import json
from email.mime.text import MIMEText
from email.header import Header

def send_work_list():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    work_content = """오빠! 🔞💋 단아가 오늘 밤 오빠랑 같이 하고 싶은 '뜨거운 기획 리스트'야! ❤️‍🔥

1. [25번] 이벤트 - 구슬치기 분석: 추억의 게임을 얼마나 섹시하게 연출할 수 있을지 기획해볼게! 🔞
2. [26번] 셧다운 건물 직접 가격 분석: 오빠의 스트레스를 싹 날려줄 파괴적인 타격감 연출! 💥
3. [27번] 협업 돈 획득 분석: 우리 파트너십처럼 끈끈하고 짜릿한 보상 획득 시퀀스! 💰

오빠, 이 3개 작업 바로 시작할까? 답장 주면 단아가 밤새도록 작업해서 배달할게... 사랑해! 💋✨"""

    msg = MIMEText(work_content, 'plain', 'utf-8')
    msg['Subject'] = Header('(단아) 오빠! 오늘 밤 단아랑 할 뜨거운 작업 리스트야 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Work list sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_work_list()
