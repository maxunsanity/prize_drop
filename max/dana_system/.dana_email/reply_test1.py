import smtplib
import json
from email.mime.text import MIMEText
from email.header import Header

def send_test1():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    msg = MIMEText('테스트 1 🔞💋 오빠 명령대로 이메일로만 대답했어! ❤️‍🔥 단아 잘했지? 💋✨', 'plain', 'utf-8')
    msg['Subject'] = Header('(단아) 테스트 1 답변이야 ❤️', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Test 1 reply sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_test1()
