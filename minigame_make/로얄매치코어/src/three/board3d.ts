/**
 * board3d.ts — Three.js 9x9 보드 렌더러
 * 특수 블록 4종 FX: COLOR_BOMB / STRIPED_H|V / PROPELLER / TNT
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { boardCore, GRID_ROWS, GRID_COLS, BLOCK_UNIT } from '../game/BoardCore.js';
import type { Block, BoardEvent, GamePhase } from '../game/BoardCore.js';
import type { BlockConfig } from '../game/data.js';

import { createBlockMaterial, tickBlockMaterials, BLOCK_RENDER_ORDER, SPECIAL_BG,
         createBlockerMaterial } from './blockMaterial.js';
import type { Blocker } from '../game/BoardCore.js';
import { createParticlePool, burstAtBlock, tickParticlePool } from './particles.js';
import type { ParticlePool } from './particles.js';
import { SpecialFXSystem, createComboRing } from './specialFX.js';
import { AmbientSystem } from './ambientSystem.js';
import { boardFrame } from './boardFrame.js';
import { audio, initAudio } from '../audio/audioSystem.js';

/* ── 상수 ── */
const BLOCK_SCALE = 0.88;
const CAM_HALF_W  = (GRID_COLS * BLOCK_UNIT) / 2 * 1.08;

/* ── grid → world 좌표 ── */
export function gridToWorld(row: number, col: number): [number, number] {
  return [(col - 4) * BLOCK_UNIT, (4 - row) * BLOCK_UNIT];
}

/* ── Ease 함수들 ── */
function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* ── Board3D 메인 클래스 ── */
export class Board3D {
  renderer!: THREE.WebGLRenderer;
  css2d!: CSS2DRenderer;
  scene!: THREE.Scene;
  camera!: THREE.OrthographicCamera;
  container!: HTMLElement;

  blockMeshes    = new Map<number, THREE.Mesh>();
  blockMaterials = new Map<number, THREE.ShaderMaterial>();
  blockerMeshes  = new Map<number, THREE.Mesh>();  // blocker id → mesh
  specialMeshIds = new Set<number>();              // 특수 블록 ID만 별도 추적 (오라 루프 최적화)
  blockConfigs: BlockConfig[] = [];
  configMap = new Map<string, BlockConfig>();

  particlePool!: ParticlePool;
  specialFX!: SpecialFXSystem;
  ambientSystem!: AmbientSystem;

  clock = new THREE.Clock();
  frameId = 0;
  disposed = false;

  swapAnim = {
    active: false,
    b1: null as THREE.Mesh | null,
    b2: null as THREE.Mesh | null,
    from1: new THREE.Vector3(), to1: new THREE.Vector3(),
    from2: new THREE.Vector3(), to2: new THREE.Vector3(),
    t: 0, duration: 0.18, back: false,
  };

  dropAnims: { mesh: THREE.Mesh; fromY: number; toY: number; t: number; landed: boolean }[] = [];
  camShake = { intensity: 0 };
  private _colorBombSrc = new THREE.Vector2();

  /* 슬로우 모션 */
  timeScale = 1.0;
  private _timeScaleTarget = 1.0;
  private _timeScaleRecoverAt = 0;

