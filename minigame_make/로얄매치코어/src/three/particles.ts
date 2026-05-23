/**
 * particles.ts — FX.md §2 파티클 시스템 전면 구현
 * §2.1 타임라인: burst → 물리(중력/velocity/lifetime fade/scale shrink)
 * §2.4 단일 THREE.Points 메시 (드로우콜 최소화)
 */

import * as THREE from 'three';

/* ── 상수 ── */
const MAX_PARTICLES = 400;
const GRAVITY       = 0.0015; // per-frame 중력 (FX.md §2.3)

/* ── 파티클 데이터 구조체 ── */
interface Particle {
  active:   boolean;
  lifetime: number;   // 총 수명(초)
  age:      number;   // 경과 시간(초)
  vx:       number;
  vy:       number;
  size:     number;   // 초기 size
}

/* ── ParticlePool ── */
export class ParticlePool {
  readonly mesh:      THREE.Points;
  readonly particles: Particle[];

  // BufferAttribute 참조 (직접 접근)
  readonly posArr:  Float32Array;
  readonly colArr:  Float32Array;
  readonly sizeArr: Float32Array;

  constructor(mesh: THREE.Points, posArr: Float32Array, colArr: Float32Array, sizeArr: Float32Array) {
    this.mesh     = mesh;
    this.posArr   = posArr;
    this.colArr   = colArr;
    this.sizeArr  = sizeArr;

    this.particles = Array.from({ length: MAX_PARTICLES }, (): Particle => ({
      active:   false,
      lifetime: 0,
      age:      0,
      vx:       0,
      vy:       0,
      size:     0.08,
    }));
  }
}

/* ── createParticlePool ── */
export function createParticlePool(scene: THREE.Scene): ParticlePool {
  const geometry = new THREE.BufferGeometry();

  const posArr  = new Float32Array(MAX_PARTICLES * 3);
  const colArr  = new Float32Array(MAX_PARTICLES * 3);
  const sizeArr = new Float32Array(MAX_PARTICLES);

  // 비활성 파티클은 화면 밖으로
  for (let i = 0; i < MAX_PARTICLES; i++) {
    posArr[i * 3]     = -999;
    posArr[i * 3 + 1] = -999;
    posArr[i * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(posArr,  3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colArr,  3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizeArr, 1));

  const material = new THREE.PointsMaterial({
    vertexColors:    true,
    blending:        THREE.AdditiveBlending,
    depthWrite:      false,
    sizeAttenuation: true,
    size:            0.08,
    transparent:     true,
  });

  const points        = new THREE.Points(geometry, material);
  points.renderOrder  = 5;

  scene.add(points);

  return new ParticlePool(points, posArr, colArr, sizeArr);
}

/* ── 유틸: hex → THREE.Color 분해 ── */
function hexToRGB(hex: number): [number, number, number] {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8)  & 0xff) / 255;
  const b = (hex         & 0xff) / 255;
  return [r, g, b];
}

/* ── 슬롯 탐색 (비활성 파티클 인덱스 반환) ── */
function findFreeSlot(pool: ParticlePool): number {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (!pool.particles[i].active) return i;
  }
  return -1; // 가득 찬 경우
}

/* ── burstAtBlock ── */
export function burstAtBlock(
  pool:   ParticlePool,
  wx:     number,
  wy:     number,
  colorA: number,
  colorB: number,
  count:  number,
): void {
  const [rA, gA, bA] = hexToRGB(colorA);
  const [rB, gB, bB] = hexToRGB(colorB);

  for (let n = 0; n < count; n++) {
    const idx = findFreeSlot(pool);
    if (idx < 0) break;

    const p = pool.particles[idx];

    // 360도 방사
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.06; // 0.04~0.10

    p.active   = true;
    p.age      = 0;
    p.lifetime = 0.35 + Math.random() * 0.35;  // 0.35~0.70s
    p.vx       = Math.cos(angle) * speed;
    p.vy       = Math.sin(angle) * speed;
    p.size     = 0.08 + Math.random() * 0.10;  // 0.08~0.18

    // 위치
    pool.posArr[idx * 3]     = wx;
    pool.posArr[idx * 3 + 1] = wy;
    pool.posArr[idx * 3 + 2] = 0.05;

    // colorA/B 사이 랜덤 보간
    const t = Math.random();
    pool.colArr[idx * 3]     = rA + (rB - rA) * t;
    pool.colArr[idx * 3 + 1] = gA + (gB - gA) * t;
    pool.colArr[idx * 3 + 2] = bA + (bB - bA) * t;

    pool.sizeArr[idx] = p.size;
  }

  // 버퍼 업데이트 플래그
  const geo = pool.mesh.geometry;
  (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  (geo.getAttribute('color')    as THREE.BufferAttribute).needsUpdate = true;
  (geo.getAttribute('size')     as THREE.BufferAttribute).needsUpdate = true;
}

/* ── tickParticlePool ── */
export function tickParticlePool(pool: ParticlePool, dt: number): void {
  let anyActive = false;

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = pool.particles[i];
    if (!p.active) continue;

    anyActive = true;
    p.age    += dt;

    if (p.age >= p.lifetime) {
      // 수명 종료 → 화면 밖으로 숨김
      p.active              = false;
      pool.posArr[i * 3]     = -999;
      pool.posArr[i * 3 + 1] = -999;
      pool.posArr[i * 3 + 2] = 0;
      pool.sizeArr[i]        = 0;
      continue;
    }

    // 중력 적용 (FX.md §2.3: 0.0015/frame → dt 기반으로 스케일)
    p.vy -= GRAVITY * (dt * 60); // 60fps 기준 정규화

    // 위치 업데이트
    pool.posArr[i * 3]     += p.vx;
    pool.posArr[i * 3 + 1] += p.vy;

    // lifetime fade → opacity를 size로 시뮬
    const lifeRatio = 1.0 - p.age / p.lifetime;
    pool.sizeArr[i] = p.size * lifeRatio; // scale shrink + fade
  }

  if (anyActive) {
    const geo = pool.mesh.geometry;
    (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute('size')     as THREE.BufferAttribute).needsUpdate = true;
  }
}
