import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameSnapshot } from "../MonopolyGameContext";
import { createStandardDie, quatForTopValue } from "./createStandardDie";
import { makeCheckerFloorTexture } from "./checkerFloorTexture";
import { makeSketchShadowTexture } from "./shadowTexture";

// --- 애니메이션 상수 ---
const ROLL_MS = 1400;
const FAST_LAND_MS = 320;
const IDLE_BOB_HZ = 0.85;
const DIE_SIZE = 0.45;
const DIE_REST_Y = DIE_SIZE / 2;
const DIE_SPREAD_X = 0.58;

const PHASE_FLY_IN_END = 0.65;
const DROP_START = 0.52;
const DROP_END = 0.68;
const DROP_FAST_START = 0.28;
const DROP_FAST_END = 0.50;
const BOUNCE_END = 0.88;
const AIR_LIFT_MUL = 3.6;
const BOUNCE_H1 = 0.40;
const BOUNCE_H2 = 0.14;

const CAM_FOV_IDLE = 44;
const CAM_Y_BASE = 1.58;
const CAM_Z_IDLE = 3.62;
const LOOK_Y_BASE = DIE_REST_Y * 0.82;

const ZOOM_DELAY_MS = 500;

// --- 임팩트 링 텍스처 생성 ---
function makeImpactRingTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0.5, Math.PI * 2 + 0.5);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// --- 유틸리티 함수 ---
function smoothstep01(t: number): number {
  return t * t * (3 - 2 * t);
}

function landingProgress(u: number, fast: boolean): number {
  const x = Math.min(1, Math.max(0, u));
  const ds = fast ? DROP_FAST_START : DROP_START;
  const de = fast ? DROP_FAST_END : DROP_END;
  if (x <= ds) return 0;
  return Math.min(1, (x - ds) / Math.max(1e-6, de - ds));
}


function rollFlyInMix(u: number): number {
  const t = Math.min(1, Math.max(0, u / PHASE_FLY_IN_END));
  return smoothstep01(t);
}

function randomRollLayout() {
  const spread = DIE_SPREAD_X + (Math.random() - 0.5) * 0.22;
  const shift = (Math.random() - 0.5) * 0.18;
  const restAz = (Math.random() - 0.5) * 0.40;
  const restBz = (Math.random() - 0.5) * 0.40;
  const restAx = -spread + shift;
  const restBx = spread + shift;
  const sideA = Math.random() > 0.5 ? -1 : 1;
  const flyAx = restAx + sideA * (2.2 + Math.random() * 1.5);
  const flyBx = restBx + (-sideA) * (2.2 + Math.random() * 1.5);
  const flyAz = restAz + (Math.random() - 0.2) * 3.5; 
  const flyBz = restBz + (Math.random() - 0.2) * 3.5;
  return { restAx, restBx, restAz, restBz, flyAx, flyBx, flyAz, flyBz };
}

function rollSettleMix(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  const t = Math.max(0, (x - DROP_START) / 0.16);
  if (t <= 0) return 0;
  const s = smoothstep01(Math.min(1, t));
  return 1 - Math.pow(1 - s, 1.1);
}

function rollTumbleMix(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return Math.max(0, 1 - smoothstep01((x - 0.02) / (DROP_START - 0.02)));
}

function timeScaleForRoll(u: number, fast: boolean): number {
  const x = Math.min(1, Math.max(0, u));
  if (fast) return x;
  if (x < 0.3) return x * 1.1;
  if (x > 0.7) return 0.77 + (x - 0.7) * 0.76;
  return 0.33 + (x - 0.3) * 1.1;
}

interface RollAnimState {
  startTime: number;
  d1: number;
  d2: number;
  q0a: THREE.Quaternion;
  q0b: THREE.Quaternion;
  spinAX: number;
  spinAY: number;
  spinAZ: number;
  spinBX: number;
  spinBY: number;
  spinBZ: number;
  fastLand: boolean;
  restAx: number;
  restBx: number;
  restAz: number;
  restBz: number;
  flyAx: number;
  flyBx: number;
  flyAz: number;
  flyBz: number;
  liftMul: number;
  stagger: number;
  landedA: boolean;
  landedB: boolean;
}

interface Props {
  assistCaption?: string;
}

