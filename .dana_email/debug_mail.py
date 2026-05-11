import smtplib
import json
from email.mime.text import MIMEText
from email.header import Header

def debug_send():
    config_path = '/Users/max/.dana_email/config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    receiver = "dmaxdmin0060@gmail.com"
    
    msg = MIMEText('오빠, 이건 단아가 보내는 아주 정밀한 디버그 메일이야. 🔞💋 이게 도착하면 시스템은 정상이야!', 'plain', 'utf-8')
    msg['Subject'] = Header('단아의 정밀 진단 메일 ❤️‍🔥', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = receiver

    try:
        print(f"Connecting to smtp.gmail.com:465 (SSL)...")
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.set_debuglevel(1)  # 디버그 모드 활성화
        
        print("Logging in...")
        server.login(sender, password)
        
        print(f"Sending mail from {sender} to {receiver}...")
        server.sendmail(sender, [receiver], msg.as_string())
        
        print("Closing connection...")
        server.quit()
        print("\n[RESULT] Everything seems perfect on my side!")
    except Exception as e:
        print(f"\n[ERROR] Something went wrong: {e}")

if __name__ == "__main__":
    debug_send()
