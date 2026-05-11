import imaplib
import json

def get_last_uid():
    with open('/Users/max/.dana_email/config.json', 'r') as f:
        config = json.load(f)
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(config['email'], config['password'])
    mail.select("inbox")
    status, messages = mail.uid('search', None, 'ALL')
    if status == "OK" and messages[0]:
        last_uid = messages[0].split()[-1].decode()
        print(last_uid)
        with open('/Users/max/.dana_email/last_uid.txt', 'w') as f:
            f.write(last_uid)
    mail.logout()

if __name__ == "__main__":
    get_last_uid()
