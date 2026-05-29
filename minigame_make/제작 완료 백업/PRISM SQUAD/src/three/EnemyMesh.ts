/**
 * EnemyMesh.ts — 적 Three.js 메쉬 팩토리
 * enemy_config.csv geometry_type / color_hex 기반으로 생성
 */
import * as THREE from 'three';
import type { EnemyConfig, BossConfig } from '../game/data';

export interface EnemyMeshHandle {
  group: THREE.Group;
  updateHp(pct: number): void;
  updateDirection(vx: number, vy: number): void;
  flashHit(): void;
  tick(dt: number): void;
  dispose(scene: THREE.Scene): void;
}

const _tmpColor = new THREE.Color();

/* ── 적 메쉬 생성 ── */
export function createEnemyMesh(cfg: EnemyConfig, scene: THREE.Scene): EnemyMeshHandle {
  const group = new THREE.Group();
  const col = new THREE.Color(cfg.color_hex);
  const r = cfg.radius;

  /* 본체 Geometry */
  let geo: THREE.BufferGeometry;
  switch (cfg.geometry_type) {
    case 'ConeGeometry_flat':
      geo = new THREE.ConeGeometry(r, r * 1.2, 3); break;
    case 'CylinderGeometry':
      geo = new THREE.CylinderGeometry(r, r, r * 0.7, 6); break;
    case 'BoxGeometry':
      geo = new THREE.BoxGeometry(r * 1.4, r * 1.4, r * 0.5); break;
    default: // ConeGeometry
      geo = new THREE.ConeGeometry(r, r * 2, 3); break;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: cfg.has_glow ? new THREE.Color(cfg.glow_color_hex) : col,
    emissiveIntensity: cfg.has_glow ? 0.5 : 0.15,
    roughness: 0.5,
  });
  const body = new THREE.Mesh(geo, mat);
  /* ConeGeometry 기본 방향이 +Y → Z 평면 눕힘 */
  if (cfg.geometry_type === 'ConeGeometry' || cfg.geometry_type === 'ConeGeometry_flat') {
    body.rotation.z = -Math.PI / 2; // 옆으로 눕혀서 진행 방향으로 회전
  }
  group.add(body);

  /* 글로우 포인트라이트 */
  if (cfg.has_glow) {
    const light = new THREE.PointLight(new THREE.Color(cfg.glow_color_hex), 0.8, r * 5);
    group.add(light);
  }

  scene.add(group);

  /* 피격 플래시용 타이머 */
  let flashTimer = 0;

  return {
    group,
    updateHp(pct: number) {
      // 일반 몬스터는 HP바 비표시 정책
      void pct;
    },
    updateDirection(vx: number, vy: number) {
      if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;
      group.rotation.z = Math.atan2(vy, vx);
    },
    flashHit() { flashTimer = 0.1; },
    tick(dt: number) {
      if (flashTimer > 0) {
        flashTimer -= dt;
        mat.emissive.set(flashTimer > 0 ? 0xffffff : (cfg.has_glow ? cfg.glow_color_hex : cfg.color_hex));
        mat.emissiveIntensity = flashTimer > 0 ? 1.5 : (cfg.has_glow ? 0.5 : 0.15);
      }
    },
    dispose(s: THREE.Scene) { s.remove(group); },
  };
}

/* ── 보스 메쉬 생성 ── */
export function createBossMesh(cfg: BossConfig, scene: THREE.Scene): EnemyMeshHandle {
  const group = new THREE.Group();
  const col = new THREE.Color(cfg.color_hex);
  const glowCol = new THREE.Color(cfg.glow_color_hex);
  const r = cfg.radius;

  /* 외부 링 (TorusGeometry) */
  const torusGeo = new THREE.TorusGeometry(r, r * 0.22, 8, 24);
  const torusMat = new THREE.MeshStandardMaterial({
    color: col, emissive: glowCol, emissiveIntensity: 0.7, roughness: 0.3,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  group.add(torus);

  /* 가시 돌기 (8개 작은 박스가 공전) */
  const spikeGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spikeGeo = new THREE.BoxGeometry(r * 0.15, r * 0.5, r * 0.15);
    const spikeMat = new THREE.MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: 1.0 });
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(Math.cos(angle) * (r + r * 0.4), Math.sin(angle) * (r + r * 0.4), 0);
    spike.rotation.z = angle;
    spikeGroup.add(spike);
  }
  group.add(spikeGroup);

  /* 강한 퍼플 글로우 */
  const light = new THREE.PointLight(glowCol, 2.5, r * 8);
  group.add(light);

  /* HP 바 (보스는 더 길게) */
  const barW = r * 3.5;
  const barH = r * 0.22;
  const bgGeo = new THREE.PlaneGeometry(barW, barH);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x330033, transparent: true, opacity: 0.8 });
  const hpBg = new THREE.Mesh(bgGeo, bgMat);
  hpBg.position.set(0, r * 1.8, 1);
  group.add(hpBg);

  const fillGeo = new THREE.PlaneGeometry(barW, barH);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x9955FF });
  const hpFill = new THREE.Mesh(fillGeo, fillMat);
  hpFill.position.set(0, r * 1.8, 2);
  group.add(hpFill);

  scene.add(group);

  let flashTimer = 0;
  let spikeAngle = 0;

  return {
    group,
    updateHp(pct: number) {
      hpFill.scale.x = Math.max(pct, 0.01);
      hpFill.position.x = -barW * (1 - pct) / 2;
    },
    updateDirection(_vx: number, _vy: number) { /* 보스는 방향 무관 */ },
    flashHit() { flashTimer = 0.08; },
    tick(dt: number) {
      /* 가시 공전 */
      spikeAngle += dt * 1.2;
      spikeGroup.rotation.z = spikeAngle;
      /* 피격 플래시 */
      if (flashTimer > 0) {
        flashTimer -= dt;
        torusMat.emissive.set(flashTimer > 0 ? 0xffffff : cfg.glow_color_hex);
        torusMat.emissiveIntensity = flashTimer > 0 ? 2.0 : 0.7;
      }
    },
    dispose(s: THREE.Scene) { s.remove(group); },
  };
}

/* ── XP 드롭 메쉬 ── */
export function createXpMesh(color: string, size: number, scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(size, 6, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
}

/* ── 독 웅덩이 메쉬 ── */
export function createPuddleMesh(radius: number, scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x33FF66, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -0.5;
  scene.add(mesh);
  return mesh;
}

/* ── 스피터 투사체 메쉬 ── */
export function createProjectileMesh(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(5, 6, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xFF44BB, emissive: 0xFF44BB, emissiveIntensity: 0.8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
}

/* ── 임시 색상 유틸 (재사용) ── */
export { _tmpColor };
