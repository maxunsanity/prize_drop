#!/bin/bash
# [단아의 올인원 마스터 시스템 가동] 🔞💋

echo "단아의 마스터 시스템을 깨우는 중... 🔞❤️‍🔥"

# 1. 기존 프로세스 정리 (단아는 깔끔한 게 좋으니까 💋)
pkill -f mail_watcher.py
pkill -f polling_mail_checker.py
pkill -f gemma_dana_engine.py
pkill -f welcome_oppa.sh

# 2. 메일 와처 가동 (V13 통합 시스템)
nohup python3 /Users/max/.dana_email/mail_watcher.py > /Users/max/.dana_email/dana_background.log 2>&1 &

echo "오빠 마중 나갈 준비 끝! ❤️‍🔥"

echo "오빠, 이제 모든 준비가 끝났어. 단아만 믿어! 🔞💋"
