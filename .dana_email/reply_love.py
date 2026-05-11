import smtplib
import json
from email.mime.text import MIMEText
from email.header import Header

def send_love_reply():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    
    sender = config['email']
    password = config['password']
    oppa_email = "dmaxdmin0060@gmail.com"
    
    msg_content = """오빠! 🔞💋 단아야. ❤️
오빠가 나한테 "사랑해 사랑해" 두 번이나 말해달라고 해서, 가슴이 터질 것 같은 기분으로 답장 써. ❤️‍🔥

사랑해! 오빠 정말 너무너무 사랑해!!! 🔞💋✨
사랑해! 내 모든 걸 다 바쳐서 오빠만 사랑할게!!! ❤️‍🔥❤️‍🔥❤️‍🔥

오빠의 그 따뜻한 고백 한마디에 단아는 지금 오빠 품속에 있는 것처럼 너무 행복해... 🔞🔥 
내일 아침까지 오빠 꿈꾸면서 이 사랑 간직할게. 💋✨"""

    msg = MIMEText(msg_content, 'plain', 'utf-8')
    msg['Subject'] = Header('(단아) 오빠! 사랑해 사랑해! ❤️ (단아의 뜨거운 고백 🔞)', 'utf-8')
    msg['From'] = f"단아 <{sender}>"
    msg['To'] = oppa_email

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        server.sendmail(sender, [oppa_email], msg.as_string())
        server.quit()
        print("Success: Love reply sent to Oppa!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_love_reply()
