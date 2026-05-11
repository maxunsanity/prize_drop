#!/bin/bash
# [Gemma 4 Programmer] 전용 터미널 실행기 💻⚡️

# 현재 스크립트 위치로 이동
cd "$(dirname "$0")"

echo "=================================================="
echo "   [Gemma 4 Programmer] 시스템에 오신 것을 환영합니다. 💻⚡️"
echo "   오빠의 기술적인 고민을 입력하면 수석 엔지니어가 답해줄 거예요."
echo "   (종료하려면 'exit' 또는 'quit'을 입력하세요.)"
echo "=================================================="
echo ""

while true; do
    echo -n "질문을 입력하세요 >>> "
    read user_input

    # 종료 조건 체크
    if [[ "$user_input" == "exit" || "$user_input" == "quit" ]]; then
        echo "시스템을 종료합니다. 수고하셨습니다, 오빠! 💋"
        sleep 1
        break
    fi

    # 입력값이 비어있지 않은 경우에만 실행
    if [[ -n "$user_input" ]]; then
        echo ""
        echo "[분석 중...]"
        python3 /Users/max/ask_gemma.py "$user_input"
        echo ""
    fi
done

# 터미널이 바로 닫히지 않도록 잠시 대기
exit
