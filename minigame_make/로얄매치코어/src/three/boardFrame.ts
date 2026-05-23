/**
 * boardFrame.ts — 카지노 테이블 배경 + 골드 프레임 + 코너 수트
 * DESIGN.md §Casino Felt / FX.md §9 배경 레이어 구성
 */

import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GRID_ROWS, GRID_COLS, BLOCK_UNIT } from '../game/BoardCore.js';

const BOARD_W   = GRID_COLS * BLOCK_UNIT;
const BOARD_H   = GRID_ROWS * BLOCK_UNIT;
const FRAME_PAD = 0.22;
const FRAME_THICK = 0.10;

/* ── Felt 배경 ShaderMaterial ── */
const FELT_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

const FELT_FRAG = /* glsl */`
precision mediump float;
uniform float uTime;
varying vec2 vUv;

void main() {
  // ── 기본 카지노 펠트 그린 ──
  vec3 feltBase  = vec3(0.055, 0.235, 0.148);  // #0e3d26
  vec3 feltDark  = vec3(0.020, 0.110, 0.066);  // #051c11

  // ── 헤링본 직물 패턴 ──
  vec2 uv = vUv * vec2(28.0, 28.0);           // 패턴 스케일
  float diag1 = abs(fract((uv.x + uv.y) * 0.5) - 0.5);
  float diag2 = abs(fract((uv.x - uv.y) * 0.5) - 0.5);
  float weave = min(diag1, diag2);
  float fabric = smoothstep(0.0, 0.18, weave) * 0.08; // 미세 음영

  // ── 중앙 스팟라이트 ──
  vec2 centered = vUv - 0.5;
  float spotlight = 1.0 - length(centered) * 1.4;
  spotlight = clamp(spotlight, 0.0, 1.0);
  spotlight = pow(spotlight, 1.8) * 0.18;

  // ── 엣지 비네팅 ──
  float vignette = 1.0 - pow(length(centered) * 1.3, 2.5) * 0.6;
  vignette = clamp(vignette, 0.2, 1.0);

  // ── 느리게 흐르는 먼지 텍스처 (time 기반) ──
  float dustX = fract(vUv.x * 50.0 + uTime * 0.02);
  float dustY = fract(vUv.y * 50.0 + uTime * 0.015);
  float dust  = step(0.98, dustX) * step(0.98, dustY) * 0.04;

  vec3 col = mix(feltDark, feltBase, vignette + spotlight);
  col += fabric;
  col += dust * vec3(0.9, 0.85, 0.3);

  gl_FragColor = vec4(col, 1.0);
}`;

/* ── 골드 테두리 ShaderMaterial ── */
const FRAME_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

const FRAME_FRAG = /* glsl */`
precision mediump float;
uniform float uTime;
uniform float uFlash;   // 콤보 시 flash
varying vec2 vUv;
void main() {
  // 골드 그라디언트
  float y     = vUv.y;
  vec3  gold  = mix(vec3(0.72, 0.40, 0.04), vec3(0.98, 0.75, 0.20), y);

  // idle 맥동 (2s 주기)
  float pulse = 0.55 + 0.15 * abs(sin(uTime * 1.571));  // π/2

  // 콤보 플래시
  float flash = uFlash;

  gl_FragColor = vec4(gold * (pulse + flash), pulse + flash * 0.3);
}`;

/* ── BoardFrame 클래스 ── */
export class BoardFrame {
  group   = new THREE.Group();
  feltMat!: THREE.ShaderMaterial;
  frameMats: THREE.ShaderMaterial[] = [];
  comboFlash = 0;

