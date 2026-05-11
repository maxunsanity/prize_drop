// Three.js init, OrthographicCamera, render loop, camera shake, particles
import * as THREE from 'three';

let scene, camera, renderer, container;
const particles = [];
let baseX = 0, baseY = 0;
let shakeFrames = 0, shakeMag = 0;

export function initThree() {
  container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf8f5);

  camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '';
  renderer.domElement.style.height = '';

  new ResizeObserver(() => onResize()).observe(container);
  window.addEventListener('resize', onResize);
}

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '';
  renderer.domElement.style.height = '';
  window.dispatchEvent(new Event('ht-board-resize'));
}

// minCol/maxCol/minRow/maxRow are 1-indexed
export function setCameraFromBounds(minCol, maxCol, minRow, maxRow) {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) {
    requestAnimationFrame(() => setCameraFromBounds(minCol, maxCol, minRow, maxRow));
    return;
  }
  const aspect = w / h;

  // World positions: tile at col c, row r → (c-1, -(r-1))
  const xMin = minCol - 1;
  const xMax = maxCol - 1;
  const yMax = -(minRow - 1); // small row = large y
  const yMin = -(maxRow - 1);

  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;

  const gridW = xMax - xMin + 1;
  const gridH = yMax - yMin + 1;
  const pad = 0.75;

  let hW = gridW / 2 + pad;
  let hH = gridH / 2 + pad;

  if (hW / hH < aspect) hW = hH * aspect;
  else hH = hW / aspect;

  camera.left   = -hW;
  camera.right  = +hW;
  camera.top    = +hH;
  camera.bottom = -hH;
  camera.position.set(cx, cy, 10);
  camera.lookAt(cx, cy, 0);
  camera.updateProjectionMatrix();

  baseX = cx;
  baseY = cy;
}

export function triggerShake(mag = 0.1, frames = 7) {
  shakeMag = mag;
  shakeFrames = frames;
}

export function spawnParticles(wx, wy, count = 8) {
  const colors = [0xc9a96e, 0xe8c77a, 0x9a7050, 0xfff0b0, 0xd4b896];
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      wx + (Math.random() - 0.5) * 0.5,
      wy + (Math.random() - 0.5) * 0.5,
      0.5
    );
    scene.add(mesh);
    particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.1,
      vy: Math.random() * 0.08 + 0.02,
      vz: Math.random() * 0.04 + 0.01,
      life: 32,
    });
  }
}

function tickParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy -= 0.015;
    p.vz += 0.003;
    p.mesh.position.x += p.vx;
    p.mesh.position.y += p.vy;
    p.mesh.position.z += p.vz;
    p.life--;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

export function startRenderLoop() {
  function loop() {
    requestAnimationFrame(loop);
    if (shakeFrames > 0) {
      camera.position.x = baseX + (Math.random() - 0.5) * shakeMag;
      camera.position.y = baseY + (Math.random() - 0.5) * shakeMag;
      shakeFrames--;
    } else {
      camera.position.x = baseX;
      camera.position.y = baseY;
    }
    tickParticles();
    renderer.render(scene, camera);
  }
  loop();
}

export function getScene()     { return scene; }
export function getCamera()    { return camera; }
export function getRenderer()  { return renderer; }
export function getContainer() { return container; }
