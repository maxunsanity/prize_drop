/**
 * ambientSystem.ts — 배경 분위기 시스템
 * FX.md §9 배경 레이어 + 보드 프레임 글로우 + 앰비언트 파티클
 */

import * as THREE from 'three';
import { GRID_ROWS, GRID_COLS, BLOCK_UNIT } from '../game/BoardCore.js';

const BOARD_W = GRID_COLS * BLOCK_UNIT;
const BOARD_H = GRID_ROWS * BLOCK_UNIT;

/* ── 앰비언트 파티클 (카드 먼지) ── */
export interface AmbientParticleSystem {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
}

function createAmbientParticles(scene: THREE.Scene, count = 50): AmbientParticleSystem {
  const positions  = new Float32Array(count * 3);
  const colors     = new Float32Array(count * 3);
  const sizes      = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // 초기 위치: 보드 전체에 랜덤 배치
    positions[i*3+0] = (Math.random() - 0.5) * BOARD_W;
    positions[i*3+1] = (Math.random() - 0.5) * BOARD_H;
    positions[i*3+2] = 0.2;
    // 황금빛 먼지
    colors[i*3+0] = 0.9 + Math.random() * 0.1;
    colors[i*3+1] = 0.8 + Math.random() * 0.15;
    colors[i*3+2] = 0.3 + Math.random() * 0.3;
    sizes[i] = 0.02 + Math.random() * 0.04;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = 1;
  scene.add(points);

  // 드리프트 속도
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    velocities[i*3+0] = (Math.random() - 0.5) * 0.004;
    velocities[i*3+1] = 0.005 + Math.random() * 0.010;  // 위로 흘러가기
    velocities[i*3+2] = 0;
  }

  return { points, positions, velocities };
}

function tickAmbientParticles(sys: AmbientParticleSystem): void {
  const count = sys.positions.length / 3;
  const posAttr = sys.points.geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let i = 0; i < count; i++) {
    sys.positions[i*3+0] += sys.velocities[i*3+0];
    sys.positions[i*3+1] += sys.velocities[i*3+1];

    // 화면 상단 탈출 → 하단 리스폰
    if (sys.positions[i*3+1] > BOARD_H / 2 + 0.5) {
      sys.positions[i*3+1] = -BOARD_H / 2 - 0.5;
      sys.positions[i*3+0] = (Math.random() - 0.5) * BOARD_W;
    }
    posAttr.setXYZ(i, sys.positions[i*3+0], sys.positions[i*3+1], 0.2);
  }
  posAttr.needsUpdate = true;
}

/* ── 보드 프레임 글로우 ── */
export interface FrameGlow {
  mesh: THREE.Mesh;
  innerMesh: THREE.Mesh;
  elapsed: number;
  comboFlash: number; // 0~1, 콤보 시 1.0에서 감소
}

function createFrameGlow(scene: THREE.Scene): FrameGlow {
  const pad = 0.15;
  const w = BOARD_W + pad * 2;
  const h = BOARD_H + pad * 2;

  // 외곽 골드 글로우 플레인 (보더 시뮬레이션)
  const geo = new THREE.PlaneGeometry(w + 0.5, h + 0.5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf5a623,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -0.05);
  mesh.renderOrder = 0;
  scene.add(mesh);

  // 내부 격자 오버레이 (미세한 라인 질감)
  const innerGeo = new THREE.PlaneGeometry(w, h);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03,
    depthWrite: false,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.position.set(0, 0, -0.06);
  innerMesh.renderOrder = 0;
  scene.add(innerMesh);

  return { mesh, innerMesh, elapsed: 0, comboFlash: 0 };
}

function tickFrameGlow(fg: FrameGlow, dt: number): void {
  fg.elapsed += dt;
  const mat = fg.mesh.material as THREE.MeshBasicMaterial;

  // 2.0s 맥동 idle
  const pulse = 0.4 + 0.3 * Math.abs(Math.sin(fg.elapsed * Math.PI / 2.0));

  // 콤보 플래시 감소
  fg.comboFlash = Math.max(0, fg.comboFlash - dt * 3.0);

  mat.opacity = pulse * 0.06 + fg.comboFlash * 0.15;
}

/* ── 코너 장식 (칩 이모티콘 CSS2D) ── */
// 카지노 칩 장식은 CSS로 처리 (Three.js CSS2D 추가 시 복잡도 증가)

/* ── AmbientSystem 메인 클래스 ── */
export class AmbientSystem {
  scene: THREE.Scene;
  ambientParticles: AmbientParticleSystem | null = null;
  frameGlow: FrameGlow | null = null;
  elapsed = 0;
  private _particleFrame = 0; // 앰비언트 파티클 프레임 카운터

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  init(): void {
    this.ambientParticles = createAmbientParticles(this.scene, 40); // 50 → 40 (20% 절약)
    this.frameGlow = createFrameGlow(this.scene);
  }

  /** 콤보 발생 시 프레임 플래시 */
  onCombo(_combo: number): void {
    if (this.frameGlow) {
      this.frameGlow.comboFlash = 1.0;
    }
  }

  tick(dt: number): void {
    this.elapsed += dt;
    // 앰비언트 파티클 — 2프레임에 1번만 GPU 업로드 (느린 먼지라 티 안 남)
    this._particleFrame++;
    if (this.ambientParticles && (this._particleFrame & 1) === 0) {
      tickAmbientParticles(this.ambientParticles);
    }
    if (this.frameGlow) tickFrameGlow(this.frameGlow, dt);
  }

  dispose(): void {
    if (this.ambientParticles) {
      this.scene.remove(this.ambientParticles.points);
      this.ambientParticles.points.geometry.dispose();
      (this.ambientParticles.points.material as THREE.Material).dispose();
    }
    if (this.frameGlow) {
      this.scene.remove(this.frameGlow.mesh);
      this.scene.remove(this.frameGlow.innerMesh);
      (this.frameGlow.mesh.material as THREE.Material).dispose();
      (this.frameGlow.innerMesh.material as THREE.Material).dispose();
    }
  }
}
