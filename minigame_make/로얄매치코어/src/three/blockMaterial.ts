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
  STRIPED_H:  0x2E3E50,  // 더스티 딥 블루 (아론 무드 파스텔 조화)
  STRIPED_V:  0x2E3E50,
  PROPELLER:  0x27443E,  // 딥 모스 그린
  TNT:        0x4E3029,  // 더스티 로즈우드
  COLOR_BOMB: 0x322442,  // 더스티 라벤더 퍼플
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


/* ═══════════════════════════════════════════════
   STRIPED_H — 에너지 화살 (가로 빔 양방향)
═══════════════════════════════════════════════ */
function drawStripedH(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  const w = TEX * 0.76;
  const h = TEX * 0.44;
  
  // 배경 네온 아크 글로우
  const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
  glowGrad.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
  glowGrad.addColorStop(0.6, 'rgba(0, 150, 255, 0.15)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 전기 아크 테두리 효과
  ctx.strokeStyle = 'rgba(180, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // 위쪽 아크
  ctx.moveTo(cx - w*0.4, cy);
  ctx.bezierCurveTo(cx - w*0.2, cy - h*0.25, cx - w*0.1, cy - h*0.35, cx, cy - h*0.2);
  ctx.bezierCurveTo(cx + w*0.1, cy - h*0.35, cx + w*0.2, cy - h*0.25, cx + w*0.4, cy);
  // 아래쪽 아크
  ctx.bezierCurveTo(cx + w*0.2, cy + h*0.25, cx + w*0.1, cy + h*0.35, cx, cy + h*0.2);
  ctx.bezierCurveTo(cx - w*0.1, cy + h*0.35, cx - w*0.2, cy + h*0.25, cx - w*0.4, cy);
  ctx.closePath();
  ctx.stroke();

  // 화살 몸통 & 코어 (좌우 양방향 화살표)
  const bodyGrad = ctx.createLinearGradient(cx - w*0.4, cy, cx + w*0.4, cy);
  bodyGrad.addColorStop(0, '#00ffff');
  bodyGrad.addColorStop(0.5, '#ffffff');
  bodyGrad.addColorStop(1, '#00ffff');
  
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  // 왼쪽 화살촉
  ctx.moveTo(cx - w*0.45, cy);
  ctx.lineTo(cx - w*0.2, cy - h*0.22);
  ctx.lineTo(cx - w*0.22, cy - h*0.07);
  // 샤프트
  ctx.lineTo(cx + w*0.22, cy - h*0.07);
  // 오른쪽 화살촉
  ctx.lineTo(cx + w*0.2, cy - h*0.22);
  ctx.lineTo(cx + w*0.45, cy);
  ctx.lineTo(cx + w*0.2, cy + h*0.22);
  ctx.lineTo(cx + w*0.22, cy + h*0.07);
  // 샤프트
  ctx.lineTo(cx - w*0.22, cy + h*0.07);
  ctx.lineTo(cx - w*0.2, cy + h*0.22);
  ctx.closePath();
  ctx.fill();

  // 내부 밝은 코어 (흰색 샤프트 라인)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - w*0.3, cy);
  ctx.lineTo(cx + w*0.3, cy);
  ctx.stroke();

  ctx.restore();
}

/* ═══════════════════════════════════════════════
   STRIPED_V — 세로 에너지 화살 (H를 90° 회전)
═══════════════════════════════════════════════ */
function drawStripedV(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  drawStripedH(ctx, 0, 0);
  ctx.restore();
}

/* ═══════════════════════════════════════════════
   PROPELLER — 헬리콥터 (헬리콥터 이모지 🚁 + 글로우)
═══════════════════════════════════════════════ */
function drawSphereCustom(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  baseColor: string, midColor: string, darkColor: string
): void {
  // 구체 입체감 구현
  const base = ctx.createRadialGradient(cx - r*0.2, cy - r*0.25, r*0.05, cx, cy, r);
  base.addColorStop(0.0, midColor);
  base.addColorStop(0.45, baseColor);
  base.addColorStop(1.0, darkColor);
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

  // 상단 하이라이트
  const hl = ctx.createRadialGradient(cx - r*0.3, cy - r*0.35, 0, cx - r*0.15, cy - r*0.2, r*0.6);
  hl.addColorStop(0.0, 'rgba(255,255,255,0.7)');
  hl.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  hl.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
}

function drawPropeller(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = TEX * 0.42;
  const bw = TEX * 0.10;
  ctx.save();

  // 1. 회전 바람 글로우 배경
  const windGlow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.1);
  windGlow.addColorStop(0, 'rgba(152, 213, 205, 0.25)'); // 시안 민트
  windGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = windGlow;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2); ctx.fill();

  // 2. 4개의 세련된 날개 (Blades) 그리기
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.125;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    // 날개 내부 그라디언트 (시안 민트 -> 크림 반투명)
    const bladeGrad = ctx.createLinearGradient(0, 0, R * 0.9, 0);
    bladeGrad.addColorStop(0, 'rgba(152, 213, 205, 0.8)');
    bladeGrad.addColorStop(0.5, 'rgba(252, 250, 242, 0.6)');
    bladeGrad.addColorStop(1, 'rgba(226, 135, 67, 0.15)'); // 끝부분은 살짝 오렌지빛

    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = '#fcfaf2'; // 크림색 얇은 테두리
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    // 세련된 유선형 블레이드 형태
    ctx.bezierCurveTo(R * 0.3, -bw, R * 0.75, -bw * 0.8, R * 0.9, 0);
    ctx.bezierCurveTo(R * 0.7, bw * 0.8, R * 0.3, bw, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 블레이드 내부에 속도감을 주는 빗금선 1개
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(R * 0.25, 0);
    ctx.lineTo(R * 0.75, 0);
    ctx.stroke();

    ctx.restore();
  }

  // 3. 중앙 허브 (오렌지 골드 3D 구체)
  const hubR = R * 0.28;
  drawSphereCustom(ctx, cx, cy, hubR, '#E28743', '#F1A974', '#9E4F18');
  
  // 허브 아웃라인
  ctx.strokeStyle = '#fcfaf2';
  ctx.lineWidth = 2.0;
  ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, Math.PI * 2); ctx.stroke();

  ctx.restore();
}