export const MonopolyDiceCanvas: React.FC<Props> = ({ assistCaption }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const snap = useGameSnapshot();
  const snapRef = useRef(snap);
  useEffect(() => { snapRef.current = snap; }, [snap]);

  const rollAnimRef = useRef<RollAnimState | null>(null);
  const lastStableRef = useRef({ d1: 1, d2: 1 });
  const rollEpochPrev = useRef(-1);
  const resultZoomRef = useRef(0);
  const lastZoomReachedRef = useRef(false);
  const zoomShakeRef = useRef(0);
  
  const lastPosRef = useRef(snap.pos);
  const isMovingRef = useRef(false);
  const movingStartTimeRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAM_FOV_IDLE, 1, 0.1, 40);
    camera.position.set(0, CAM_Y_BASE, CAM_Z_IDLE);
    camera.lookAt(0, LOOK_Y_BASE, 0);

    const amb = new THREE.AmbientLight(0xfff8f0, 0.55);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xfffdf5, 1.6);
    key.position.set(2.2, 4.5, 3.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8eeff, 0.4);
    fill.position.set(-3, 1.5, -2);
    scene.add(fill);

    const floorMap = makeCheckerFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.65),
      new THREE.MeshStandardMaterial({ map: floorMap, color: 0xffffff, roughness: 0.98, metalness: 0.0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -0.12);
    scene.add(floor);

    const dieA = createStandardDie(DIE_SIZE);
    const dieB = createStandardDie(DIE_SIZE);
    scene.add(dieA, dieB);

    const ptA = new THREE.PointLight(0xfff5e0, 3.5, 2.2);
    const ptB = new THREE.PointLight(0xfff5e0, 3.5, 2.2);
    scene.add(ptA, ptB);

    const shadowTex = makeSketchShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(DIE_SIZE * 2.2, DIE_SIZE * 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.3, depthWrite: false });
    const shadowA = new THREE.Mesh(shadowGeo, shadowMat);
    const shadowB = new THREE.Mesh(shadowGeo, shadowMat.clone());
    shadowA.rotation.x = shadowB.rotation.x = -Math.PI / 2;
    shadowA.position.y = shadowB.position.y = 0.01;
    scene.add(shadowA, shadowB);

    // 임팩트 링 메시
    const ringTex = makeImpactRingTexture();
    const ringGeo = new THREE.PlaneGeometry(DIE_SIZE * 2.5, DIE_SIZE * 2.5);
    const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, depthWrite: false });
    const ringA = new THREE.Mesh(ringGeo, ringMat);
    const ringB = new THREE.Mesh(ringGeo, ringMat.clone());
    ringA.rotation.x = ringB.rotation.x = -Math.PI / 2;
    ringA.position.y = ringB.position.y = 0.015;
    scene.add(ringA, ringB);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    resize();

    let raf = 0;
    const qtA = new THREE.Quaternion(), qtB = new THREE.Quaternion(), qSpinA = new THREE.Quaternion(), qSpinB = new THREE.Quaternion(), qTmp = new THREE.Quaternion();
    const eA = new THREE.Euler(), eB = new THREE.Euler();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const curSnap = snapRef.current as any;
      if (!curSnap) return;

      if (curSnap.pos !== lastPosRef.current) {
        if (!isMovingRef.current) movingStartTimeRef.current = now;
        isMovingRef.current = true;
        lastPosRef.current = curSnap.pos;
      } else if (curSnap.phase !== "rolling" && curSnap.phase !== "moving") {
        isMovingRef.current = false;
      }

      if (curSnap.phase === "rolling" && curSnap.roll_epoch !== rollEpochPrev.current) {
        const layout = randomRollLayout();
        rollAnimRef.current = {
          startTime: now, d1: curSnap.d1, d2: curSnap.d2,
          q0a: quatForTopValue(lastStableRef.current.d1), q0b: quatForTopValue(lastStableRef.current.d2),
          spinAX: 10 + Math.random() * 8, spinAY: 10 + Math.random() * 8, spinAZ: 9 + Math.random() * 9,
          spinBX: 9 + Math.random() * 9, spinBY: 10 + Math.random() * 8, spinBZ: 10 + Math.random() * 8,
          fastLand: false,
          liftMul: AIR_LIFT_MUL * (0.55 + Math.random() * 0.45),
          stagger: 0.015 + Math.random() * 0.035,
          landedA: false, landedB: false,
          ...layout,
        };
        rollEpochPrev.current = curSnap.roll_epoch;
      }
      if (curSnap.phase !== "rolling" && rollAnimRef.current) {
        lastStableRef.current = { d1: curSnap.d1, d2: curSnap.d2 };
        rollAnimRef.current = null;
      }

      const anim = rollAnimRef.current;
      if (anim) {
        const dur = anim.fastLand ? FAST_LAND_MS : ROLL_MS;
        const uEff = timeScaleForRoll(Math.min(1, Math.max(0, (now - anim.startTime) / dur)), anim.fastLand);
        const fk = rollFlyInMix(uEff);
        const liftA = DIE_SIZE * anim.liftMul;
        const liftB = DIE_SIZE * anim.liftMul * (0.9 + Math.random() * 0.2);
        const ds = anim.fastLand ? DROP_FAST_START : DROP_START;
        const de = anim.fastLand ? DROP_FAST_END : DROP_END;

        const getH = (u: number, lift: number) => {
          if (u < ds) return lift * smoothstep01(Math.min(1, (u / ds) * 1.1));
          if (u < de) return lift * (1 - Math.pow((u - ds) / (de - ds), 1.65));
          if (!anim.fastLand && u < BOUNCE_END) {
            const tb = (u - de) / (BOUNCE_END - de);
            const mid = 0.42;
            if (tb < mid) return DIE_SIZE * BOUNCE_H1 * Math.sin((tb / mid) * Math.PI);
            return DIE_SIZE * BOUNCE_H2 * Math.sin(((tb - mid) / (1 - mid)) * Math.PI);
          }
          return 0;
        };

        const uB = Math.max(0, uEff - anim.stagger);
        const yA = DIE_REST_Y + getH(uEff, liftA);
        const yB = DIE_REST_Y + getH(uB, liftB);

        // 착지 순간 임팩트 체크
        if (uEff >= de && !anim.landedA) { anim.landedA = true; (ringA.material as THREE.MeshBasicMaterial).opacity = 0.8; ringA.position.set(dieA.position.x, 0.015, dieA.position.z); ringA.scale.set(0.6, 0.6, 1); }
        if (uB >= de && !anim.landedB) { anim.landedB = true; (ringB.material as THREE.MeshBasicMaterial).opacity = 0.8; ringB.position.set(dieB.position.x, 0.015, dieB.position.z); ringB.scale.set(0.6, 0.6, 1); }

        dieA.position.set(THREE.MathUtils.lerp(anim.flyAx, anim.restAx, fk), yA, THREE.MathUtils.lerp(anim.flyAz, anim.restAz, fk));
        dieB.position.set(THREE.MathUtils.lerp(anim.flyBx, anim.restBx, fk), yB, THREE.MathUtils.lerp(anim.flyBz, anim.restBz, fk));

        const kT = rollTumbleMix(uEff), kTb = rollTumbleMix(uB);
        const kSettle = rollSettleMix(uEff), kSettleB = rollSettleMix(uB);
        eA.set(Math.PI * 2 * kT * anim.spinAX, Math.PI * 2 * kT * anim.spinAY, Math.PI * 2 * kT * anim.spinAZ, "XYZ");
        eB.set(Math.PI * 2 * kTb * anim.spinBX, Math.PI * 2 * kTb * anim.spinBY, Math.PI * 2 * kTb * anim.spinBZ, "XYZ");
        qSpinA.setFromEuler(eA); qSpinB.setFromEuler(eB);
        qTmp.multiplyQuaternions(qSpinA, anim.q0a); dieA.quaternion.slerpQuaternions(qTmp, quatForTopValue(anim.d1), kSettle);
        qTmp.multiplyQuaternions(qSpinB, anim.q0b); dieB.quaternion.slerpQuaternions(qTmp, quatForTopValue(anim.d2), kSettleB);

        const dropProg = landingProgress(uEff, anim.fastLand);
        const onDeck = smoothstep01((dropProg - 0.72) / 0.28);
        const wobA = (1 - kSettle) * 0.09 * Math.sin(uEff * Math.PI * 14.0) * (0.28 + 0.72 * onDeck);
        const wobB = (1 - kSettleB) * 0.09 * Math.sin(uB * Math.PI * 14.0 + 2.05) * (0.28 + 0.72 * onDeck);
        eA.set(wobA * 0.45, wobA * 0.95, wobA * -0.35, "XYZ"); eB.set(wobB * 0.5, wobB * 0.88, wobB * -0.32, "XYZ");
        qSpinA.setFromEuler(eA); qSpinB.setFromEuler(eB); dieA.quaternion.multiply(qSpinA); dieB.quaternion.multiply(qSpinB);
      } else {
        const isShowing = curSnap.phase === "rolling" || curSnap.phase === "moving" || curSnap.phase === "result" || !!curSnap.modal;
        if (isShowing) {
          if (curSnap.phase === "rolling" && !anim) {
            dieA.position.set(10, 10, 10); dieB.position.set(-10, 10, 10);
          } else {
            qtA.copy(quatForTopValue(curSnap.d1)); qtB.copy(quatForTopValue(curSnap.d2));
            const bob = Math.sin(now * 0.001 * Math.PI * 2 * IDLE_BOB_HZ);
            dieA.position.y = dieB.position.y = DIE_REST_Y + bob * 0.015;
            dieA.quaternion.slerp(qtA, 0.08); dieB.quaternion.slerp(qtB, 0.08);
          }
        } else {
          dieA.position.set(10, 10, 10); dieB.position.set(-10, 10, 10);
        }
      }

      // 링 효과 페이드 아웃
      [ringA, ringB].forEach(r => {
        const m = r.material as THREE.MeshBasicMaterial;
        if (m.opacity > 0) { m.opacity -= 0.025; r.scale.x = r.scale.y += 0.015; }
      });

      // --- 카메라 줌인 & 쉐이크 ---
      const hasPassedDelay = isMovingRef.current && (now - movingStartTimeRef.current > ZOOM_DELAY_MS);
      const isZooming = hasPassedDelay || curSnap.phase === "result" || !!curSnap.modal;
      const targetZoom = isZooming ? 1 : 0;
      const zoomStep = 0.065; 

      if (resultZoomRef.current < targetZoom) {
        resultZoomRef.current = Math.min(targetZoom, resultZoomRef.current + zoomStep);
        if (resultZoomRef.current === 1 && !lastZoomReachedRef.current) { zoomShakeRef.current = 1.0; lastZoomReachedRef.current = true; }
      } else if (resultZoomRef.current > targetZoom) {
        resultZoomRef.current = Math.max(targetZoom, resultZoomRef.current - zoomStep);
        lastZoomReachedRef.current = false;
      }

      // 쉐이크 감쇄
      if (zoomShakeRef.current > 0) zoomShakeRef.current *= 0.88;
      const shk = zoomShakeRef.current * 0.018;
      const shkX = (Math.random() - 0.5) * shk, shkY = (Math.random() - 0.5) * shk;

      const z = resultZoomRef.current;
      camera.fov = CAM_FOV_IDLE;
      camera.position.set(shkX, CAM_Y_BASE + shkY, THREE.MathUtils.lerp(CAM_Z_IDLE, CAM_Z_IDLE - 1.25, z));
      camera.lookAt(shkX, LOOK_Y_BASE + shkY, 0);
      camera.updateProjectionMatrix();

      ptA.position.set(dieA.position.x, dieA.position.y + 0.95, dieA.position.z + 0.15);
      ptB.position.set(dieB.position.x, dieB.position.y + 0.95, dieB.position.z + 0.15);
      const updateShadow = (shadow: THREE.Mesh, die: THREE.Mesh) => {
        shadow.position.x = die.position.x; shadow.position.z = die.position.z;
        const h = Math.max(0, die.position.y - DIE_REST_Y);
        const s = Math.max(0.4, 1 - h * 0.4); shadow.scale.set(s, s, 1);
        (shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.35 - h * 0.15);
      };
      updateShadow(shadowA, dieA); updateShadow(shadowB, dieB);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); mount.removeChild(renderer.domElement); scene.clear(); renderer.dispose(); };
  }, []);

  return (
    <div className="dice-three-mount" ref={mountRef}>
      <span className="dice-assist-caption">{assistCaption || `Dice: ${(snap as any)?.d1}, ${(snap as any)?.d2}`}</span>
    </div>
  );
};
