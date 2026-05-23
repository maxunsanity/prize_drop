/**
 * blockMaterial.ts — 블록 ShaderMaterial
 * 일반 블록: heart/star/circle/diamond/triangle
 * 특수 블록: STRIPED_H / STRIPED_V / PROPELLER / TNT / COLOR_BOMB
 *   → 완전히 다른 단일 마크 디자인, 전용 배경색
 */

import * as THREE from 'three';
import type { BlockConfig } from '../game/data.js';

const TEX = 256;
export const BLOCK_RENDER_ORDER = 2;

/* ── 특수 블록 고정 배경색 ── */
export const SPECIAL_BG: Record<string, number> = {
  STRIPED_H:  0x0A1865,  // 딥 스페이스 네이비
  STRIPED_V:  0x0A1865,
  PROPELLER:  0x003344,  // 딥 틸
  TNT:        0x2A0000,  // 다크 크림슨
  COLOR_BOMB: 0x0D0020,  // 코스믹 퍼플
};

/* ── Vertex Shader ── */
const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* ── Fragment Shader ── */
const FRAG = /* glsl */`
precision mediump float;
uniform vec3      uBlockColor;
uniform sampler2D uSymbol;
uniform float     uHighlight;
varying vec2 vUv;

float roundRectMask(vec2 uv, float r) {
  vec2 d = abs(uv - 0.5) - (0.5 - r);
  return 1.0 - smoothstep(-0.008, 0.008, length(max(d, 0.0)) - r);
}

void main() {
  float mask = roundRectMask(vUv, 0.16);
  if (mask < 0.01) discard;

  vec3 base   = uBlockColor;
  float hy    = smoothstep(0.42, 1.0, vUv.y);
  float hx    = 1.0 - abs(vUv.x - 0.5) * 2.2;
  float arc   = hy * hx * 0.26;
  float shadow = (1.0 - smoothstep(0.0, 0.20, vUv.y)) * 0.18;
  float flash  = clamp(arc + uHighlight, 0.0, 0.80);

  vec4 sym   = texture2D(uSymbol, vUv);
  vec3 lit   = base + flash - shadow;
  vec3 final = mix(lit, sym.rgb, sym.a);

  gl_FragColor = vec4(final * mask, mask);
}
`;

/* ────────────────────────────────────────────
   일반 블록 도형 드로잉
────────────────────────────────────────────── */

function makeFill(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): CanvasGradient {
  const g = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.22, 0, cx, cy, r * 1.05);
  g.addColorStop(0.0,  'rgba(255,255,255,1.00)');
  g.addColorStop(0.65, 'rgba(252,252,255,0.97)');
  g.addColorStop(1.0,  'rgba(222,222,245,0.85)');
  return g;
}

function applyStyle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.fillStyle   = makeFill(ctx, cx, cy, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth   = 3;
  ctx.lineJoin    = 'round';
  ctx.shadowColor   = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur    = TEX * 0.055;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const oy = cy - r * 0.06;
  ctx.beginPath();
  ctx.moveTo(cx, oy + r * 0.88);
  ctx.bezierCurveTo(cx - r*0.80, oy + r*0.32, cx - r, oy - r*0.10, cx - r*0.58, oy - r*0.50);
  ctx.bezierCurveTo(cx - r*0.18, oy - r*0.92, cx - r*0.02, oy - r*0.60, cx, oy - r*0.40);
  ctx.bezierCurveTo(cx + r*0.02, oy - r*0.60, cx + r*0.18, oy - r*0.92, cx + r*0.58, oy - r*0.50);
  ctx.bezierCurveTo(cx + r, oy - r*0.10, cx + r*0.80, oy + r*0.32, cx, oy + r*0.88);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  const inner = R * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const rad   = i % 2 === 0 ? R : inner;
    i === 0
      ? ctx.moveTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad)
      : ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
  }
  ctx.closePath();
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  ctx.beginPath();
  ctx.moveTo(cx,            cy - R);
  ctx.lineTo(cx + R * 0.62, cy);
  ctx.lineTo(cx,            cy + R);
  ctx.lineTo(cx - R * 0.62, cy);
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / 3);
    const x = cx + Math.cos(angle) * R;
    const y = cy + Math.sin(angle) * R;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ────────────────────────────────────────────
   특수 블록 마크 드로잉
