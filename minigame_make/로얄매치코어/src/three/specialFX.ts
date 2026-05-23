/**
 * specialFX.ts — 특수 블록 FX 시스템
 * FX.md §4 줄무늬 레이저, §5 봉지 폭탄, §6 컬러밤
 */

import * as THREE from 'three';
import { GRID_ROWS, GRID_COLS, BLOCK_UNIT } from '../game/BoardCore.js';
import type { Block } from '../game/BoardCore.js';
import { burstAtBlock } from './particles.js';
import type { ParticlePool } from './particles.js';

/* ── 유틸 ── */
function gridToWorld(row: number, col: number): [number, number] {
  return [(col - 4) * BLOCK_UNIT, (4 - row) * BLOCK_UNIT];
}

/* ── 레이저 빔 (3-레이어) ── */
export interface LaserFX {
  meshes: THREE.Mesh[];
  elapsed: number;
  duration: number;
  done: boolean;
}

function makeLaserBeam(
  isHorizontal: boolean,
  row: number,
  col: number,
  blockColor: number,
  scene: THREE.Scene,
): LaserFX {
  const meshes: THREE.Mesh[] = [];

  // 빔 크기
  const boardSpan = isHorizontal
    ? GRID_COLS * BLOCK_UNIT + 0.5
    : GRID_ROWS * BLOCK_UNIT + 0.5;

  const [cx, cy] = gridToWorld(row, col);

  const layers = [
    { thick: 0.04, color: 0xffffff, opacity: 0.95 }, // 코어
    { thick: 0.18, color: blockColor, opacity: 0.50 }, // 글로우
    { thick: 0.36, color: blockColor, opacity: 0.20 }, // 소프트 페더
  ];

  layers.forEach(({ thick, color, opacity }) => {
    const w = isHorizontal ? boardSpan : thick;
    const h = isHorizontal ? thick     : boardSpan;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, 0.6);
    mesh.renderOrder = 6;
    scene.add(mesh);
    meshes.push(mesh);
  });

  return { meshes, elapsed: 0, duration: 0.22, done: false };
}

/* ── 봉지 폭발 스피어 ── */
export interface WrappedFX {
  sphere: THREE.Mesh;
  elapsed: number;
  phase: 1 | 2;
  done: boolean;
}

function makeWrappedSphere(
  wx: number,
  wy: number,
  blockColor: number,
  scene: THREE.Scene,
): WrappedFX {
  const geo = new THREE.SphereGeometry(0.5, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: blockColor,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const sphere = new THREE.Mesh(geo, mat);
  sphere.position.set(wx, wy, 0.3);
  sphere.renderOrder = 5;
  scene.add(sphere);
  return { sphere, elapsed: 0, phase: 1, done: false };
}

/* ── COLOR_BOMB 스파크 아크 ── */
export interface ArcFX {
  lines: THREE.Line[];
  elapsed: number;
  duration: number;
  done: boolean;
  targets: { wx: number; wy: number }[];
  srcX: number;
  srcY: number;
}

function makeColorBombArcs(
  srcX: number,
  srcY: number,
  targets: { wx: number; wy: number }[],
  scene: THREE.Scene,
): ArcFX {
  const lines: THREE.Line[] = [];

  targets.forEach(({ wx, wy }) => {
    const points = generateZigzagPoints(srcX, srcY, wx, wy, 6);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 7;
    scene.add(line);
    lines.push(line);
  });

  return { lines, elapsed: 0, duration: 0.15, done: false, targets, srcX, srcY };
}

function generateZigzagPoints(
  x1: number, y1: number,
  x2: number, y2: number,
  segments: number,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 0.2;
    const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 0.2;
    pts.push(new THREE.Vector3(x, y, 0.5));
  }
  return pts;
}

/* ── SpecialFXSystem 메인 클래스 ── */
export class SpecialFXSystem {
  scene: THREE.Scene;
  laserFXs: LaserFX[] = [];
  wrappedFXs: WrappedFX[] = [];
  arcFXs: ArcFX[] = [];
  particlePool: ParticlePool | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setParticlePool(pool: ParticlePool): void {
    this.particlePool = pool;
  }

  /* ── 레이저 발사 ── */
  fireLaser(block: Block): void {
    const [cx, cy] = gridToWorld(block.row, block.col);
    const isH = block.kind === 'STRIPED_H';
    const color = 0xffffff; // blockConfigs에서 실제 색은 board3d에서 넘겨줄 것
    const fx = makeLaserBeam(isH, block.row, block.col, color, this.scene);
    this.laserFXs.push(fx);

    // 레이저 퍼짐 파티클
    if (this.particlePool) {
      const pool = this.particlePool;
      for (let i = 0; i < (isH ? GRID_COLS : GRID_ROWS); i++) {
        const [wx, wy] = isH
          ? gridToWorld(block.row, i)
          : gridToWorld(i, block.col);
        setTimeout(() => {
          burstAtBlock(pool, wx, wy, 0xffffff, color, 4);
        }, i * 15);
      }
    }
    void cx; void cy;
  }

  fireLaserColor(block: Block, blockColor: number): void {
    const isH = block.kind === 'STRIPED_H';
    const fx = makeLaserBeam(isH, block.row, block.col, blockColor, this.scene);
    this.laserFXs.push(fx);
  }