  init(scene: THREE.Scene): void {
    /* ── 1. Felt 배경 ── */
    // 30×30: 어떤 카메라 뷰에서도 전체 커버 (portrait 최대 ±14 유닛 세로)
    const feltGeo = new THREE.PlaneGeometry(30, 30);
    this.feltMat  = new THREE.ShaderMaterial({
      vertexShader:   FELT_VERT,
      fragmentShader: FELT_FRAG,
      uniforms: { uTime: { value: 0 } },
    });
    const felt = new THREE.Mesh(feltGeo, this.feltMat);
    felt.position.z = -0.4;
    felt.renderOrder = -2;
    this.group.add(felt);

    /* ── 2. 보드 어두운 배경 패드 ── */
    const padGeo = new THREE.PlaneGeometry(BOARD_W + FRAME_PAD*2 + 0.1, BOARD_H + FRAME_PAD*2 + 0.1);
    const padMat = new THREE.MeshBasicMaterial({ color: 0x020c07 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.z = -0.25;
    pad.renderOrder = -1;
    this.group.add(pad);

    /* ── 3. 골드 프레임 (4변) ── */
    const fW = BOARD_W + FRAME_PAD * 2;
    const fH = BOARD_H + FRAME_PAD * 2;
    const bars = [
      { w: fW + FRAME_THICK, h: FRAME_THICK, x: 0,         y:  fH/2  },  // top
      { w: fW + FRAME_THICK, h: FRAME_THICK, x: 0,         y: -fH/2  },  // bottom
      { w: FRAME_THICK,      h: fH,          x: -fW/2,     y:  0     },  // left
      { w: FRAME_THICK,      h: fH,          x:  fW/2,     y:  0     },  // right
    ];
    bars.forEach(({ w, h, x, y }) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.ShaderMaterial({
        vertexShader:   FRAME_VERT,
        fragmentShader: FRAME_FRAG,
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, -0.1);
      mesh.renderOrder = 1;
      this.group.add(mesh);
      this.frameMats.push(mat);
    });

    /* ── 4. 코너 글로우 ── */
    const cornerPositions = [
      [-fW/2, fH/2], [fW/2, fH/2], [-fW/2, -fH/2], [fW/2, -fH/2],
    ] as [number, number][];
    const suits = ['♠', '♥', '♦', '♣'];
    const suitColors = ['#60a5fa', '#f87171', '#f87171', '#4ade80'];

    cornerPositions.forEach(([cx, cy], i) => {
      // 발광 원
      const dotGeo = new THREE.CircleGeometry(0.14, 20);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xf5a623,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(cx, cy, -0.08);
      dot.renderOrder = 1;
      this.group.add(dot);

      // CSS2D 수트 심볼
      const div = document.createElement('div');
      div.textContent = suits[i];
      div.style.cssText = `
        font-size: 14px;
        color: ${suitColors[i]};
        pointer-events: none;
        text-shadow: 0 0 6px rgba(245,166,35,0.6);
        line-height: 1;
      `;
      const label = new CSS2DObject(div);
      label.position.set(cx, cy, 0);
      this.group.add(label);
    });

    /* ── 5. 내부 그리드 격자선 (0.03 opacity) ── */
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.03,
    });
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = (4 - r + 0.5) * BLOCK_UNIT;
      const pts = [
        new THREE.Vector3(-BOARD_W/2, y, -0.02),
        new THREE.Vector3( BOARD_W/2, y, -0.02),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.group.add(new THREE.Line(geo, lineMat));
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      const x = (c - 4 - 0.5) * BLOCK_UNIT;
      const pts = [
        new THREE.Vector3(x, -BOARD_H/2, -0.02),
        new THREE.Vector3(x,  BOARD_H/2, -0.02),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.group.add(new THREE.Line(geo, lineMat));
    }

    scene.add(this.group);
  }

  /** 콤보 발생 시 프레임 flash */
  onCombo(): void {
    this.comboFlash = 1.0;
  }

  tick(dt: number, elapsed: number): void {
    this.feltMat.uniforms['uTime'].value = elapsed;
    this.comboFlash = Math.max(0, this.comboFlash - dt * 4.0);
    this.frameMats.forEach(mat => {
      mat.uniforms['uTime'].value  = elapsed;
      mat.uniforms['uFlash'].value = this.comboFlash;
    });
  }

  dispose(): void {
    this.feltMat.dispose();
    this.frameMats.forEach(m => m.dispose());
  }
}

export const boardFrame = new BoardFrame();
