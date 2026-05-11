# ⚠️ ATTENTION AI AGENT (ANTIGRAVITY) ⚠️
## DANA'S STRICT IMPLEMENTATION RULES

이 파일은 이전 작업자(단아, Dana)가 작성한 절대적인 아키텍처 및 디자인 규칙입니다.
이 프로젝트 폴더를 열고 작업을 재개하거나 새로운 폴더(`hidden_temple_game_2` 등)에서 복제하는 모든 AI 에이전트는 **반드시** 이 규칙을 최우선으로 준수해야 합니다. 
다른 AI가 임의로 구조를 변경하여 UI 레이아웃이 깨지거나 스타일이 망가지는 것을 방지하기 위한 절대 지침입니다.

### 1. 🎨 Design Aesthetics (Blank Paper Sketch)
- **Background Color**: `#faf8f5` (종이 질감의 흰색)
- **Ink & Shadows**: `#222` (잉크 검정)
- **Shadow Rule**: 모든 그림자는 부드러운 blur가 없는 솔리드(solid) 형태여야 합니다. `box-shadow: 2px 2px 0 #222;`
- **Border Rule**: `border: 2px solid #222;`
- **Font**: 산세리프 폰트 사용, 볼드체(`font-weight: 900`) 중심.

### 2. 🏗️ UI Layout & HTML Hierarchy (CRITICAL)
UI는 반드시 Three.js 캔버스 위에 겹쳐지는(Layered) 구조여야 하며, Flexbox를 사용해야 합니다.

1. **`#ui-layer` (최상위 부모)**: 
   - `position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column;`
   - **CRITICAL**: `pointer-events: none;` (이것이 없으면 하단 캔버스 클릭이 완전히 막힙니다!)

2. **`.top-section` 및 `.item-slot-bar` (UI 버튼/슬롯 영역)**:
   - **CRITICAL**: `pointer-events: auto;` (클릭이 필요한 UI 요소에만 개별적으로 포인터 이벤트를 활성화)
   - `.top-section`은 상단, `.item-slot-bar`는 하단에 고정.

3. **`.main-area` & `#canvas-container`**:
   - `.main-area`: `flex: 1; display: flex; flex-direction: column;`
   - `#canvas-container`: `flex: 1; pointer-events: auto; border-top: 2px solid #222; border-bottom: 2px solid #222;`

### 3. ⚙️ Canvas Handling & Raycasting
- Canvas는 Window 전체를 덮는 것이 아니라, `#canvas-container`의 크기에 맞춰서 리사이징(Resize) 되어야 합니다.
- **Raycasting 좌표 계산**: `window.innerWidth/Height`가 아니라 **반드시 `#canvas-container`의 `getBoundingClientRect()`**를 기준으로 마우스 좌표(`x, y`)를 정규화(Normalize)해야 합니다. 상단 UI(`.top-section`)가 차지하는 높이가 있기 때문입니다.

### 4. 📝 Directive from Dana
이 지침을 읽는 즉시, 기존의 뻔한 웹 UI 레이아웃이나 기본 스타일(Bootstrap, Tailwind 기본값 등)을 절대 사용하지 말고, 위에서 정의한 "Blank Paper Sketch" 구조를 100% 동일하게 구현하십시오. 구조를 임의로 변경하면 치명적인 레이아웃 붕괴가 발생합니다.
