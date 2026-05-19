# Monopoly Board — Design System
> Blank Paper Sketch

**Theme:** light

게임의 느낌은 두꺼운 잉크로 그린 보드게임 카드다. 웜 그레이 외부 배경 위에 흰 카드가 올라가 있고, 2.5px 굵기의 검정 테두리와 4px 하드 드롭 섀도가 종이 위에 놓인 물리적 질감을 만든다. 그라데이션과 블러는 일절 없다. 강조색은 포인트 레드(#d4321e) 하나만 사용한다.

---

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Warm Gray | `#8c887e` | `--bp-bg` | 외부 배경. 카드를 감싸는 테이블 표면. |
| White | `#ffffff` | `--bp-surface` | 흰 카드. 모든 콘텐츠의 주 배경. |
| Warm Cream | `#f0ece5` | `--bp-surface-warm` | 보조 버튼·주사위 무대 배경. |
| Ink Black | `#1a1a1a` | `--bp-border` | 테두리·텍스트·그림자. |
| Sub Gray | `#666666` | `--bp-text-sub` | 보조 텍스트·라벨. |
| Point Red | `#d4321e` | `--bp-accent` | 포인트 강조. 단일 색상 원칙. |

---

## Tokens — Typography

### Noto Sans KR — 유일한 서체. 한국어 지원 필수.

- **Source:** Google Fonts `Noto Sans KR:wght@400;700;900`
- **Substitute:** system-ui, sans-serif

### Type Scale

| Role | Size | Weight | 용도 |
|---|---|---|---|
| 굴리기 버튼 | 38px | 400 | 주사위 이모지 버튼 |
| HUD 수치 | 13px | 700 | 주사위·머니 잔량 |
| 배수 버튼 | 13px | 900 | ×1, ×2 ... |
| 타일 이름 | 9px | 700 | 타임라인 타일 |
| 타일 인덱스 | 9px | 400 | 타임라인 번호 |
| 라벨 | 11px | 700 | AUTO, 버튼 보조 |
| 섹션 라벨 | 10px | 700 | 타임라인 헤더 |

---

## Tokens — Spacing & Shapes

**Base unit:** 4px

### Border Radius

| Element | Value | Token |
|---|---|---|
| 카드 (game-screen) | 16px | `--bp-radius` |
| 타일·패널 | 10px | `--bp-radius-sm` |
| 버튼·칩 | 999px | `--bp-pill` |

### Border & Shadow

| Name | Value | Token |
|---|---|---|
| 기본 테두리 두께 | 2.5px | `--bp-bw` |
| 하드 드롭 섀도 | `4px 4px 0 #1a1a1a` | `--bp-shadow` |
| 소 드롭 섀도 | `2px 2px 0 #1a1a1a` | `--bp-shadow-sm` |

---

## Components

### 게임 카드 (#game-screen)
전체 게임을 담는 흰 카드. max-width 390px, flex column.
`background: #ffffff`, `border: 2.5px solid #1a1a1a`, `border-radius: 16px`, `box-shadow: 4px 4px 0 #1a1a1a`.

### HUD 슬롯 (.wire-hud-slot)
상단 HUD의 주사위·스테이지·머니를 담는 pill 형태 칩.
`background: #f0ece5`, `border: 2px solid #1a1a1a`, `border-radius: 999px`, `font: 11px/700`.

### 굴리기 버튼 (#roll-btn)
144×144px 원형 버튼. 게임의 핵심 인터랙션.
`width/height: 144px`, `border-radius: 50%`, `font-size: 38px`, `box-shadow: 4px 4px 0 #1a1a1a`.
탭 시 `transform: translate(4px, 4px)`, `box-shadow: none`.

### 배수 버튼 (.wire-mult-toggle)
굴리기 버튼 오른쪽에 위치. 현재 선택 배수 표시.
`min-width: 54px`, `height: 48px`, `border-radius: 999px`, `background: #f0ece5`, `font: 13px/900`.

### AUTO 버튼 (.wire-auto-toggle)
굴리기 버튼 왼쪽에 위치. ON 시 warm cream 배경으로 전환.
`min-width: 56px`, `height: 48px`, `border-radius: 999px`, `font: 11px/900`.

### 결과 패널 (#jr-result-modal)
타일 착지 시 슬라이드업. **전체 화면 dim 없음 — 인플로우 패널.**
`position: absolute`, `top: 110px`, `background: #ffffff`, `border: 2.5px solid #1a1a1a`, `box-shadow: 4px 4px 0 #1a1a1a`.
등장: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` 250ms.

### 타임라인 타일 (.timeline-tile)
64×64px 정사각 카드. 현재 칸은 warm cream 배경 + 강조 테두리.
`width/height: 64px`, `border: 2px solid #1a1a1a`, `border-radius: 10px`.
current: `background: #f0ece5`, `box-shadow: 2px 2px 0 #1a1a1a`.
dim: `opacity: 0.4`, `transform: scale(0.9)`.

---

## Surfaces

| Level | Name | Value | Purpose |
|---|---|---|---|
| 0 | Warm Gray | `#8c887e` | 외부 배경 (게임 카드 바깥) |
| 1 | White | `#ffffff` | 카드·모달·버튼 주 배경 |
| 2 | Warm Cream | `#f0ece5` | 보조 버튼·주사위 무대·current 타일 |

---

## Elevation

그림자는 항상 하드 드롭 섀도다. 블러 없음.

- **카드/모달:** `4px 4px 0 #1a1a1a`
- **버튼/칩:** `2px 2px 0 #1a1a1a`
- 탭 시: transform + shadow 동시 제거로 눌림 효과 표현

---

## Animations

| ID | 트리거 | Duration | Easing |
|---|---|---|---|
| 주사위 굴림 | roll_dice | ~1400ms | Three.js 물리 |
| 타임라인 칸 이동 | roll_dice | 500ms/칸 | cubic-bezier(0.25, 1.5, 0.5, 1) |
| 타임라인 착지 펄스 | 착지 | 200ms | ease-out |
| 결과 패널 슬라이드업 | result | 250ms | cubic-bezier(0.175, 0.885, 0.32, 1.275) |
| 결과 패널 페이드아웃 | confirm | 150ms | ease-out |
| 주사위 idle float | idle | 2000ms loop | ease-in-out |

---

## Layout

```
#root (padding: 14px, background: #8c887e)
  #game-screen (max-width: 390px, flex column)
    #jr-hud (flex row, border-bottom 2.5px)
    #jr-result-modal (position: absolute, 인플로우)
    .wire-dice-stage (flex: 1, min-height: 220px)
      #dice-canvas (aspect-ratio: 5/3)
    .wire-roll-row (CSS Grid: 1fr auto 1fr)
      .wire-auto-toggle
      #roll-btn (144×144px, circle)
      .wire-mult-toggle
    #timeline-wrap (flex-shrink: 0)
      .wire-timeline-viewport (overflow: hidden, height: 76px)
        #timeline-track (flex row, gap: 4px)
```

---

## Do's and Don'ts

### Do
- 테두리는 항상 `2px~2.5px solid #1a1a1a`
- 그림자는 항상 하드 드롭 섀도 (`4px 4px 0` or `2px 2px 0`)
- 버튼과 칩은 항상 pill 형태 (`border-radius: 999px`)
- 결과 패널은 인플로우 — HUD 바로 아래 밀어넣기
- 타임라인 칸 이동은 반드시 칸 단위 순차 이동 (전체 한 번에 슬라이드 금지)
- 굴리기 버튼은 144×144px 고정

### Don't
- 블러 섀도 금지 (`box-shadow` 에 blur 값 추가 금지)
- 그라데이션 배경 금지 (주사위 무대 캔버스 내부 제외)
- 전체화면 dim 오버레이 금지 (결과 패널은 절대 오버레이로 만들지 말 것)
- 인라인 style 속성 금지 (모든 스타일은 `src/wireframe.css` 에서)
- 굴리기 버튼 크기(144×144px) 임의 변경 금지

---

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --bp-bg:           #8c887e;
  --bp-surface:      #ffffff;
  --bp-surface-warm: #f0ece5;
  --bp-border:       #1a1a1a;
  --bp-text-sub:     #666666;
  --bp-accent:       #d4321e;

  /* Border */
  --bp-bw:           2.5px;
  --bp-radius:       16px;
  --bp-radius-sm:    10px;
  --bp-pill:         999px;

  /* Shadow */
  --bp-shadow:       4px 4px 0 #1a1a1a;
  --bp-shadow-sm:    2px 2px 0 #1a1a1a;
}
```

### Example Component Prompts

1. `굴리기 버튼을 만들어줘. 144×144px 원형, 배경 #ffffff, 테두리 2.5px solid #1a1a1a, box-shadow 4px 4px 0 #1a1a1a, font-size 38px. 탭 시 translate(4px, 4px) + shadow 제거.`

2. `HUD 슬롯 칩을 만들어줘. flex row, 배경 #f0ece5, 테두리 2px solid #1a1a1a, border-radius 999px, padding 4px 10px, font 11px/700.`

3. `타임라인 타일을 만들어줘. 64×64px, border 2px solid #1a1a1a, border-radius 10px, 배경 #ffffff. current 상태일 때 배경 #f0ece5, shadow 2px 2px 0 #1a1a1a.`
