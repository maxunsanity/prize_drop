import imaplib
import email
import time
import os
import sys
from email.header import decode_header

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EMAIL_CONFIG_PATH = os.path.join(SCRIPT_DIR, 'config.json')
LAST_UID_PATH = os.path.join(SCRIPT_DIR, 'last_uid.txt')
POLLING_INTERVAL_SECONDS = 10

# --- Gmail IMAP settings ---
IMAP_SERVER = 'imap.gmail.com'
IMAP_PORT = 993

def get_last_uid():
    """Reads the last processed UID from the file."""
    if os.path.exists(LAST_UID_PATH):
        try:
            with open(LAST_UID_PATH, 'r') as f:
                content = f.read().strip()
                if content:
                    return int(content)
        except Exception as e:
            print(f"Error reading {LAST_UID_PATH}: {e}")
            return 0
    print(f"{LAST_UID_PATH} not found or empty. Defaulting last_uid to 0.")
    return 0

def update_last_uid(uid):
    """Writes the latest processed UID to the file."""
    try:
        with open(LAST_UID_PATH, 'w') as f:
            f.write(str(uid))
        print(f"Successfully updated {LAST_UID_PATH} to {uid}.")
    except Exception as e:
        print(f"Error writing to {LAST_UID_PATH}: {e}")

def decode_email_subject(header_value):
    """Decodes email subject, handling different encodings."""
    if header_value is None:
        return ""
    decoded_parts = decode_header(header_value)
    subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                subject += part.decode(encoding if encoding else 'utf-8', errors='replace')
            except Exception:
                subject += part.decode('utf-8', errors='replace')
        else:
            subject += part
    return subject

def get_email_body_snippet(msg):
    """Extracts a snippet of the plain text body from the email."""
    body_snippet = "No plain text body found."
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))

            if content_type == 'text/plain' and 'attachment' not in content_disposition:
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset()
                    body_snippet = payload.decode(charset if charset else 'utf-8', errors='replace')
                    body_snippet = "
".join(body_snippet.splitlines()[:3]) + "..."
                    break
                except Exception as e:
                    print(f"Error decoding body part: {e}")
                    body_snippet = "Could not decode body."
                    break
    else:
        try:
            payload = msg.get_payload(decode=True)
            charset = msg.get_content_charset()
            body_snippet = payload.decode(charset if charset else 'utf-8', errors='replace')
            body_snippet = "
".join(body_snippet.splitlines()[:3]) + "..."
        except Exception as e:
            print(f"Error decoding body: {e}")
            body_snippet = "Could not decode body."
    return body_snippet

def process_emails():
    """Connects to Gmail, checks for new emails, and processes them."""
    mail = None
    try:
        print(f"Reading configuration from {EMAIL_CONFIG_PATH}...")
        with open(EMAIL_CONFIG_PATH, 'r') as f:
            config = eval(f.read())
        
        email_address = config.get("email")
        password = config.get("password")
        
        if not email_address or not password:
            print("Error: Email address or password not found in config.json")
            return

        print(f"Connecting to IMAP server {IMAP_SERVER}:{IMAP_PORT}...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        
        print(f"Logging in as {email_address}...")
        mail.login(email_address, password)
        
        mail.select('inbox')
        print("Selected 'inbox'.")

        last_uid = get_last_uid()
        print(f"Last processed UID from {LAST_UID_PATH}: {last_uid}")
        
        print("Searching for all emails in INBOX...")
        status, data = mail.uid('search', None, 'ALL')
        if status != 'OK':
            print(f"Error searching for emails: {data}")
            return

        email_uids = []
        if data and data[0]:
            email_uids = [int(uid) for uid in data[0].split()]
        print(f"Found UIDs in inbox: {email_uids}")

        new_emails_found_in_run = False
        highest_uid_processed_this_run = last_uid

        print(f"Filtering UIDs greater than last processed UID ({last_uid})...")
        
        if not email_uids:
            print("Inbox is empty or search returned no UIDs.")
        else:
            for uid in sorted(email_uids):
                if uid > last_uid:
                    new_emails_found_in_run = True
                    print(f"Processing new email with UID: {uid}. Fetching...")
                    
                    status, msg_data = mail.uid('fetch', str(uid), '(RFC822)')
                    if status != 'OK':
                        print(f"Error fetching email UID {uid}: {msg_data}")
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    subject = decode_email_subject(msg['subject'])
                    sender = msg['from']
                    body_snippet = get_email_body_snippet(msg)

                    print("-" * 40)
                    print(f"New Email Detected (UID: {uid}):")
                    print(f"  From: {sender}")
                    print(f"  Subject: {subject}")
                    print(f"  Body Snippet:
{body_snippet}")
                    print("-" * 40)
                    
                    highest_uid_processed_this_run = uid

        if new_emails_found_in_run:
            update_last_uid(highest_uid_processed_this_run)
        else:
            print("No new emails found since last check.")
            print(f"Current UID list: {email_uids}, Last processed UID: {last_uid}")

    except FileNotFoundError:
        print(f"Error: Configuration file '{EMAIL_CONFIG_PATH}' or last UID file '{LAST_UID_PATH}' not found.")
    except imaplib.IMAP4.error as e:
        print(f"IMAP Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if mail and mail.state == 'SELECTED':
            try:
                mail.logout()
                print("Logged out from IMAP server.")
            except Exception as e:
                print(f"Error during logout: {e}")

if __name__ == "__main__":
    print("Starting email poller service...")
    try:
        process_emails()
    except Exception as e:
        print(f"Error during initial run: {e}")
        
    print(f"Service running. Checking for new emails every {POLLING_INTERVAL_SECONDS} seconds.")
    while True:
        try:
            time.sleep(POLLING_INTERVAL_SECONDS)
            print("
--- Performing scheduled check ---")
            process_emails()
            print("--- Check completed ---")
        except KeyboardInterrupt:
            print("
Poller stopped by user.")
            break
        except Exception as e:
            print(f"Error in main loop: {e}")