/* ═══════════════════════════════════════════════
   TNT — 폭탄 (클래식 폭탄 커스텀 3D + 도화선 & TNT 텍스트)
═══════════════════════════════════════════════ */
function drawTNT(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = TEX * 0.38;
  ctx.save();

  // 1. 은은한 배경 광원
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
  glow.addColorStop(0, 'rgba(226, 135, 67, 0.25)'); // 오렌지/골드 포인트 색상
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill();

  // 2. 도화선 그리기 (폭탄 머리 위)
  ctx.strokeStyle = '#e28743'; // 오렌지 골드
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // 밸브에서 위-오른쪽으로 휘어지는 도화선
  ctx.moveTo(cx, cy - R * 0.7);
  ctx.bezierCurveTo(cx + R * 0.2, cy - R * 1.1, cx + R * 0.5, cy - R * 0.9, cx + R * 0.65, cy - R * 1.15);
  ctx.stroke();

  // 3. 도화선 끝 불꽃 스파크
  const fx = cx + R * 0.65;
  const fy = cy - R * 1.15;
  // 노란색/오렌지색 불꽃 그라디언트
  const fireGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, R * 0.35);
  fireGlow.addColorStop(0, '#ffffff');
  fireGlow.addColorStop(0.4, '#f1a974');
  fireGlow.addColorStop(1, 'rgba(226, 135, 67, 0)');
  ctx.fillStyle = fireGlow;
  ctx.beginPath(); ctx.arc(fx, fy, R * 0.35, 0, Math.PI*2); ctx.fill();

  // 반짝이 스파크 모양 선
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(angle) * R * 0.22, fy + Math.sin(angle) * R * 0.22);
    ctx.stroke();
  }

  // 4. 폭탄 머리 밸브 (마개)
  ctx.fillStyle = '#4A342E';
  ctx.strokeStyle = '#e28743';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - R * 0.22, cy - R * 0.78, R * 0.44, R * 0.16, R * 0.04);
  ctx.fill();
  ctx.stroke();

  // 5. 폭탄 몸체 (더스티 로즈우드 계열 3D 구체)
  drawSphereCustom(ctx, cx, cy, R * 0.65, '#4E3029', '#7C534B', '#2B1713');
  // 아웃라인
  ctx.strokeStyle = '#e28743';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.65, 0, Math.PI * 2); ctx.stroke();

  // 6. 폭탄 표면에 골드로 "TNT" 기하학적 폰트 각인
  ctx.fillStyle = '#fcfaf2'; // 크림 아이보리
  ctx.font = `bold ${R * 0.3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TNT', cx, cy + R * 0.05);

  ctx.restore();
}

/* ═══════════════════════════════════════════════
   COLOR_BOMB — 갤럭시 볼 (은하 나선 + 블랙홀 코어)
═══════════════════════════════════════════════ */
function drawColorBomb(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const R = TEX * 0.38;
  const RAYS = 8;
  const rayColors = [
    '#ff3d00', '#ff9100', '#ffd600', '#00e676',
    '#00b0ff', '#2979ff', '#651fff', '#f50057',
  ];

  // 1. 외부 무지개 안개 오로라 글로우
  const outerG = ctx.createRadialGradient(cx, cy, R*0.4, cx, cy, R*1.65);
  outerG.addColorStop(0, 'rgba(101, 31, 255, 0)');
  outerG.addColorStop(0.4, 'rgba(101, 31, 255, 0.35)');
  outerG.addColorStop(0.85, 'rgba(0, 176, 255, 0.15)');
  outerG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerG;
  ctx.beginPath(); ctx.arc(cx, cy, R*1.65, 0, Math.PI*2); ctx.fill();

  // 2. 8방향 선명한 은하 빔
  for (let i = 0; i < RAYS; i++) {
    const ang = (i / RAYS) * Math.PI * 2 - Math.PI * 0.5;
    const tipX = cx + Math.cos(ang) * R * 1.45;
    const tipY = cy + Math.sin(ang) * R * 1.45;
    const rayW = R * 0.16;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const rg = ctx.createLinearGradient(0, 0, R*1.45, 0);
    rg.addColorStop(0, 'rgba(255,255,255,0.85)');
    rg.addColorStop(0.35, rayColors[i] + 'EE');
    rg.addColorStop(0.7, rayColors[i] + '55');
    rg.addColorStop(1, rayColors[i] + '00');
    ctx.fillStyle = rg;
    
    ctx.beginPath();
    ctx.moveTo(0, -rayW * 0.05);
    ctx.lineTo(R*1.45, -rayW * 0.4);
    ctx.lineTo(R*1.45, rayW * 0.4);
    ctx.lineTo(0, rayW * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 빔 끝 미세 스파크
    const spkG = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, TEX*0.065);
    spkG.addColorStop(0, rayColors[i] + 'FF');
    spkG.addColorStop(0.5, rayColors[i] + '66');
    spkG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spkG;
    ctx.beginPath(); ctx.arc(tipX, tipY, TEX*0.065, 0, Math.PI*2); ctx.fill();
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


const _texCache = new Map<string, THREE.CanvasTexture>();

/* ── 텍스처 생성 (일반 + 특수) ── */
function createSymbolTexture(shape: string): THREE.CanvasTexture {
  if (_texCache.has(shape)) {
    return _texCache.get(shape)!;
  }

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
  _texCache.set(shape, texture);   // ← 캐시에 저장 (누락 버그 수정)
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