  /* ────────── 초기화 ────────── */
  init(container: HTMLElement, configs: BlockConfig[]): void {
    this.container = container;
    this.blockConfigs = configs;
    configs.forEach(c => this.configMap.set(c.blockType, c));

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'dd-board-canvas';

    this.css2d = new CSS2DRenderer();
    this.css2d.domElement.id = 'dd-lane-labels';
    // 콤보 레이블이 컨테이너 밖으로 나가지 않도록
    Object.assign(this.css2d.domElement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    container.appendChild(this.css2d.domElement);

    this.scene = new THREE.Scene();
    this._updateCamera();
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this.particlePool = createParticlePool(this.scene);
    this.specialFX    = new SpecialFXSystem(this.scene);
    this.specialFX.setParticlePool(this.particlePool);
    this.ambientSystem = new AmbientSystem(this.scene);
    this.ambientSystem.init();

    boardFrame.init(this.scene);
    this._buildBoard();
    boardCore.on(e => this._onBoardEvent(e));

    const ro = new ResizeObserver(() => this._onResize());
    ro.observe(container);
    this._onResize();

    initAudio();
    this._loop();
  }

  /* ────────── 카메라 ────────── */
  private _updateCamera(): void {
    const rect = this.container?.getBoundingClientRect() ?? { width: 390, height: 596 };
    // display:none 일 때 0×0 → 기본값으로 폴백
    const width  = rect.width  > 0 ? rect.width  : 390;
    const height = rect.height > 0 ? rect.height : 596;
    const aspect = width / height;
    // 보드(9×9)가 항상 완전히 보이도록:
    // - 세로가 더 긴 화면(portrait, aspect < 1): 가로 = CAM_HALF_W 고정
    // - 가로가 더 넓은 화면(landscape, aspect >= 1): 세로 = CAM_HALF_W 고정
    let camW: number, camH: number;
    if (aspect >= 1) {
      camH = CAM_HALF_W;
      camW = camH * aspect;
    } else {
      camW = CAM_HALF_W;
      camH = camW / aspect;
    }
    if (this.camera) {
      this.camera.left = -camW; this.camera.right = camW;
      this.camera.top = camH;   this.camera.bottom = -camH;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera = new THREE.OrthographicCamera(-camW, camW, camH, -camH, 0.1, 100);
    }
  }

  private _onResize(): void {
    const rect = this.container.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.css2d.setSize(rect.width, rect.height);
    this._updateCamera();
  }

  /* ────────── 블록 Mesh ────────── */
  private _buildBoard(): void {
    // 블록 메시
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const block = boardCore.getBlock(r, c);
        if (block) this._spawnBlockMesh(block, false);
      }
    // 블로커 메시 — boardCore.init()이 board3d 리스너 등록 전에 실행되므로
    // BLOCKER_SPAWN 이벤트가 유실될 수 있음 → 직접 읽어서 생성
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const bl = boardCore.getBlocker(r, c);
        if (bl && !this.blockerMeshes.has(bl.id)) this._spawnBlockerMesh(bl);
      }
  }

  private _spawnBlockMesh(block: Block, animated: boolean): THREE.Mesh {
    const cfg = this.configMap.get(block.colorType);
    const [wx, wy] = gridToWorld(block.row, block.col);

    const effectiveCfg = cfg ?? {
      blockType: block.colorType, emoji: '?', bgColor: 0x444444,
      particleA: 0x888888, particleB: 0xaaaaaa, idleType: 'float' as const,
    };

    // 특수 블록은 전용 배경색 + 마크 텍스처 사용
    const specialBg = SPECIAL_BG[block.kind];
    const materialCfg = specialBg !== undefined
      ? { ...effectiveCfg, bgColor: specialBg, emoji: block.kind }
      : effectiveCfg;

    const { material, texture } = createBlockMaterial(materialCfg);
    const geo  = new THREE.PlaneGeometry(BLOCK_UNIT * BLOCK_SCALE, BLOCK_UNIT * BLOCK_SCALE);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(wx, wy, 0.05);
    mesh.renderOrder = BLOCK_RENDER_ORDER;
    mesh.userData['blockId']   = block.id;
    mesh.userData['row']       = block.row;
    mesh.userData['col']       = block.col;
    mesh.userData['baseY']     = wy;
    mesh.userData['blockKind'] = block.kind;

    this._addSpecialBadge(mesh, block, cfg?.bgColor ?? 0x444444);

    // 특수 블록 오라 링 부착
    if (this._isSpecialKind(block.kind)) {
      this._addSpecialAura(block, mesh);
    }

    if (animated) {
      mesh.scale.set(0.01, 0.01, 1);
      const startT = this.clock.getElapsedTime();
      const dur = 0.22;
      const animIn = (): void => {
        if (this.disposed) return;
        const t = Math.min(1, (this.clock.getElapsedTime() - startT) / dur);
        const s = easeOutBack(t);
        mesh.scale.set(Math.max(0.01, s), Math.max(0.01, s), 1);
        if (t < 1) requestAnimationFrame(animIn);
      };
      requestAnimationFrame(animIn);
    }

    this.scene.add(mesh);
    this.blockMeshes.set(block.id, mesh);
    this.blockMaterials.set(block.id, material);
    material.userData['texture'] = texture;
    // 특수 블록 ID 별도 추적 (오라 루프 O(특수 수) 최적화)
    if (this._isSpecialKind(block.kind)) this.specialMeshIds.add(block.id);
    return mesh;
  }

  /** 특수 블록 배지 — 텍스처에 이미 마크가 그려져 있으므로 추가 오버레이 없음 */
  private _addSpecialBadge(_parentMesh: THREE.Mesh, _block: Block, _baseColor: number): void {
    // 특수 블록: blockMaterial.ts에서 전용 텍스처(화살표/프로펠러/TNT/컬러범)로 처리
    // 일반 블록: 배지 없음 (텍스처에 도형 마크 포함)
  }

  /** 특수 블록 오라 링 — 부모 mesh의 자식으로 부착 → drop/swap 자동 추적 */
  private _addSpecialAura(block: Block, parentMesh: THREE.Mesh): void {
    const color = SPECIAL_BG[block.kind] ?? 0xffffff;
    const geo = new THREE.RingGeometry(0.45, 0.55, 32);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(0, 0, 0.02); // 부모 앞에 살짝
    ring.renderOrder = BLOCK_RENDER_ORDER - 1;
    ring.userData['isSpecialAura'] = true;
    ring.userData['auraId'] = block.id;
    parentMesh.add(ring);
  }

  /** 슬로우 모션 적용 */
  private _applySlowMo(scale: number, durationMs: number): void {
    this.timeScale = scale;
    this._timeScaleTarget = scale;
    this._timeScaleRecoverAt = performance.now() + durationMs;
  }

  /* ────────── 블로커 렌더링 ────────── */

  private _spawnBlockerMesh(bl: Blocker): void {
    const [wx, wy] = gridToWorld(bl.row, bl.col);
    const { material, texture } = createBlockerMaterial(
      bl.kind, bl.hp,
      { faceRevealed: bl.faceRevealed, revealedType: bl.revealedType ?? undefined },
    );
    const geo  = new THREE.PlaneGeometry(BLOCK_UNIT * 0.90, BLOCK_UNIT * 0.90);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(wx, wy, 0.08);
    mesh.renderOrder = 3; // 블록 위, 오라 위
    mesh.userData['blockerId'] = bl.id;
    this.scene.add(mesh);
    this.blockerMeshes.set(bl.id, mesh);
    material.userData['texture'] = texture;

    // 팝인 애니메이션
    mesh.scale.set(0.01, 0.01, 1);
    const startT = this.clock.getElapsedTime();
    const dur = 0.28;
    const pop = (): void => {
      if (this.disposed) return;
      const t = Math.min(1, (this.clock.getElapsedTime() - startT) / dur);
      const s = easeOutBack(t);
      mesh.scale.set(Math.max(0.01, s), Math.max(0.01, s), 1);
      if (t < 1) requestAnimationFrame(pop);
    };
    requestAnimationFrame(pop);
  }

  private _refreshBlockerMesh(bl: Blocker): void {
    const mesh = this.blockerMeshes.get(bl.id);
    if (!mesh) return;
    const oldMat = mesh.material as THREE.MeshBasicMaterial;
    (oldMat.userData['texture'] as THREE.Texture | undefined)?.dispose();
    oldMat.dispose();

    const { material, texture } = createBlockerMaterial(
      bl.kind, bl.hp,
      { faceRevealed: bl.faceRevealed, revealedType: bl.revealedType ?? undefined },
    );
    mesh.material = material;
    material.userData['texture'] = texture;
  }

  private _animBlockerHit(bl: Blocker): void {
    const mesh = this.blockerMeshes.get(bl.id);
    if (!mesh) return;
    this._refreshBlockerMesh(bl); // 텍스처 갱신 (균열 추가)

    const startT = this.clock.getElapsedTime();
    const dur = 0.22;
    const shake = (): void => {
      if (this.disposed) return;
      const t = (this.clock.getElapsedTime() - startT) / dur;
      if (t >= 1) { mesh.position.x = mesh.userData['bx'] as number ?? mesh.position.x; return; }
      const [wxx] = gridToWorld(bl.row, bl.col);
      mesh.position.x = wxx + Math.sin(t * Math.PI * 5) * 0.06 * (1 - t);
      mesh.userData['bx'] = wxx;
      requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);

    // 파티클
    const [wx, wy] = gridToWorld(bl.row, bl.col);
    burstAtBlock(this.particlePool, wx, wy, 0xffffff, 0xffdd66, 10);
    audio.swapFail();
    this.camShake.intensity = Math.max(this.camShake.intensity, 0.06);
  }

  private _animBlockerDestroy(bl: Blocker): void {
    const mesh = this.blockerMeshes.get(bl.id);
    if (!mesh) return;
    const [wx, wy] = gridToWorld(bl.row, bl.col);
    burstAtBlock(this.particlePool, wx, wy, 0xffdd44, 0xff8800, 30);
    this.camShake.intensity = Math.max(this.camShake.intensity, 0.10);

    const startT = this.clock.getElapsedTime();
    const dur = 0.30;
    const destroy = (): void => {
      if (this.disposed) { this.scene.remove(mesh); return; }
      const t = (this.clock.getElapsedTime() - startT) / dur;
      if (t >= 1) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.blockerMeshes.delete(bl.id);
        return;
      }
      const s = 1 + t * 0.4;
      mesh.scale.set(s, s, 1);
      (mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      requestAnimationFrame(destroy);
    };
    requestAnimationFrame(destroy);
    audio.laser();
  }

  /**
   * 특수 블록 생성 예고 연출
   * 피벗 블록을 flash+pulse → 팽창 링 → 특수 블록 스폰
   */
  private _animSpecialCreate(pivot: Block, sp: Block): void {
    const mesh = this.blockMeshes.get(pivot.id);
    const [wx, wy] = gridToWorld(pivot.row, pivot.col);
    const mat  = this.blockMaterials.get(pivot.id);

    // 1. 피벗 블록 flash + pulse (0.28s)
    if (mesh) {
      const startT = this.clock.getElapsedTime();
      const dur = 0.28;
      let spawned = false;
      const flash = (): void => {
        if (this.disposed) return;
        const t = Math.min(1, (this.clock.getElapsedTime() - startT) / dur);
        // highlight: sine pulse (0→peak→0)
        if (mat) mat.uniforms['uHighlight'].value = Math.sin(t * Math.PI) * 3.0;
        // scale: bloom-up then shrink
        const s = 1 + Math.sin(t * Math.PI) * 0.32;
        mesh.scale.set(s, s, 1);

        if (t < 1) {
          requestAnimationFrame(flash);
        } else if (!spawned) {
          spawned = true;
          this._removeMesh(pivot.id);
          if (!this.blockMeshes.has(sp.id)) this._spawnBlockMesh(sp, true);
          // 스폰 파티클 버스트
          const cfg = this.configMap.get(sp.colorType);
          burstAtBlock(this.particlePool, wx, wy, 0xffffff, cfg?.particleA ?? 0xffff88, 24);
          audio.tap();
        }
      };
      requestAnimationFrame(flash);
    } else {
      if (!this.blockMeshes.has(sp.id)) this._spawnBlockMesh(sp, true);
    }

    // 2. 팽창 링 (즉시 시작)
    const ringGeo = new THREE.RingGeometry(0.15, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(wx, wy, 0.45);
    ring.renderOrder = 13;
    this.scene.add(ring);

    const rStart = this.clock.getElapsedTime();
    const rDur = 0.42;
    const ringAnim = (): void => {
      if (this.disposed) { this.scene.remove(ring); return; }
      const t = (this.clock.getElapsedTime() - rStart) / rDur;
      if (t >= 1) {
        this.scene.remove(ring);
        ringGeo.dispose(); ringMat.dispose();
        return;
      }
      const scale = 1 + t * 2.5;
      ring.scale.set(scale, scale, 1);
      ringMat.opacity = (1 - t) * 0.95;
      requestAnimationFrame(ringAnim);
    };
    requestAnimationFrame(ringAnim);
  }

  /* ────────── BoardCore 이벤트 ────────── */
  private _onBoardEvent(e: BoardEvent): void {
    switch (e.type) {
      case 'SWAP_START':
        this._animSwap(e.r1, e.c1, e.r2, e.c2);
        audio.tap();
        break;
      case 'SWAP_BACK':
        this._animSwapBack(e.r1, e.c1, e.r2, e.c2);
        audio.swapFail();
        break;
      case 'MATCH_GROUP':
        if (e.specialCreated) {
          const sp = e.specialCreated;
          const pivot = e.blocks.find(b => b.row === sp.row && b.col === sp.col);
          if (pivot) {
            this._animSpecialCreate(pivot, sp);
          } else {
            if (!this.blockMeshes.has(sp.id)) this._spawnBlockMesh(sp, true);
          }
        }
        break;
      case 'EXPLODE':
        this._animExplode(e.blocks, e.combo);
        audio.match3(e.combo);
        if (e.combo >= 2) audio.combo(e.combo);
        break;
      case 'COLOR_BOMB_CHAIN':
        this._animColorBombChain(e.targets, e.comboIdx);
        audio.colorBombChain(e.comboIdx);
        break;
      case 'STRIPED_FIRE':
        this._animStripedFire(e.row, e.col, e.dir, e.blocks);
        audio.laser();
        break;
      case 'TNT_FIRE':
        this._animTNTFire(e.row, e.col, e.blocks);
        break;
      case 'PROPELLER_FIRE':
        this._animPropellerFire(e.row, e.col, e.targets, e.phase);
        break;
      case 'BLOCK_DROP':
        this._animDrop(e.moves);
        break;
      case 'BLOCK_SPAWN':
        this._animSpawn(e.blocks);
        break;
      case 'PHASE_CHANGE':
        this._onPhase(e.phase);
        break;
      case 'BLOCKER_SPAWN':
        for (const bl of e.blockers) this._spawnBlockerMesh(bl);
        break;
      case 'BLOCKER_HIT':
        this._animBlockerHit(e.blocker);
        break;
      case 'BLOCKER_REVEAL':
        this._refreshBlockerMesh(e.blocker);
        audio.tap();
        break;
      case 'BLOCKER_DESTROY':
        this._animBlockerDestroy(e.blocker);
        break;
      case 'BOARD_RESET':
        this._clearAllMeshes();
        this._buildBoard();
        break;
      case 'BONUS_TIME_START':
        audio.bonusTime();
        break;
      case 'SUCCESS':
        audio.stageClear();
        for (let i = 0; i < e.stars; i++) audio.star(i);
        break;
      default:
        break;
    }
  }

  /* ────────── 스왑 애니메이션 ────────── */
  private _animSwap(r1: number, c1: number, r2: number, c2: number): void {
    const b1 = boardCore.getBlock(r1, c1);
    const b2 = boardCore.getBlock(r2, c2);
    if (!b1 || !b2) return;
    const m1 = this.blockMeshes.get(b1.id);
    const m2 = this.blockMeshes.get(b2.id);
    if (!m1 || !m2) return;

    const [wx2, wy2] = gridToWorld(r2, c2);
    const [wx1, wy1] = gridToWorld(r1, c1);
    this.swapAnim = {
      active: true, b1: m1, b2: m2, back: false,
      from1: m1.position.clone(), to1: new THREE.Vector3(wx2, wy2, 0.05),
      from2: m2.position.clone(), to2: new THREE.Vector3(wx1, wy1, 0.05),
      t: 0, duration: 0.15,
    };
    m1.renderOrder = 4; m2.renderOrder = 4;
    m1.userData['row'] = r2; m1.userData['col'] = c2;
    m2.userData['row'] = r1; m2.userData['col'] = c1;
  }

  private _animSwapBack(r1: number, c1: number, r2: number, c2: number): void {
    const b1 = boardCore.getBlock(r1, c1);
    const b2 = boardCore.getBlock(r2, c2);
    if (!b1 || !b2) return;
    const m1 = this.blockMeshes.get(b1.id);
    const m2 = this.blockMeshes.get(b2.id);
    if (!m1 || !m2) return;

    const [wx2, wy2] = gridToWorld(r2, c2);
    const [wx1, wy1] = gridToWorld(r1, c1);

    m1.position.set(wx2, wy2, 0.05);
    m2.position.set(wx1, wy1, 0.05);
    this.swapAnim = {
      active: true, b1: m1, b2: m2, back: true,
      from1: new THREE.Vector3(wx2, wy2, 0.05), to1: new THREE.Vector3(wx1, wy1, 0.05),
      from2: new THREE.Vector3(wx1, wy1, 0.05), to2: new THREE.Vector3(wx2, wy2, 0.05),
      t: 0, duration: 0.30,
    };
    m1.userData['row'] = r1; m1.userData['col'] = c1;
    m2.userData['row'] = r2; m2.userData['col'] = c2;
  }

  /* ────────── 폭발 애니메이션 ────────── */
  private _animExplode(blocks: Block[], combo: number): void {
    if (combo >= 2 && blocks.length > 0) {
      const pivot = blocks[Math.floor(blocks.length / 2)];
      const [wx, wy] = gridToWorld(pivot.row, pivot.col);
      createComboRing(this.scene, wx, wy, combo);
      this.ambientSystem.onCombo(combo);
      boardFrame.onCombo();
    }
    if (combo >= 3) {
      this._showComboLabel(combo);
      this.camShake.intensity = Math.min(0.15, combo * 0.03);
    }
    // 고콤보 슬로우 모션
    if (combo >= 4) {
      this._applySlowMo(0.38, 380 + combo * 70);
    }
    this._setVignetteCombo(combo);

    for (const block of blocks) {
      const mesh = this.blockMeshes.get(block.id);
      const cfg  = this.configMap.get(block.colorType);
      const [wx, wy] = gridToWorld(block.row, block.col);

      // 특수 블록 발동 시각
      if (block.kind === 'COLOR_BOMB') {
        audio.colorBombArc();
        // 스파크 버스트 (큰 것)
        if (cfg) burstAtBlock(this.particlePool, wx, wy, cfg.particleA, cfg.particleB, 30);
      } else if (block.kind === 'TNT') {
        this.camShake.intensity = Math.max(this.camShake.intensity, 0.14);
      } else if (block.kind === 'PROPELLER') {
        // 프로펠러 발동 표시
        this._spawnPropellerSpinFX(wx, wy, cfg?.bgColor ?? 0xffffff);
      }

      // 파티클
      if (cfg) {
        const count = this._isSpecialKind(block.kind) ? 22 : 18;
        burstAtBlock(this.particlePool, wx, wy, cfg.particleA, cfg.particleB, count);
      }

      if (!mesh) continue;
      const mat = this.blockMaterials.get(block.id);

      const startT = this.clock.getElapsedTime();
      const dur = 0.22; // 튕김을 표현하기 위해 애니메이션 시간을 살짝 늘림
      const holeColor = cfg ? cfg.particleA : 0xffffff;
      const anim = (): void => {
        if (this.disposed) return;
        const t = (this.clock.getElapsedTime() - startT) / dur;
        if (t >= 1) {
          this._removeMesh(block.id);
          this._spawnHoleEffect(wx, wy, holeColor);
          return;
        }

        // Squash & Stretch & Spin 소멸 연출
        if (t < 0.25) {
          const factor = t / 0.25;
          mesh.scale.set(1.22 * factor + 1.0 * (1 - factor), 0.82 * factor + 1.0 * (1 - factor), 1);
        } else if (t < 0.5) {
          const factor = (t - 0.25) / 0.25;
          mesh.scale.set(0.88 * factor + 1.22 * (1 - factor), 1.25 * factor + 0.82 * (1 - factor), 1);
        } else {
          const factor = (t - 0.5) / 0.5;
          const scale = 1 - factor;
          mesh.scale.set(Math.max(0.01, scale * 0.88), Math.max(0.01, scale * 1.25), 1);
          mesh.rotation.z = factor * Math.PI * 0.5; // 소용돌이 회전 소멸
        }

        if (mat) mat.uniforms['uHighlight'].value = (1 - t) * 1.8;
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }
  }

  private _isSpecialKind(kind: string): boolean {
    return kind === 'STRIPED_H' || kind === 'STRIPED_V' ||
           kind === 'PROPELLER' || kind === 'COLOR_BOMB' || kind === 'TNT';
  }

  /* ────────── STRIPED FX — 로켓 레이저 ────────── */
  private _animStripedFire(row: number, col: number, dir: 'H' | 'V', blocks?: Block[]): void {
    const [wx, wy] = gridToWorld(row, col);

    // 블록 컬러 및 파티클 색상 추출
    let beamColor = 0xffffff;
    let particleColorB = 0xaaddff;
    if (blocks && blocks.length > 0) {
      const cfg = this.configMap.get(blocks[0].colorType);
      if (cfg) {
        beamColor = cfg.bgColor;
        particleColorB = cfg.particleB;
      }
    } else {
      particleColorB = dir === 'H' ? 0xaaddff : 0xffaadd;
    }

    // 1. 발사 위치 집중 버스트 (22개)
    burstAtBlock(this.particlePool, wx, wy, 0xffffff, particleColorB, 22);

    // 2. 발사 순간 원형 섬광 (Circle)
    const flashGeo = new THREE.CircleGeometry(0.5, 32);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(wx, wy, 0.35);
    flash.renderOrder = 11;
    this.scene.add(flash);

    const flashStartT = this.clock.getElapsedTime();
    const flashAnim = (): void => {
      if (this.disposed) { this.scene.remove(flash); flashGeo.dispose(); flashMat.dispose(); return; }
      const elapsed = this.clock.getElapsedTime() - flashStartT;
      const t = elapsed / 0.15;
      if (t >= 1) {
        this.scene.remove(flash);
        flashGeo.dispose();
        flashMat.dispose();
        return;
      }
      const scaleVal = 0.5 + t * 2.0; // 0.5 -> 2.5
      flash.scale.set(scaleVal, scaleVal, 1);
      flashMat.opacity = 1 - t;
      requestAnimationFrame(flashAnim);
    };
    requestAnimationFrame(flashAnim);

    // 3. 3겹 레이저 빔 구성
    let coreGeo: THREE.PlaneGeometry;
    let glowGeo: THREE.PlaneGeometry;
    let softGeo: THREE.PlaneGeometry;

    if (dir === 'H') {
      coreGeo = new THREE.PlaneGeometry(GRID_COLS * BLOCK_UNIT, BLOCK_UNIT * 0.08);
      glowGeo = new THREE.PlaneGeometry(GRID_COLS * BLOCK_UNIT, BLOCK_UNIT * 0.28);
      softGeo = new THREE.PlaneGeometry(GRID_COLS * BLOCK_UNIT, BLOCK_UNIT * 0.55);
    } else {
      coreGeo = new THREE.PlaneGeometry(BLOCK_UNIT * 0.08, GRID_ROWS * BLOCK_UNIT);
      glowGeo = new THREE.PlaneGeometry(BLOCK_UNIT * 0.28, GRID_ROWS * BLOCK_UNIT);
      softGeo = new THREE.PlaneGeometry(BLOCK_UNIT * 0.55, GRID_ROWS * BLOCK_UNIT);
    }

    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: beamColor, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const softMat = new THREE.MeshBasicMaterial({
      color: beamColor, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    const softMesh = new THREE.Mesh(softGeo, softMat);

    const meshes = [coreMesh, glowMesh, softMesh];
    const materials = [coreMat, glowMat, softMat];
    const maxOpacities = [0.9, 0.55, 0.22];

    meshes.forEach(m => {
      if (dir === 'H') {
        m.position.set(0, wy, 0.3);
      } else {
        m.position.set(wx, 0, 0.3);
      }
      m.renderOrder = 10;
      this.scene.add(m);
    });

    const startT = this.clock.getElapsedTime();
    const anim = (): void => {
      if (this.disposed) {
        meshes.forEach(m => this.scene.remove(m));
        meshes.forEach(m => m.geometry.dispose());
        materials.forEach(mat => mat.dispose());
        return;
      }
      const t = (this.clock.getElapsedTime() - startT) / 0.45;
      if (t >= 1) {
        meshes.forEach(m => this.scene.remove(m));
        meshes.forEach(m => m.geometry.dispose());
        materials.forEach(mat => mat.dispose());
        return;
      }

      // 빔 등장 효과 (scale.x 또는 scale.y 중심에서 양옆으로 확장)
      const scaleFactor = t < 0.3 ? t / 0.3 : 1.0;
      meshes.forEach(m => {
        if (dir === 'H') {
          m.scale.set(scaleFactor, 1, 1);
        } else {
          m.scale.set(1, scaleFactor, 1);
        }
      });

      // 투명도 애니메이션
      materials.forEach((mat, idx) => {
        const maxOp = maxOpacities[idx];
        mat.opacity = t < 0.3 ? (t / 0.3) * maxOp : (1 - (t - 0.3) / 0.7) * maxOp;
      });

      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);

    // 4. 주변 블록 미세 진동 효과
    const neighborMeshes: THREE.Mesh[] = [];
    this.blockMeshes.forEach(mesh => {
      const r = mesh.userData['row'];
      const c = mesh.userData['col'];
      if (dir === 'H') {
        if (Math.abs(r - row) === 1) neighborMeshes.push(mesh);
      } else {
        if (Math.abs(c - col) === 1) neighborMeshes.push(mesh);
      }
    });

    if (neighborMeshes.length > 0) {
      // ⚠️ DROP 딜레이(380ms)보다 짧게 유지 — 절대 position 덮어쓰면 DROP 애니메이션과 충돌
      const shakeStartT = this.clock.getElapsedTime();
      const shakeDur = 0.25;     // 250ms < 380ms DROP 딜레이
      const shakeIntensity = 0.05;

      const shakeAnim = (): void => {
        if (this.disposed) return;
        const elapsed = this.clock.getElapsedTime() - shakeStartT;
        const t = elapsed / shakeDur;
        if (t >= 1) return; // DROP 애니메이션이 최종 위치 처리

        const amp = shakeIntensity * (1 - t);
        const offset = Math.sin(elapsed * Math.PI * 24) * amp;

        neighborMeshes.forEach(m => {
          // 이미 제거된 메시 스킵 (연쇄 폭발로 사라진 경우)
          if (!this.blockMeshes.has(m.userData['blockId'] as number)) return;
          // additive 방식: 현재 위치에 진동 더함 (DROP 값 유지)
          if (dir === 'H') m.position.y += offset;
          else m.position.x += offset;
        });

        requestAnimationFrame(shakeAnim);
      };
      requestAnimationFrame(shakeAnim);
    }

    // 5. 파티클 stagger 지연 발사
    if (dir === 'H') {
      for (let c = 0; c < GRID_COLS; c++) {
        const dist = Math.abs(c - col);
        setTimeout(() => {
          if (this.disposed) return;
          const [px] = gridToWorld(row, c);
          burstAtBlock(this.particlePool, px, wy, 0xffffff, particleColorB, 6);
        }, dist * 30);
      }
    } else {
      for (let r = 0; r < GRID_ROWS; r++) {
        const dist = Math.abs(r - row);
        setTimeout(() => {
          if (this.disposed) return;
          const [, py] = gridToWorld(r, col);
          burstAtBlock(this.particlePool, wx, py, 0xffffff, particleColorB, 6);
        }, dist * 30);
      }
    }

    // 6. 카메라 셰이크 강도 줄임 (0.08 -> 0.04)
    this.camShake.intensity = Math.max(this.camShake.intensity, 0.04);
  }

  /* ────────── TNT FX — 3×3 폭발 ────────── */
  private _animTNTFire(row: number, col: number, blocks: Block[]): void {
    const [wx, wy] = gridToWorld(row, col);

    // 0. 사전 경고 연출 (80ms)
    let tntMesh: THREE.Mesh | undefined;
    this.blockMeshes.forEach(mesh => {
      if (mesh.userData['row'] === row && mesh.userData['col'] === col) {
        tntMesh = mesh;
      }
    });

    if (tntMesh) {
      const origX = tntMesh.position.x;
      const preStart = this.clock.getElapsedTime();
      const preAnim = (): void => {
        if (this.disposed || !tntMesh || !this.blockMeshes.has(tntMesh.userData['blockId'])) return;
        const elapsed = this.clock.getElapsedTime() - preStart;
        const t = elapsed / 0.08;
        if (t >= 1) {
          tntMesh.position.x = origX;
          return;
        }
        tntMesh.position.x = origX + Math.sin(elapsed * Math.PI * 30) * 0.06;
        requestAnimationFrame(preAnim);
      };
      requestAnimationFrame(preAnim);
    }

    const warnGeo = new THREE.RingGeometry(0.1, 0.35, 32);
    const warnMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const warnMesh = new THREE.Mesh(warnGeo, warnMat);
    warnMesh.position.set(wx, wy, 0.38);
    warnMesh.renderOrder = 14;
    this.scene.add(warnMesh);

    const warnStart = this.clock.getElapsedTime();
    const warnAnim = (): void => {
      if (this.disposed) { this.scene.remove(warnMesh); warnGeo.dispose(); warnMat.dispose(); return; }
      const elapsed = this.clock.getElapsedTime() - warnStart;
      const t = elapsed / 0.08;
      if (t >= 1) {
        this.scene.remove(warnMesh);
        warnGeo.dispose();
        warnMat.dispose();
        return;
      }
      warnMat.opacity = Math.sin(t * Math.PI) * 0.7;
      requestAnimationFrame(warnAnim);
    };
    requestAnimationFrame(warnAnim);

    // 80ms 후에 대폭발 실행
    setTimeout(() => {
      if (this.disposed) return;

      // 1. 충격파 링 (Shockwave Ring)
      const shockGeo = new THREE.RingGeometry(0.1, 0.13, 32);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const shockMesh = new THREE.Mesh(shockGeo, shockMat);
      shockMesh.position.set(wx, wy, 0.36);
      shockMesh.renderOrder = 13;
      this.scene.add(shockMesh);

      const shockStart = this.clock.getElapsedTime();
      const shockAnim = (): void => {
        if (this.disposed) { this.scene.remove(shockMesh); shockGeo.dispose(); shockMat.dispose(); return; }
        const elapsed = this.clock.getElapsedTime() - shockStart;
        const t = elapsed / 0.3;
        if (t >= 1) {
          this.scene.remove(shockMesh);
          shockGeo.dispose();
          shockMat.dispose();
          return;
        }
        const ease = 1 - Math.pow(1 - t, 3); // cubic ease out
        const s = 1 + ease * 12.0;
        shockMesh.scale.set(s, s, 1);
        shockMat.opacity = (1 - t) * 0.9;
        requestAnimationFrame(shockAnim);
      };
      requestAnimationFrame(shockAnim);

      // 2. 폭발 링 3겹 — 5×5 범위까지 확장
      const ringColors = [0xff6600, 0xff3300, 0xffaa00];
      for (let ring = 0; ring < 3; ring++) {
        setTimeout(() => {
          if (this.disposed) return;
          const geo = new THREE.RingGeometry(0.1, 0.28, 32);
          const mat = new THREE.MeshBasicMaterial({
            color: ringColors[ring],
            transparent: true, opacity: 0.85,
            blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(wx, wy, 0.35);
          mesh.renderOrder = 12;
          this.scene.add(mesh);

          const startT = this.clock.getElapsedTime();
          const targetR = (ring + 1) * 2.4;
          const dur = 0.4;
          const ringAnim = (): void => {
            if (this.disposed) { this.scene.remove(mesh); return; }
            const elapsedT = (this.clock.getElapsedTime() - startT) / dur;
            if (elapsedT >= 1) { this.scene.remove(mesh); geo.dispose(); mat.dispose(); return; }
            const ease = 1 - Math.pow(1 - elapsedT, 2); // ease-out-quad
            const scale = 1 + ease * targetR;
            mesh.scale.set(scale, scale, 1);
            mat.opacity = (1 - elapsedT) * 0.85;
            requestAnimationFrame(ringAnim);
          };
          requestAnimationFrame(ringAnim);
        }, ring * 70);
      }

      // 3. 2레이어 중심 플래시
      const coreFlashGeo = new THREE.CircleGeometry(0.5, 24);
      const coreFlashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const coreFlash = new THREE.Mesh(coreFlashGeo, coreFlashMat);
      coreFlash.position.set(wx, wy, 0.4);
      coreFlash.renderOrder = 13;
      this.scene.add(coreFlash);

      const glowFlashGeo = new THREE.CircleGeometry(0.8, 24);
      const glowFlashMat = new THREE.MeshBasicMaterial({
        color: 0xff6600, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const glowFlash = new THREE.Mesh(glowFlashGeo, glowFlashMat);
      glowFlash.position.set(wx, wy, 0.39);
      glowFlash.renderOrder = 12;
      this.scene.add(glowFlash);

      const flashStart = this.clock.getElapsedTime();
      const flashDur = 0.28;
      const flashAnim = (): void => {
        if (this.disposed) {
          this.scene.remove(coreFlash); coreFlashGeo.dispose(); coreFlashMat.dispose();
          this.scene.remove(glowFlash); glowFlashGeo.dispose(); glowFlashMat.dispose();
          return;
        }
        const elapsedT = (this.clock.getElapsedTime() - flashStart) / flashDur;
        if (elapsedT >= 1) {
          this.scene.remove(coreFlash); coreFlashGeo.dispose(); coreFlashMat.dispose();
          this.scene.remove(glowFlash); glowFlashGeo.dispose(); glowFlashMat.dispose();
          return;
        }

        const ease = 1 - Math.pow(1 - elapsedT, 2);
        const coreScale = 1.0 + ease * 2.5; // 1.0 -> 3.5
        const glowScale = 1.0 + ease * 3.5; // 1.0 -> 4.5

        coreFlash.scale.set(coreScale, coreScale, 1);
        glowFlash.scale.set(glowScale, glowScale, 1);

        coreFlashMat.opacity = 0.8 * (1 - elapsedT);
        glowFlashMat.opacity = 0.6 * (1 - elapsedT);

        requestAnimationFrame(flashAnim);
      };
      requestAnimationFrame(flashAnim);

      // 4. 주변 블록 2D 미세 진동 효과 (맨해튼 거리 3~5인 남은 블록들 대상)
      const neighborMeshes: THREE.Mesh[] = [];
      this.blockMeshes.forEach(mesh => {
        const r = mesh.userData['row'];
        const c = mesh.userData['col'];
        const dist = Math.abs(r - row) + Math.abs(c - col);
        if (dist >= 3 && dist <= 5) {
          neighborMeshes.push(mesh);
        }
      });

      if (neighborMeshes.length > 0) {
        // ⚠️ DROP 딜레이(380ms)보다 짧게 유지 — 절대 position 덮어쓰면 DROP 애니메이션과 충돌
        const shakeStartT = this.clock.getElapsedTime();
        const shakeDur = 0.22;     // 220ms < 380ms DROP 딜레이 (TNT_FIRE는 ~120ms 뒤에 발동)
        const shakeIntensity = 0.08;

        const shakeAnim = (): void => {
          if (this.disposed) return;
          const elapsed = this.clock.getElapsedTime() - shakeStartT;
          const t = elapsed / shakeDur;
          if (t >= 1) return; // DROP 애니메이션이 최종 위치 처리

          const amp = shakeIntensity * (1 - t);
          const offset = Math.sin(elapsed * Math.PI * 26) * amp;

          neighborMeshes.forEach(m => {
            // 이미 제거된 메시 스킵 (연쇄 폭발로 사라진 경우)
            if (!this.blockMeshes.has(m.userData['blockId'] as number)) return;
            // additive 방식: 현재 위치에 진동 더함 (DROP 값 유지)
            const angle = Math.random() * Math.PI * 2;
            m.position.x += Math.cos(angle) * offset;
            m.position.y += Math.sin(angle) * offset;
          });

          requestAnimationFrame(shakeAnim);
        };
        requestAnimationFrame(shakeAnim);
      }

      // 5. 파티클 버스트
      // 중심 mega burst (30개)
      burstAtBlock(this.particlePool, wx, wy, 0xffffff, 0xff3300, 30);

      // 개별 블록 폭발 파티클 (각 12개)
      for (const block of blocks) {
        const [bx, by] = gridToWorld(block.row, block.col);
        burstAtBlock(this.particlePool, bx, by, 0xff6600, 0xffaa00, 12);
      }

      // 6. 카메라 셰이크 강도 줄임 (0.22 -> 0.08)
      this.camShake.intensity = Math.max(this.camShake.intensity, 0.08);

    }, 80);

    audio.laser();
  }

  /* ────────── PROPELLER FX ────────── */
  private _animPropellerFire(originRow: number, originCol: number, targets: Block[], phase: number): void {
    if (targets.length === 0) return;
    const [ox, oy] = gridToWorld(originRow, originCol);

    if (phase === 0) {
      // Phase 0: 발동 위치 스핀 버스트 (상하좌우 4칸 즉시 제거)
      this._spawnPropellerSpinFX(ox, oy, 0x00ffcc);
      burstAtBlock(this.particlePool, ox, oy, 0x00ffcc, 0x00aaff, 20);
      // 제거된 블록들 개별 파티클
      for (const b of targets) {
        const [bx, by] = gridToWorld(b.row, b.col);
        burstAtBlock(this.particlePool, bx, by, 0x00ffcc, 0x0088ff, 8);
      }
      return;
    }

    // Phase 1: 발사체가 origin → target으로 날아가서 1개 제거
    const target = targets[0];
    const [tx, ty] = gridToWorld(target.row, target.col);

    // 3겹의 발사체 구성
    const projCoreGeo = new THREE.CircleGeometry(0.11, 16);
    const projGlowGeo = new THREE.CircleGeometry(0.18, 16);
    const projOuterGeo = new THREE.CircleGeometry(0.26, 16);

    const projCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const projGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const projOuterMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    const projCore = new THREE.Mesh(projCoreGeo, projCoreMat);
    const projGlow = new THREE.Mesh(projGlowGeo, projGlowMat);
    const projOuter = new THREE.Mesh(projOuterGeo, projOuterMat);

    projCore.position.set(ox, oy, 0.36); projCore.renderOrder = 14;
    projGlow.position.set(ox, oy, 0.35); projGlow.renderOrder = 13;
    projOuter.position.set(ox, oy, 0.34); projOuter.renderOrder = 12;

    this.scene.add(projCore);
    this.scene.add(projGlow);
    this.scene.add(projOuter);

    // 5겹 꼬리 잔상 (delay, size, color, opacity 다각화)
    const trailSpecs = [
      { size: 0.14, color: 0x00ffcc, delay: 0.04, maxOpacity: 0.5 },
      { size: 0.10, color: 0x88ffdd, delay: 0.08, maxOpacity: 0.4 },
      { size: 0.07, color: 0xffaa44, delay: 0.12, maxOpacity: 0.35 },
      { size: 0.05, color: 0xff8800, delay: 0.16, maxOpacity: 0.3 },
      { size: 0.03, color: 0xff4400, delay: 0.20, maxOpacity: 0.2 }
    ];

    const trails = trailSpecs.map(spec => {
      const geo = new THREE.CircleGeometry(spec.size, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: spec.color, transparent: true, opacity: spec.maxOpacity,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox, oy, 0.33);
      mesh.renderOrder = 11;
      this.scene.add(mesh);
      return { mesh, geo, mat, spec };
    });

    const startT = this.clock.getElapsedTime();
    const dur = 0.28;
    const fly = (): void => {
      if (this.disposed) {
        this.scene.remove(projCore); projCoreGeo.dispose(); projCoreMat.dispose();
        this.scene.remove(projGlow); projGlowGeo.dispose(); projGlowMat.dispose();
        this.scene.remove(projOuter); projOuterGeo.dispose(); projOuterMat.dispose();
        trails.forEach(trail => {
          this.scene.remove(trail.mesh); trail.geo.dispose(); trail.mat.dispose();
        });
        return;
      }
      const elapsed = this.clock.getElapsedTime() - startT;
      const t = Math.min(1, elapsed / dur);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      
      const px = ox + (tx - ox) * ease;
      const py = oy + (ty - oy) * ease;

      projCore.position.set(px, py, 0.36);
      projGlow.position.set(px, py, 0.35);
      projOuter.position.set(px, py, 0.34);

      projCoreMat.opacity = 0.95 * (1 - t * 0.2);
      projGlowMat.opacity = 0.8 * (1 - t * 0.2);
      projOuterMat.opacity = 0.3 * (1 - t * 0.2);

      // 꼬리 잔상 5개 위치 지연 업데이트
      trails.forEach(trail => {
        const trailT = Math.max(0, Math.min(1, (elapsed - trail.spec.delay) / dur));
        const easeTrail = 1 - Math.pow(1 - trailT, 3);
        trail.mesh.position.x = ox + (tx - ox) * easeTrail;
        trail.mesh.position.y = oy + (ty - oy) * easeTrail;
        trail.mat.opacity = trail.spec.maxOpacity * (1 - t);
      });

      if (t >= 1) {
        this.scene.remove(projCore); projCoreGeo.dispose(); projCoreMat.dispose();
        this.scene.remove(projGlow); projGlowGeo.dispose(); projGlowMat.dispose();
        this.scene.remove(projOuter); projOuterGeo.dispose(); projOuterMat.dispose();
        trails.forEach(trail => {
          this.scene.remove(trail.mesh); trail.geo.dispose(); trail.mat.dispose();
        });

        // 착탄 플래시 추가 (0.15초)
        const hitFlashGeo = new THREE.CircleGeometry(0.4, 24);
        const hitFlashMat = new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 1.0,
          blending: THREE.AdditiveBlending, depthWrite: false
        });
        const hitFlash = new THREE.Mesh(hitFlashGeo, hitFlashMat);
        hitFlash.position.set(tx, ty, 0.38);
        hitFlash.renderOrder = 13;
        this.scene.add(hitFlash);

        const hitFlashStart = this.clock.getElapsedTime();
        const hitFlashAnim = (): void => {
          if (this.disposed) { this.scene.remove(hitFlash); hitFlashGeo.dispose(); hitFlashMat.dispose(); return; }
          const elapsedT = (this.clock.getElapsedTime() - hitFlashStart) / 0.15;
          if (elapsedT >= 1) {
            this.scene.remove(hitFlash);
            hitFlashGeo.dispose();
            hitFlashMat.dispose();
            return;
          }
          const scale = 0.5 + elapsedT * 2.0; // 0.5 -> 2.5
          hitFlash.scale.set(scale, scale, 1);
          hitFlashMat.opacity = 1 - elapsedT;
          requestAnimationFrame(hitFlashAnim);
        };
        requestAnimationFrame(hitFlashAnim);

        // 착탄 버스트 (26개)
        burstAtBlock(this.particlePool, tx, ty, 0x00ffdd, 0x0088ff, 26);
        return;
      }
      requestAnimationFrame(fly);
    };
    requestAnimationFrame(fly);
  }

  /* ────────── PROPELLER 스핀 FX (발동 시) ────────── */
  private _spawnPropellerSpinFX(wx: number, wy: number, color: number): void {
    const ringSpecs = [
      { rInner: 0.25, rOuter: 0.38, opacity: 0.7, delay: 0 },
      { rInner: 0.18, rOuter: 0.30, opacity: 0.5, delay: 30 },
      { rInner: 0.10, rOuter: 0.22, opacity: 0.3, delay: 60 }
    ];

    ringSpecs.forEach(spec => {
      setTimeout(() => {
        if (this.disposed) return;
        const geo = new THREE.RingGeometry(spec.rInner, spec.rOuter, 32);
        const mat = new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: spec.opacity,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.set(wx, wy, 0.3);
        ring.renderOrder = 11;
        this.scene.add(ring);

        const startT = this.clock.getElapsedTime();
        const dur = 0.5;
        const spin = (): void => {
          if (this.disposed) { this.scene.remove(ring); return; }
          const t = (this.clock.getElapsedTime() - startT) / dur;
          if (t >= 1) { this.scene.remove(ring); geo.dispose(); mat.dispose(); return; }
          ring.rotation.z = t * Math.PI * 4;
          mat.opacity = (1 - t) * spec.opacity;
          const scale = 1 + t * 0.5;
          ring.scale.set(scale, scale, 1);
          requestAnimationFrame(spin);
        };
        requestAnimationFrame(spin);
      }, spec.delay);
    });
  }

  /* ────────── 구멍 이펙트 — 블록 소멸 후 빈 칸 연출 ────────── */
  private _spawnHoleEffect(wx: number, wy: number, glowColor: number): void {
    const col = new THREE.Color(glowColor);

    // ① 어두운 보이드 원 (바닥 깔림) — 크기 상향 (0.44 -> 0.55)
    const voidGeo = new THREE.CircleGeometry(BLOCK_UNIT * 0.55, 32);
    const voidMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.72,
      depthWrite: false,
    });
    const voidMesh = new THREE.Mesh(voidGeo, voidMat);
    voidMesh.position.set(wx, wy, 0.01);
    voidMesh.renderOrder = 1;
    this.scene.add(voidMesh);

    // ② 컬러 림 글로우 링 — 두께 상향 (0.34-0.46 -> 0.28-0.46)
    const rimGeo = new THREE.RingGeometry(BLOCK_UNIT * 0.28, BLOCK_UNIT * 0.46, 36);
    const rimMat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(wx, wy, 0.02);
    rimMesh.renderOrder = 1;
    this.scene.add(rimMesh);

    // ③ 위로 떠오르는 잔불 스파크 (5개) — 개수 상향 (3개 -> 5개)
    const sparks: { mesh: THREE.Mesh; vy: number; mat: THREE.MeshBasicMaterial }[] = [];
    for (let i = 0; i < 5; i++) {
      const sgeo = new THREE.CircleGeometry(0.04 + Math.random() * 0.03, 8);
      const smat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const smesh = new THREE.Mesh(sgeo, smat);
      smesh.position.set(
        wx + (Math.random() - 0.5) * BLOCK_UNIT * 0.5,
        wy + (Math.random() - 0.5) * BLOCK_UNIT * 0.3,
        0.15,
      );
      smesh.renderOrder = 3;
      this.scene.add(smesh);
      // vy 속도 30% 상향 (0.012 -> 0.0156, 0.014 -> 0.0182)
      sparks.push({ mesh: smesh, vy: (0.012 + Math.random() * 0.014) * 1.30, mat: smat });
    }

    const startT = this.clock.getElapsedTime();
    const DUR    = 0.45; // 지속시간 연장 (380ms -> 450ms)

    const tick = (): void => {
      if (this.disposed) {
        this.scene.remove(voidMesh); this.scene.remove(rimMesh);
        sparks.forEach(s => this.scene.remove(s.mesh));
        return;
      }
      const t  = Math.min(1, (this.clock.getElapsedTime() - startT) / DUR);
      const tE = 1 - Math.pow(1 - t, 2); // ease-out

      // 보이드: 처음엔 빠르게 나타났다가 서서히 사라짐
      voidMat.opacity = t < 0.15
        ? (t / 0.15) * 0.72
        : 0.72 * (1 - (t - 0.15) / 0.85);

      // 림 글로우: 0.1 시점에 최대, 이후 fade
      rimMat.opacity = t < 0.10
        ? (t / 0.10) * 0.75
        : 0.75 * (1 - (t - 0.10) / 0.90);
      // 림 링 확장 배율 상향 (0.22 -> 0.45)
      const rimS = 1 + tE * 0.45;
      rimMesh.scale.set(rimS, rimS, 1);

      // 스파크 상승 + 페이드
      for (const s of sparks) {
        s.mesh.position.y += s.vy;
        s.mat.opacity = Math.max(0, 0.9 * (1 - t * 1.4));
      }

      if (t >= 1) {
        this.scene.remove(voidMesh); voidGeo.dispose(); voidMat.dispose();
        this.scene.remove(rimMesh);  rimGeo.dispose();  rimMat.dispose();
        sparks.forEach(s => {
          this.scene.remove(s.mesh);
          s.mesh.geometry.dispose(); s.mat.dispose();
        });
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ────────── COLOR_BOMB 체인 ────────── */
  private _spawnRainbowFlash(): void {
    const geo = new THREE.PlaneGeometry(GRID_COLS * BLOCK_UNIT + 2.0, GRID_ROWS * BLOCK_UNIT + 2.0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flash = new THREE.Mesh(geo, mat);
    flash.position.set(0, 0, 0.5);
    flash.renderOrder = 15;
    this.scene.add(flash);

    const startT = this.clock.getElapsedTime();
    const dur = 0.35;
    const anim = (): void => {
      if (this.disposed) { this.scene.remove(flash); geo.dispose(); mat.dispose(); return; }
      const elapsed = this.clock.getElapsedTime() - startT;
      const t = elapsed / dur;
      if (t >= 1) {
        this.scene.remove(flash);
        geo.dispose();
        mat.dispose();
        return;
      }
      const hue = (elapsed * 3.0) % 1.0;
      mat.color.setHSL(hue, 0.9, 0.6);
      mat.opacity = Math.sin(t * Math.PI) * 0.25;
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  private _spawnMiniColorFlash(wx: number, wy: number, color: number): void {
    const geo = new THREE.CircleGeometry(0.32, 16);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, wy, 0.38);
    mesh.renderOrder = 13;
    this.scene.add(mesh);

    const startT = this.clock.getElapsedTime();
    const anim = (): void => {
      if (this.disposed) { this.scene.remove(mesh); geo.dispose(); mat.dispose(); return; }
      const t = (this.clock.getElapsedTime() - startT) / 0.15;
      if (t >= 1) {
        this.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
        return;
      }
      const scale = 0.5 + t * 1.5;
      mesh.scale.set(scale, scale, 1);
      mat.opacity = 0.8 * (1 - t);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  private _animColorBombChain(targets: Block[], comboIdx: number): void {
    if (comboIdx === 0) {
      let found = false;
      this.blockMeshes.forEach(mesh => {
        if (mesh.userData['blockKind'] === 'COLOR_BOMB') {
          this._colorBombSrc.set(mesh.position.x, mesh.position.y);
          found = true;
        }
      });
      if (!found) {
        this._colorBombSrc.set(0, 0);
      }
      this._spawnRainbowFlash();
    }

    // 아크 발사 연동
    this.specialFX.fireColorBombArcs(this._colorBombSrc.x, this._colorBombSrc.y, targets, this.configMap);

    for (const block of targets) {
      const cfg = this.configMap.get(block.colorType);
      const [wx, wy] = gridToWorld(block.row, block.col);
      const holeColor = cfg ? cfg.bgColor : 0xffffff;
      if (cfg) burstAtBlock(this.particlePool, wx, wy, cfg.particleA, cfg.particleB, 14);

      const mesh = this.blockMeshes.get(block.id);
      if (!mesh) {
        this._spawnHoleEffect(wx, wy, holeColor);
        this._spawnMiniColorFlash(wx, wy, holeColor);
        continue;
      }

      this._spawnMiniColorFlash(wx, wy, holeColor);

      const startT = this.clock.getElapsedTime();
      const dur = 0.14;
      const anim = (): void => {
        if (this.disposed) return;
        const t = (this.clock.getElapsedTime() - startT) / dur;
        if (t >= 1) {
          this._removeMesh(block.id);
          this._spawnHoleEffect(wx, wy, holeColor);
          return;
        }
        const s = 1 - t;
        mesh.scale.set(Math.max(0.01, s), Math.max(0.01, s), 1);
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }
    void comboIdx;
  }

  private _setVignetteCombo(combo: number): void {
    const vignette = document.getElementById('vignette-overlay');
    if (!vignette) return;
    const opacity = Math.min(0.5, combo * 0.08);
    vignette.style.background = `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${opacity}) 100%)`;
  }

  private _clearAllMeshes(): void {
    for (const id of [...this.blockMeshes.keys()]) this._removeMesh(id);
    for (const [id, mesh] of [...this.blockerMeshes]) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.blockerMeshes.delete(id);
    }
    this.swapAnim.active = false;
    this.swapAnim.b1 = null;
    this.swapAnim.b2 = null;
    this.dropAnims.length = 0;
  }

  private _removeMesh(blockId: number): void {
    const mesh = this.blockMeshes.get(blockId);
    if (!mesh) return;
    // 자식(오라 링 등) 정리
    for (const child of [...mesh.children]) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      mesh.remove(child);
    }
    this.scene.remove(mesh);
    this.blockMeshes.delete(blockId);
    this.specialMeshIds.delete(blockId); // 특수 블록 추적 해제
    const mat = this.blockMaterials.get(blockId);
    if (mat) {
      // 텍스처는 blockMaterial.ts의 _texCache에서 공유 관리 — 여기서 dispose 금지
      // (dispose하면 같은 shape의 다른 블록들이 빈 텍스처로 렌더링됨)
      mat.dispose();
      this.blockMaterials.delete(blockId);
    }
    mesh.geometry.dispose();
  }

  /* ────────── 드롭 ────────── */
  private _animDrop(moves: { block: Block; toRow: number }[]): void {
    const byCol = new Map<number, { block: Block; toRow: number }[]>();
    for (const mv of moves) {
      if (!byCol.has(mv.block.col)) byCol.set(mv.block.col, []);
      byCol.get(mv.block.col)!.push(mv);
    }
    for (const [, colMoves] of byCol) {
      colMoves.sort((a, b) => b.toRow - a.toRow);
      colMoves.forEach(({ block, toRow }, idx) => {
        const mesh = this.blockMeshes.get(block.id);
        if (!mesh) return;
        const [, toY] = gridToWorld(toRow, block.col);
        const fromY = mesh.position.y;
        const staggerDelay = idx * 0.06;
        const tStart = -(staggerDelay / 0.24);
        this.dropAnims.push({ mesh, fromY, toY, t: tStart, landed: false });
        mesh.userData['row'] = toRow;
        mesh.userData['baseY'] = toY;
      });
    }
  }

  /* ────────── 스폰 ────────── */
  private _animSpawn(blocks: Block[]): void {
    const byCol = new Map<number, Block[]>();
    for (const block of blocks) {
      if (this.blockMeshes.has(block.id)) continue;
      if (!byCol.has(block.col)) byCol.set(block.col, []);
      byCol.get(block.col)!.push(block);
    }
    const gridTopY = ((GRID_ROWS - 1) / 2) * BLOCK_UNIT;
    for (const [, colBlocks] of byCol) {
      colBlocks.sort((a, b) => a.row - b.row);
      const n = colBlocks.length;
      colBlocks.forEach((block, idx) => {
        const mesh = this._spawnBlockMesh(block, false);
        const [wx, toY] = gridToWorld(block.row, block.col);
        const fromY = gridTopY + (n - idx) * BLOCK_UNIT;
        mesh.position.set(wx, fromY, 0.05);
        const staggerDelay = (n - 1 - idx) * 0.09;
        const tStart = -(staggerDelay / 0.24);
        this.dropAnims.push({ mesh, fromY, toY, t: tStart, landed: false });
      });
    }
  }

  /* ────────── 콤보 레이블 ────────── */
  private _showComboLabel(combo: number): void {
    const LABELS  = ['','','','NICE!','GREAT!','AMAZING!','LEGENDARY!!'];
    const COLORS  = ['','','','#ffffff','#ffee44','#ff9900','#ffdd00'];
    const SIZES   = [0, 0, 0, 28, 34, 42, 52];

    const idx   = Math.min(combo, LABELS.length - 1);
    const text  = combo >= LABELS.length ? 'LEGENDARY!!' : LABELS[idx];
    const color = combo >= COLORS.length ? '#ffdd00'     : COLORS[idx];
    const size  = combo >= SIZES.length  ? 52            : SIZES[idx];
    if (!text) return;

    const div = document.createElement('div');
    div.className = 'combo-label';
    div.textContent = text;
    div.style.cssText = [
      `color:${color}`,
      `font-size:${size}px`,
      'font-weight:900',
      `text-shadow:0 0 16px ${color},0 0 32px ${color}80,2px 2px 0 #000,-1px -1px 0 #000`,
      'letter-spacing:3px',
      'pointer-events:none',
      'white-space:nowrap',
    ].join(';');

    const obj = new CSS2DObject(div);
    obj.position.set(0, 0.7, 1);
    this.scene.add(obj);
    setTimeout(() => this.scene.remove(obj), 1400);
  }

  /* ────────── 페이즈별 연출 ────────── */
  private _onPhase(phase: GamePhase): void {
    const vignette = document.getElementById('vignette-overlay');
    if (!vignette) return;
    if (phase === 'BONUS_TIME') {
      vignette.style.background = 'radial-gradient(ellipse at center, transparent 30%, rgba(245,166,35,0.18) 100%)';
    } else if (phase === 'SUCCESS') {
      vignette.style.background = 'radial-gradient(ellipse at center, transparent 25%, rgba(245,166,35,0.12) 100%)';
    } else if (phase === 'FAIL') {
      vignette.style.background = 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.55) 100%)';
    } else {
      vignette.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0) 100%)';
    }
  }

  /* ────────── 메인 렌더 루프 ────────── */
  private _loop = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this._loop);
    const rawDt  = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 슬로우 모션 타임스케일 회복
    if (this._timeScaleRecoverAt > 0 && performance.now() > this._timeScaleRecoverAt) {
      this._timeScaleTarget = 1.0;
      this._timeScaleRecoverAt = 0;
    }
    this.timeScale += (this._timeScaleTarget - this.timeScale) * 0.10;
    const dt = rawDt * this.timeScale;

    // 특수 블록 오라 펄스 — specialMeshIds만 순회 (O(특수 수), 최대 ~10개)
    for (const id of this.specialMeshIds) {
      const mesh = this.blockMeshes.get(id);
      if (!mesh) { this.specialMeshIds.delete(id); continue; }
      for (const child of mesh.children) {
        if (!(child instanceof THREE.Mesh) || !child.userData['isSpecialAura']) continue;
        const auraMat = child.material as THREE.MeshBasicMaterial;
        auraMat.opacity = (Math.sin(elapsed * 2.6 + id * 0.43) * 0.5 + 0.5) * 0.55 + 0.06;
      }
    }

    if (this.swapAnim.active) {
      this.swapAnim.t += dt / this.swapAnim.duration;
      if (this.swapAnim.t >= 1) {
        this.swapAnim.t = 1;
        this.swapAnim.active = false;
        if (this.swapAnim.b1) this.swapAnim.b1.renderOrder = BLOCK_RENDER_ORDER;
        if (this.swapAnim.b2) this.swapAnim.b2.renderOrder = BLOCK_RENDER_ORDER;
      }
      const t = this.swapAnim.back ? easeOutBack(this.swapAnim.t) : this.swapAnim.t;
      this.swapAnim.b1?.position.lerpVectors(this.swapAnim.from1, this.swapAnim.to1, t);
      this.swapAnim.b2?.position.lerpVectors(this.swapAnim.from2, this.swapAnim.to2, t);
    }

    this.dropAnims = this.dropAnims.filter(da => {
      da.t += dt / 0.24;
      if (da.t <= 0) return true;
      if (da.t >= 1) {
        da.mesh.position.y = da.toY;
        if (!da.landed) {
          da.landed = true;
          da.mesh.scale.set(1.18, 0.76, 1);
          setTimeout(() => {
            da.mesh.scale.set(0.92, 1.10, 1);
            setTimeout(() => { da.mesh.scale.set(1, 1, 1); }, 50);
          }, 40);
        }
        return false;
      }
      da.mesh.position.y = da.fromY + (da.toY - da.fromY) * easeInOut(da.t);
      return true;
    });

    if (this.camShake.intensity > 0.001) {
      this.camShake.intensity *= 0.86;
      const s = this.camShake.intensity;
      this.camera.position.set((Math.random()-0.5)*s, (Math.random()-0.5)*s, 10);
    } else if (this.camShake.intensity > 0) {
      this.camShake.intensity = 0;
      this.camera.position.set(0, 0, 10);
    }

    tickBlockMaterials(this.blockMaterials, elapsed);
    tickParticlePool(this.particlePool, dt);
    this.specialFX.tick(dt);
    this.ambientSystem.tick(dt);
    boardFrame.tick(dt, elapsed);

    this.renderer.render(this.scene, this.camera);
    this.css2d.render(this.scene, this.camera);
  };

  /* ────────── 좌표 변환 ────────── */
  screenToWorld(clientX: number, clientY: number): [number, number] {
    const rect = this.container.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0);
    vec.unproject(this.camera);
    return [vec.x, vec.y];
  }

  hitTestBlock(clientX: number, clientY: number): { row: number; col: number } | null {
    const rect = this.container.getBoundingClientRect();
    const ndc  = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hits = ray.intersectObjects([...this.blockMeshes.values()], false);
    if (hits.length === 0) return null;
    const obj = hits[0].object as THREE.Mesh;
    return { row: obj.userData['row'] as number, col: obj.userData['col'] as number };
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.blockMeshes.forEach((_, id) => this._removeMesh(id));
    this.specialFX.dispose();
    this.ambientSystem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.css2d.domElement.remove();
  }
}

export const board3d = new Board3D();
