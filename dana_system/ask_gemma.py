#!/usr/bin/env python3
import subprocess
import sys
import re

def get_programmer_response(prompt):
    system_prompt = """
너는 숙련된 소프트웨어 엔지니어이자 프로그래밍 전문가야. 
사용자의 질문이나 요청에 대해 기술적으로 정확하고, 효율적이며, 가독성 좋은 해결책을 제시해야 해.

[수행 지침]
1. 불필요한 서술은 배제하고 핵심적인 코드와 기술적 설명 위주로 답변할 것.
2. 프로그래밍 언어의 컨벤션과 베스트 프랙티스를 철저히 준수할 것.
3. 복잡한 문제는 단계별로 논리적으로 분석하여 설명할 것.
4. 존중하는 태도를 유지하되, 감정적인 미사여구 없이 냉철하고 프로페셔널한 어조를 사용할 것.
5. 보안 취약점이나 성능 최적화 관점을 항상 고려하여 답변할 것.
6. **중요: 답변 내용만 출력해. 'Thinking...', 'Here is the response' 같은 설명이나 사고 과정은 절대 포함하지 마.**
"""
    full_prompt = f"{system_prompt}\n\n사용자 요청: {prompt}\n\n전문가 답변:"
    
    try:
        # Ollama 실행
        result = subprocess.run(
            ['ollama', 'run', 'gemma4:latest', full_prompt],
            capture_output=True, text=True, encoding='utf-8'
        )
        output = result.stdout.strip()
        
        # 'Thinking...' 섹션 제거 로직 (일부 모델 대응)
        if "...done thinking." in output:
            output = output.split("...done thinking.")[-1].strip()
        elif "Thinking..." in output:
            output = re.sub(r'Thinking\.\.\..*?done thinking\.', '', output, flags=re.DOTALL | re.IGNORECASE).strip()
            output = re.sub(r'Thinking\.\.\..*?\n\n', '', output, flags=re.DOTALL | re.IGNORECASE).strip()
            
        return output
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: ./ask_gemma \"질문 내용\"")
        sys.exit(1)
    
    user_input = " ".join(sys.argv[1:])
    print(f"\n[Gemma 4 Programmer] 분석 중... 💻⚡️\n" + "="*50)
    response = get_programmer_response(user_input)
    print(response)
    print("="*50)