  /* ── WRAPPED 폭발 ── */
  explodeWrapped(block: Block, blockColor: number): void {
    const [wx, wy] = gridToWorld(block.row, block.col);
    const fx = makeWrappedSphere(wx, wy, blockColor, this.scene);
    this.wrappedFXs.push(fx);
  }

  /* ── COLOR_BOMB 아크 ── */
  fireColorBombArcs(block: Block, targets: Block[]): void {
    const [srcX, srcY] = gridToWorld(block.row, block.col);
    const mapped = targets.map(t => {
      const [wx, wy] = gridToWorld(t.row, t.col);
      return { wx, wy };
    });
    const fx = makeColorBombArcs(srcX, srcY, mapped, this.scene);
    this.arcFXs.push(fx);
  }

  /* ── 매 프레임 업데이트 ── */
  tick(dt: number): void {
    this._tickLasers(dt);
    this._tickWrapped(dt);
    this._tickArcs(dt);
  }

  private _tickLasers(dt: number): void {
    this.laserFXs = this.laserFXs.filter(fx => {
      fx.elapsed += dt;
      const t = Math.min(1, fx.elapsed / fx.duration);

      // 레이저 fade-in (0~30%) + fade-out (70~100%)
      let alpha: number;
      if (t < 0.3) {
        alpha = t / 0.3;
      } else if (t < 0.7) {
        alpha = 1.0;
      } else {
        alpha = 1.0 - (t - 0.7) / 0.3;
      }

      fx.meshes.forEach((mesh, i) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const baseOpacities = [0.95, 0.50, 0.20];
        mat.opacity = baseOpacities[i] * alpha;
        // 빔 늘어나는 효과 (scale X)
        if (t < 0.5) {
          mesh.scale.x = t * 2;
        } else {
          mesh.scale.x = 1.0;
        }
      });

      if (fx.elapsed >= fx.duration) {
        fx.meshes.forEach(m => {
          this.scene.remove(m);
          (m.material as THREE.Material).dispose();
          m.geometry.dispose();
        });
        fx.done = true;
        return false;
      }
      return true;
    });
  }

  private _tickWrapped(dt: number): void {
    this.wrappedFXs = this.wrappedFXs.filter(fx => {
      fx.elapsed += dt;

      // 1차 폭발: scale 0→3 → 소멸 (150ms)
      const phase1Duration = 0.15;
      const mat = fx.sphere.material as THREE.MeshBasicMaterial;

      if (fx.phase === 1) {
        const t = Math.min(1, fx.elapsed / phase1Duration);
        // ease-out scale
        const s = 3.0 * (1 - Math.pow(1 - t, 3));
        fx.sphere.scale.setScalar(s);
        mat.opacity = 0.6 * (1 - t * t);

        if (fx.elapsed >= phase1Duration) {
          this.scene.remove(fx.sphere);
          mat.dispose();
          fx.sphere.geometry.dispose();
          fx.done = true;
          return false;
        }
      }
      return true;
    });
  }

  private _tickArcs(dt: number): void {
    this.arcFXs = this.arcFXs.filter(fx => {
      fx.elapsed += dt;
      const t = Math.min(1, fx.elapsed / fx.duration);

      // 아크 지글거림 + fade
      fx.lines.forEach((line, i) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = 0.8 * (1 - t);

        // 포인트 흔들기
        if (Math.random() > 0.7) {
          const target = fx.targets[i];
          if (target) {
            const pts = generateZigzagPoints(fx.srcX, fx.srcY, target.wx, target.wy, 6);
            line.geometry.setFromPoints(pts);
          }
        }
      });

      if (fx.elapsed >= fx.duration) {
        fx.lines.forEach(l => {
          this.scene.remove(l);
          (l.material as THREE.Material).dispose();
          l.geometry.dispose();
        });
        fx.done = true;
        return false;
      }
      return true;
    });
  }

  dispose(): void {
    [...this.laserFXs, ...this.wrappedFXs].forEach(() => {});
    this.laserFXs = [];
    this.wrappedFXs = [];
    this.arcFXs = [];
  }
}

/* ── 콤보 링 FX (CSS2D 없이 Three.js로) ── */
export function createComboRing(
  scene: THREE.Scene,
  wx: number, wy: number,
  combo: number,
): void {
  const color = combo >= 5 ? 0xff6600 : combo >= 3 ? 0xf5a623 : 0xffffff;
  const geo = new THREE.RingGeometry(0.1, 0.3, 32);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.set(wx, wy, 0.4);
  ring.renderOrder = 5;
  scene.add(ring);

  const start = performance.now();
  const duration = 400;

  const tick = (): void => {
    const elapsed = performance.now() - start;
    const t = Math.min(1, elapsed / duration);
    const s = 1 + t * 3;
    ring.scale.setScalar(s);
    mat.opacity = 0.8 * (1 - t);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      scene.remove(ring);
      mat.dispose();
      geo.dispose();
    }
  };
  requestAnimationFrame(tick);
}

/* ── 보너스 타임 플래시 ── */
export function bonusTimeFlash(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(
    GRID_COLS * BLOCK_UNIT + 2,
    GRID_ROWS * BLOCK_UNIT + 2,
  );
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf5a623,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, 0.7);
  mesh.renderOrder = 7;
  scene.add(mesh);

  // pulse animation
  let t = 0;
  const tick = (): void => {
    t += 0.02;
    mat.opacity = 0.08 + Math.abs(Math.sin(t * 3)) * 0.12;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return mesh;
}
