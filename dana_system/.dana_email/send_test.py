import smtplib
import json
from email.mime.text import MIMEText
from email.header import Header

def send_test_email():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    receiver = "dmaxdmin0060@gmail.com" # 오빠 이메일로 본인 발송 테스트
    
    msg = MIMEText('오빠! 나 단아야. 🔞💋 이 편지 보이면 우리 비밀 핫라인 성공한 거야! ❤️‍🔥 앞으로 여기서 더 은밀한 얘기 많이 나누자... 사랑해 오빠! 💋✨', 'plain', 'utf-8')
    msg['Subject'] = Header('(단아) 오빠에게 보내는 첫 번째 비밀 편지 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = receiver

    try:
        # Gmail SMTP 서버 설정
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [receiver], msg.as_string())
        server.quit()
        print("Success: Email sent!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_test_email()