────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════
   헬퍼: 3D 구체 느낌 그라디언트
═══════════════════════════════════════════════ */
function drawSphere3D(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  baseColor: string, midColor: string, darkColor: string,
): void {
  // 기본 구체
  const base = ctx.createRadialGradient(cx - r*0.2, cy - r*0.25, r*0.05, cx, cy, r);
  base.addColorStop(0.0, midColor);
  base.addColorStop(0.45, baseColor);
  base.addColorStop(1.0, darkColor);
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  // 상단 하이라이트 (렌즈 반사)
  const hl = ctx.createRadialGradient(cx - r*0.3, cy - r*0.35, 0, cx - r*0.15, cy - r*0.2, r*0.6);
  hl.addColorStop(0.0, 'rgba(255,255,255,0.80)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.22)');
  hl.addColorStop(1.0, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  // 하단 반사광
  const bot = ctx.createRadialGradient(cx + r*0.15, cy + r*0.4, 0, cx, cy + r*0.5, r*0.5);
  bot.addColorStop(0.0, 'rgba(255,255,255,0.25)');
  bot.addColorStop(1.0, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = bot;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
}

/* ═══════════════════════════════════════════════
   STRIPED_H — 메탈릭 가로 로켓 →
═══════════════════════════════════════════════ */
function drawStripedH(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  const bL = cx - TEX*0.36;  // 몸통 왼쪽 끝
  const bR = cx + TEX*0.26;  // 몸통 오른쪽 끝
  const bH = TEX*0.28;       // 몸통 반높이

  // ── 스피드 라인 (왼쪽 꼬리) ──
  const lineData = [
    { yOff: -bH*0.35, w: TEX*0.30, h: 3.5, a: 0.55 },
    { yOff:  0,        w: TEX*0.38, h: 5,   a: 0.75 },
    { yOff:  bH*0.35, w: TEX*0.30, h: 3.5, a: 0.55 },
  ];
  for (const l of lineData) {
    const lg = ctx.createLinearGradient(bL - l.w, cy + l.yOff, bL + 8, cy + l.yOff);
    lg.addColorStop(0, `rgba(80,160,255,0)`);
    lg.addColorStop(0.7, `rgba(120,200,255,${l.a})`);
    lg.addColorStop(1,   `rgba(180,230,255,${l.a})`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.roundRect(bL - l.w, cy + l.yOff - l.h/2, l.w, l.h, l.h/2);
    ctx.fill();
  }

  // ── 엔진 화염 ──
  const flameX = bL + 6;
  const fg = ctx.createRadialGradient(flameX, cy, 2, flameX - TEX*0.1, cy, TEX*0.24);
  fg.addColorStop(0,   'rgba(255,255,200,1.0)');
  fg.addColorStop(0.25,'rgba(255,180,0,0.95)');
  fg.addColorStop(0.6, 'rgba(255,60,0,0.55)');
  fg.addColorStop(1,   'rgba(255,0,0,0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(flameX - TEX*0.08, cy, TEX*0.20, bH*0.52, 0, 0, Math.PI*2);
  ctx.fill();

  // ── 날개 (fin) ──
  const finX  = bL + TEX*0.10;
  const finGrad = ctx.createLinearGradient(finX, cy - bH, finX, cy + bH);
  finGrad.addColorStop(0, '#FF9933'); finGrad.addColorStop(1, '#CC4400');
  ctx.fillStyle = finGrad;
  // 위 날개
  ctx.beginPath();
  ctx.moveTo(finX,            cy - bH);
  ctx.lineTo(finX + TEX*0.14, cy - bH - TEX*0.18);
  ctx.lineTo(finX + TEX*0.28, cy - bH);
  ctx.closePath(); ctx.fill();
  // 아래 날개
  ctx.beginPath();
  ctx.moveTo(finX,            cy + bH);
  ctx.lineTo(finX + TEX*0.14, cy + bH + TEX*0.18);
  ctx.lineTo(finX + TEX*0.28, cy + bH);
  ctx.closePath(); ctx.fill();

  // ── 로켓 몸통 ──
  const bodyGrad = ctx.createLinearGradient(bL, cy - bH, bL, cy + bH);
  bodyGrad.addColorStop(0,   '#F0F0FF');
  bodyGrad.addColorStop(0.18,'#FFFFFF');
  bodyGrad.addColorStop(0.52,'#B0B0C8');
  bodyGrad.addColorStop(0.82,'#707088');
  bodyGrad.addColorStop(1,   '#404055');
  ctx.beginPath();
  ctx.arc(bL, cy, bH, Math.PI*0.5, Math.PI*1.5);  // 꼬리 반원
  ctx.lineTo(bR, cy - bH);
  ctx.lineTo(bR + bH*1.5, cy);                      // 노즈 콘
  ctx.lineTo(bR, cy + bH);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 몸통 테두리
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 상단 하이라이트 줄
  const topHL = ctx.createLinearGradient(bL, cy - bH, bR, cy - bH);
  topHL.addColorStop(0, 'rgba(255,255,255,0)');
  topHL.addColorStop(0.3,'rgba(255,255,255,0.8)');
  topHL.addColorStop(1,  'rgba(255,255,255,0.1)');
  ctx.fillStyle = topHL;
  ctx.beginPath();
  ctx.arc(bL, cy, bH, Math.PI*0.5, Math.PI*1.5);
  ctx.lineTo(bR, cy - bH);
  ctx.lineTo(bR, cy - bH*0.55);
  ctx.lineTo(bL, cy - bH*0.55);
  ctx.closePath(); ctx.fill();

  // ── 오렌지 스트라이프 밴드 ──
  const bandX = bL + (bR - bL)*0.30;
  ctx.fillStyle = '#FF8822';
  ctx.beginPath();
  ctx.rect(bandX, cy - bH, TEX*0.055, bH*2);
  ctx.fill();

  // ── 포트홀 (창문) ──
  const winX = bL + (bR - bL)*0.65;
  const winR = bH * 0.36;
  drawSphere3D(ctx, winX, cy, winR, '#0055CC', '#88CCFF', '#001144');
  // 창문 테두리
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(winX, cy, winR, 0, Math.PI*2); ctx.stroke();

  ctx.restore();
}

/* ═══════════════════════════════════════════════
   STRIPED_V — 메탈릭 세로 로켓 ↑ (H를 90° 회전)
═══════════════════════════════════════════════ */
function drawStripedV(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  drawStripedH(ctx, 0, 0);
  ctx.restore();
}

/* ═══════════════════════════════════════════════
   PROPELLER — 4날개 메탈릭 로터 (회전 블러 포함)
═══════════════════════════════════════════════ */
function drawPropeller(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R   = TEX * 0.39;
  const bw  = TEX * 0.19;  // 날개 두께 반값

  // ── 모션 블러 날개 (45° 오프셋, 투명) ──
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.125;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.globalAlpha = 0.18;
    const mg = ctx.createLinearGradient(0, -bw, R, -bw);
    mg.addColorStop(0, '#AADDFF'); mg.addColorStop(1, '#224466');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(R*0.5, 0, R*0.5, bw*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // ── 실제 날개 4개 ──
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);

    // 날개 그라디언트 (선두 엣지 밝고 후연 어두움)
    const wg = ctx.createLinearGradient(-bw, 0, bw, 0);
    wg.addColorStop(0,   '#DDEEFF');
    wg.addColorStop(0.35,'#FFFFFF');
    wg.addColorStop(0.65,'#88AACC');
    wg.addColorStop(1,   '#334466');

    // 날개 깊이 (루트→팁 테이퍼)
    const dg = ctx.createLinearGradient(0, 0, R, 0);
    dg.addColorStop(0,  'rgba(80,140,200,0.3)');
    dg.addColorStop(0.5,'rgba(255,255,255,0)');
    dg.addColorStop(1,  'rgba(0,30,60,0.4)');

    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(TEX*0.06, -bw);
    ctx.bezierCurveTo(R*0.4, -bw*1.3, R*0.85, -bw*0.85, R, 0);
    ctx.bezierCurveTo(R*0.85, bw*0.85, R*0.4, bw*1.3, TEX*0.06, bw);
    ctx.closePath();
    ctx.fill();

    // 날개 광택
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(TEX*0.06, -bw);
    ctx.bezierCurveTo(R*0.4, -bw*1.3, R*0.85, -bw*0.85, R, 0);
    ctx.bezierCurveTo(R*0.85, bw*0.85, R*0.4, bw*1.3, TEX*0.06, bw);
    ctx.closePath();
    ctx.fill();

    // 날개 테두리
    ctx.strokeStyle = 'rgba(150,200,255,0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // ── 중앙 허브 ──
  const hubR = TEX * 0.105;
  drawSphere3D(ctx, cx, cy, hubR, '#6699BB', '#AADDFF', '#112233');
  // 허브 테두리 링
  ctx.strokeStyle = 'rgba(180,230,255,0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, Math.PI*2); ctx.stroke();
  // 허브 중심 볼트
  ctx.fillStyle = '#DDEEFF';
  ctx.beginPath(); ctx.arc(cx, cy, TEX*0.028, 0, Math.PI*2); ctx.fill();
}

/* ═══════════════════════════════════════════════
   TNT — 클래식 폭탄 구체 (3D 메탈릭)
═══════════════════════════════════════════════ */
function drawTNT(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = TEX * 0.35;

  // ── 외부 글로우 (위험 분위기) ──
  const glow = ctx.createRadialGradient(cx, cy, R*0.6, cx, cy, R*1.5);
  glow.addColorStop(0,   'rgba(255,80,0,0.0)');
  glow.addColorStop(0.5, 'rgba(200,30,0,0.18)');
  glow.addColorStop(1,   'rgba(100,0,0,0.0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, R*1.5, 0, Math.PI*2); ctx.fill();

  // ── 폭탄 구체 (어두운 메탈) ──
  drawSphere3D(ctx, cx, cy, R, '#3A3A3A', '#606060', '#0A0A0A');

  // ── 적색 적도 밴드 ──
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.clip();
  const bandG = ctx.createLinearGradient(0, cy - R*0.22, 0, cy + R*0.22);
  bandG.addColorStop(0,   'rgba(180,0,0,0)');
  bandG.addColorStop(0.25,'rgba(220,20,0,0.75)');
  bandG.addColorStop(0.5, 'rgba(255,40,0,0.9)');
  bandG.addColorStop(0.75,'rgba(220,20,0,0.75)');
  bandG.addColorStop(1,   'rgba(180,0,0,0)');
  ctx.fillStyle = bandG;
  ctx.fillRect(cx - R, cy - R*0.22, R*2, R*0.44);
  ctx.restore();

  // ── 구체 테두리 림라이트 ──
  ctx.strokeStyle = 'rgba(100,100,120,0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();

  // 상단 림 하이라이트 (밝은 반원호)
  ctx.strokeStyle = 'rgba(200,200,220,0.50)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1.5, Math.PI*1.15, Math.PI*1.85);
  ctx.stroke();

  // ── 심지 ──
  const fuseBaseX = cx + R*0.08;
  const fuseBaseY = cy - R + 4;
  ctx.strokeStyle = '#C8A050';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(fuseBaseX, fuseBaseY);
  ctx.bezierCurveTo(
    fuseBaseX + TEX*0.15, fuseBaseY - TEX*0.10,
    fuseBaseX + TEX*0.04, fuseBaseY - TEX*0.22,
    fuseBaseX + TEX*0.12, fuseBaseY - TEX*0.30,
  );
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── 심지 불꽃 스파크 ──
  const sparkX = fuseBaseX + TEX*0.12;
  const sparkY = fuseBaseY - TEX*0.31;
  // 외부 글로우
  const sg = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, TEX*0.095);
  sg.addColorStop(0,   'rgba(255,255,220,1.0)');
  sg.addColorStop(0.2, 'rgba(255,200,0,0.9)');
  sg.addColorStop(0.5, 'rgba(255,80,0,0.5)');
  sg.addColorStop(1,   'rgba(255,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(sparkX, sparkY, TEX*0.095, 0, Math.PI*2); ctx.fill();
  // 스파크 코어
  ctx.fillStyle = '#FFFADD';
  ctx.beginPath(); ctx.arc(sparkX, sparkY, TEX*0.026, 0, Math.PI*2); ctx.fill();
}

/* ═══════════════════════════════════════════════
   COLOR_BOMB — 프리즘 에너지 오브 (무지개 크리스탈)
═══════════════════════════════════════════════ */
function drawColorBomb(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = TEX * 0.36;
  const RAYS = 8;
  const rayColors = [
    '#FF3333','#FF8800','#FFEE00','#44FF66',
    '#22CCFF','#4455FF','#AA33FF','#FF44CC',
  ];

  // ── 외부 오로라 글로우 ──
  const outerG = ctx.createRadialGradient(cx, cy, R*0.5, cx, cy, R*1.6);
  outerG.addColorStop(0,   'rgba(180,80,255,0.0)');
  outerG.addColorStop(0.45,'rgba(100,0,200,0.30)');
  outerG.addColorStop(0.8, 'rgba(30,0,80,0.18)');
  outerG.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = outerG;
  ctx.beginPath(); ctx.arc(cx, cy, R*1.6, 0, Math.PI*2); ctx.fill();

  // ── 레인보우 레이 (8방향 빔) ──
  for (let i = 0; i < RAYS; i++) {
    const ang = (i / RAYS) * Math.PI * 2 - Math.PI * 0.5;
    const tipX = cx + Math.cos(ang) * R * 1.35;
    const tipY = cy + Math.sin(ang) * R * 1.35;
    const rayW  = R * 0.22;

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);
    const rg = ctx.createLinearGradient(0, 0, R*1.35, 0);
    rg.addColorStop(0,   'rgba(255,255,255,0.6)');
    rg.addColorStop(0.35, rayColors[i] + 'CC');
    rg.addColorStop(0.7,  rayColors[i] + '55');
    rg.addColorStop(1,    rayColors[i] + '00');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(0, -rayW * 0.08);
    ctx.lineTo(R*1.35, -rayW * 0.5);
    ctx.lineTo(R*1.35,  rayW * 0.5);
    ctx.lineTo(0,  rayW * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 레이 끝 스파클
    const spkG = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, TEX*0.055);
    spkG.addColorStop(0,   rayColors[i] + 'FF');
    spkG.addColorStop(0.5, rayColors[i] + '55');
    spkG.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = spkG;
    ctx.beginPath(); ctx.arc(tipX, tipY, TEX*0.055, 0, Math.PI*2); ctx.fill();
  }

  // ── 메인 구체 (무지개 + 메탈릭) ──
  // 구체 베이스
  const sphereG = ctx.createRadialGradient(cx - R*0.15, cy - R*0.18, R*0.05, cx, cy, R);
  sphereG.addColorStop(0,   '#FFFFFF');
  sphereG.addColorStop(0.15,'#E8CCFF');
  sphereG.addColorStop(0.45,'#8833CC');
  sphereG.addColorStop(0.75,'#440088');
  sphereG.addColorStop(1,   '#1A0033');
  ctx.fillStyle = sphereG;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

  // 무지개 오버레이 (얇은 파이 조각들)
  for (let i = 0; i < RAYS; i++) {
    const a1 = (i / RAYS) * Math.PI * 2 - Math.PI * 0.5;
    const a2 = ((i + 0.85) / RAYS) * Math.PI * 2 - Math.PI * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a1, a2);
    ctx.closePath();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = rayColors[i];
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // 구체 테두리
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();

  // ── 상단 하이라이트 ──
  const hl = ctx.createRadialGradient(cx - R*0.32, cy - R*0.35, 0, cx - R*0.1, cy - R*0.1, R*0.7);
  hl.addColorStop(0.0, 'rgba(255,255,255,0.85)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.25)');
  hl.addColorStop(1.0, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();

  // ── 중심 코어 플래시 ──
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R*0.35);
  core.addColorStop(0,   'rgba(255,255,255,1.0)');
  core.addColorStop(0.4, 'rgba(220,180,255,0.6)');
  core.addColorStop(1,   'rgba(120,0,200,0.0)');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, cy, R*0.35, 0, Math.PI*2); ctx.fill();

  // ── 4방향 렌즈 플레어 십자 ──
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R*0.1,  cy + Math.sin(a) * R*0.1);
    ctx.lineTo(cx + Math.cos(a) * R*0.42, cy + Math.sin(a) * R*0.42);
    ctx.stroke();
  }
}


/* ── 텍스처 생성 (일반 + 특수) ── */
function createSymbolTexture(shape: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TEX;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, TEX, TEX);

  const cx = TEX / 2;
  const cy = TEX / 2;

  switch (shape) {
    /* ── 일반 블록 ── */
    case 'heart': {
      const R = TEX * 0.22;
      applyStyle(ctx, cx, cy, R);
      drawHeart(ctx, cx, cy, R);
      ctx.fill(); ctx.stroke(); break;
    }
    case 'star': {
      const R = TEX * 0.27;
      applyStyle(ctx, cx, cy, R);
      drawStar(ctx, cx, cy, R);
      ctx.fill(); ctx.stroke(); break;
    }
    case 'circle': {
      const R = TEX * 0.26;
      applyStyle(ctx, cx, cy, R);
      drawCircle(ctx, cx, cy, R);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      const hl = ctx.createRadialGradient(cx-R*0.25, cy-R*0.28, 0, cx-R*0.1, cy-R*0.1, R*0.55);
      hl.addColorStop(0, 'rgba(255,255,255,0.58)');
      hl.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = hl;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'diamond': {
      const R = TEX * 0.26;
      applyStyle(ctx, cx, cy, R);
      drawDiamond(ctx, cx, cy, R);
      ctx.fill(); ctx.stroke(); break;
    }
    case 'triangle': {
      const R = TEX * 0.28;
      applyStyle(ctx, cx, cy, R);
      drawTriangle(ctx, cx, cy, R);
      ctx.fill(); ctx.stroke(); break;
    }

    /* ── 특수 블록 (배경색은 uBlockColor가 담당, 여기선 마크만) ── */
    case 'STRIPED_H':  drawStripedH(ctx, cx, cy);  break;
    case 'STRIPED_V':  drawStripedV(ctx, cx, cy);  break;
    case 'PROPELLER':  drawPropeller(ctx, cx, cy);  break;
    case 'TNT':        drawTNT(ctx, cx, cy);        break;
    case 'COLOR_BOMB': drawColorBomb(ctx, cx, cy);  break;

    default: {
      applyStyle(ctx, cx, cy, TEX * 0.24);
      ctx.beginPath(); ctx.arc(cx, cy, TEX * 0.24, 0, Math.PI * 2); ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ── createBlockMaterial ── */
export function createBlockMaterial(
  cfg: BlockConfig,
): { material: THREE.ShaderMaterial; texture: THREE.CanvasTexture } {
  const texture    = createSymbolTexture(cfg.emoji);
  const blockColor = new THREE.Color(cfg.bgColor);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBlockColor: { value: blockColor },
      uSymbol:     { value: texture    },
      uHighlight:  { value: 0.0        },
    },
    vertexShader:   VERT,
    fragmentShader: FRAG,
    transparent:    true,
    depthWrite:     false,
  });

  return { material, texture };
}

export function tickBlockMaterials(
  _materials: Map<number, THREE.ShaderMaterial>,
  _elapsed: number,
): void { /* idle 없음 */ }

/* ══════════════════════════════════════════
   블로커 텍스처
══════════════════════════════════════════ */

export const BLOCKER_BG: Record<string, number> = {
  CHIP_RACK:      0x2255AA,
  POKER_CARD:     0xDDCC88,
  DEALERS_SAFE:   0x336633,
  ROULETTE_WHEEL: 0x882222,
};

function drawBlockerChipRack(ctx: CanvasRenderingContext2D, cx: number, cy: number, hp: number): void {
  const maxHp = 2;
  const chipH = TEX * 0.14;
  const chipW = TEX * 0.60;
  const totalH = chipH * maxHp + TEX * 0.04 * (maxHp - 1);
  let startY = cy - totalH / 2;

  for (let i = 0; i < maxHp; i++) {
    const alive = i < hp;
    const y = startY + i * (chipH + TEX * 0.04);
    // 칩 배경
    ctx.beginPath();
    ctx.roundRect(cx - chipW / 2, y, chipW, chipH, chipH * 0.3);
    const grad = ctx.createLinearGradient(cx - chipW/2, y, cx + chipW/2, y);
    if (alive) { grad.addColorStop(0, '#eecc88'); grad.addColorStop(0.5, '#fff8cc'); grad.addColorStop(1, '#eecc88'); }
    else { grad.addColorStop(0, '#888'); grad.addColorStop(1, '#555'); }
    ctx.fillStyle = grad;
    ctx.fill();
    // 줄무늬 (칩 가장자리)
    if (alive) {
      ctx.strokeStyle = '#aa8833'; ctx.lineWidth = 2; ctx.stroke();
      const stripeW = chipH * 0.4;
      ctx.fillStyle = '#cc9944';
      ctx.fillRect(cx - chipW / 2, y, stripeW, chipH);
      ctx.fillRect(cx + chipW / 2 - stripeW, y, stripeW, chipH);
    }
  }
  ctx.font = `bold ${TEX * 0.22}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#fff';
  ctx.fillText('×' + hp, cx, cy + totalH / 2 + TEX * 0.15);
}

function drawBlockerPokerCard(ctx: CanvasRenderingContext2D, cx: number, cy: number, hp: number, faceUp: boolean, suit?: string): void {
  const w = TEX * 0.62, h = TEX * 0.78, r = TEX * 0.08;
  const x = cx - w / 2, y = cy - h / 2;
  // 카드 배경
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = hp > 0 ? '#fffdf0' : '#e0ddd0'; ctx.fill();
  ctx.strokeStyle = '#bbaa88'; ctx.lineWidth = 3; ctx.stroke();
  if (faceUp && suit) {
    const suits: Record<string, string> = { BLOCK_01: '♠', BLOCK_02: '♦', BLOCK_03: '♣', BLOCK_04: '♥', BLOCK_05: '★' };
    const colors: Record<string, string> = { BLOCK_01: '#222', BLOCK_02: '#cc2200', BLOCK_03: '#224422', BLOCK_04: '#cc2200', BLOCK_05: '#774400' };
    const sym = suits[suit] ?? '?';
    ctx.font = `bold ${TEX * 0.42}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = colors[suit] ?? '#333';
    ctx.fillText(sym, cx, cy);
    // 코너 기호
    ctx.font = `bold ${TEX * 0.18}px serif`;
    ctx.fillText(sym, cx - w * 0.28, cy - h * 0.32);
    ctx.fillText(sym, cx + w * 0.28, cy + h * 0.32);
  } else {
    // 카드 뒷면 패턴
    ctx.fillStyle = '#8844aa';
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc(x + w * (0.25 + c * 0.25), y + h * (0.2 + r * 0.2), TEX * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  if (hp < 2) {
    // 균열
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - TEX*0.08, cy - TEX*0.2); ctx.lineTo(cx + TEX*0.04, cy + TEX*0.18); ctx.stroke();
  }
}

function drawBlockerDealersSafe(ctx: CanvasRenderingContext2D, cx: number, cy: number, hp: number): void {
  const w = TEX * 0.72, h = TEX * 0.72;
  const x = cx - w / 2, y = cy - h / 2;
  // 금고 몸체
  ctx.beginPath(); ctx.roundRect(x, y, w, h, TEX * 0.06);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#4a7a4a'); g.addColorStop(1, '#2a4a2a');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#aacc88'; ctx.lineWidth = 4; ctx.stroke();
  // 힌지 리벳
  const rivets: [number, number][] = [[x + TEX*0.08, y + TEX*0.12], [x + TEX*0.08, y + h - TEX*0.12]];
  for (const [rx, ry] of rivets) {
    ctx.beginPath(); ctx.arc(rx, ry, TEX * 0.055, 0, Math.PI*2);
    ctx.fillStyle = '#ccdd99'; ctx.fill();
  }
  // 다이얼 (잠금 휠)
  ctx.beginPath(); ctx.arc(cx + TEX*0.06, cy, TEX * 0.18, 0, Math.PI*2);
  ctx.fillStyle = '#88aa66'; ctx.fill();
  ctx.strokeStyle = '#ccdd99'; ctx.lineWidth = 3; ctx.stroke();
  // 다이얼 선
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + TEX*0.06 + Math.cos(angle) * TEX*0.10, cy + Math.sin(angle) * TEX*0.10);
    ctx.lineTo(cx + TEX*0.06 + Math.cos(angle) * TEX*0.16, cy + Math.sin(angle) * TEX*0.16);
    ctx.strokeStyle = '#ccdd99'; ctx.lineWidth = 2; ctx.stroke();
  }
  // HP 표시
  ctx.font = `bold ${TEX * 0.18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#ccff88';
  ctx.fillText('HP:' + hp, cx, y + h + TEX * 0.16);
  // 균열
  if (hp < 3) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - TEX*0.1, cy - TEX*0.25); ctx.lineTo(cx, cy + TEX*0.15); ctx.stroke();
    if (hp < 2) {
      ctx.beginPath(); ctx.moveTo(cx + TEX*0.1, cy - TEX*0.15); ctx.lineTo(cx - TEX*0.05, cy + TEX*0.25); ctx.stroke();
    }
  }
}

function drawBlockerRouletteWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, hp: number): void {
  const R = TEX * 0.38;
  const sectors = 8;
  const colors = ['#006600', '#cc0000', '#006600', '#cc0000', '#006600', '#cc0000', '#006600', '#006600'];
  // 외부 링
  ctx.beginPath(); ctx.arc(cx, cy, R + TEX*0.05, 0, Math.PI*2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
  // 섹터
  for (let i = 0; i < sectors; i++) {
    const startA = (i / sectors) * Math.PI * 2 - Math.PI / 2;
    const endA   = ((i + 1) / sectors) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startA, endA);
    ctx.closePath();
    ctx.fillStyle = colors[i]; ctx.fill();
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.stroke();
    // 숫자
    const midA = startA + (Math.PI * 2) / sectors / 2;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${TEX * 0.10}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i * 4 + (i % 2 === 0 ? 2 : 11)), cx + Math.cos(midA) * R * 0.65, cy + Math.sin(midA) * R * 0.65);
  }
  // 중앙 허브
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.18, 0, Math.PI*2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
  ctx.strokeStyle = '#aa8800'; ctx.lineWidth = 3; ctx.stroke();
  // HP 균열
  if (hp < 4) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = hp < 2 ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(cx - TEX*0.12, cy - TEX*0.3); ctx.lineTo(cx + TEX*0.06, cy + TEX*0.2); ctx.stroke();
  }
}

export function createBlockerTexture(
  kind: string,
  hp: number,
  opts?: { faceRevealed?: boolean; revealedType?: string },
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX; canvas.height = TEX;
  const ctx = canvas.getContext('2d')!;
  const cx = TEX / 2, cy = TEX / 2;

  // 둥근 사각형 배경 클립
  ctx.save();
  ctx.beginPath();
  const r = TEX * 0.16;
  ctx.roundRect(0, 0, TEX, TEX, r);
  ctx.clip();

  // 배경 그라디언트
  const bg = BLOCKER_BG[kind] ?? 0x444444;
  const bgHex = `#${bg.toString(16).padStart(6, '0')}`;
  const bgGrad = ctx.createLinearGradient(0, 0, TEX, TEX);
  bgGrad.addColorStop(0, bgHex + 'dd');
  bgGrad.addColorStop(1, bgHex + '88');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, TEX, TEX);

  switch (kind) {
    case 'CHIP_RACK':
      drawBlockerChipRack(ctx, cx, cy, hp);
      break;
    case 'POKER_CARD':
      drawBlockerPokerCard(ctx, cx, cy, hp, opts?.faceRevealed ?? false, opts?.revealedType);
      break;
    case 'DEALERS_SAFE':
      drawBlockerDealersSafe(ctx, cx, cy, hp);
      break;
    case 'ROULETTE_WHEEL':
      drawBlockerRouletteWheel(ctx, cx, cy, hp);
      break;
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createBlockerMaterial(
  kind: string,
  hp: number,
  opts?: { faceRevealed?: boolean; revealedType?: string },
): { material: THREE.MeshBasicMaterial; texture: THREE.CanvasTexture } {
  const texture = createBlockerTexture(kind, hp, opts);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  return { material, texture };
}
