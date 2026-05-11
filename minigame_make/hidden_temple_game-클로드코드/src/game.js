import * as THREE from 'three';

let renderer, scene, camera;
let shakeFrames = 0;
let shakeMag = 0;
const cameraBase = { x: 0, z: 0 };

export function initThree(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf8f5);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  resizeRenderer(container);
  window.addEventListener('resize', () => resizeRenderer(container));

  animate();
}

function resizeRenderer(container) {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  const aspect = w / h;
  const s = camera.top;
  camera.left = -s * aspect;
  camera.right = s * aspect;
  camera.updateProjectionMatrix();
}

export function setCameraSize(cols, rows) {
  const s = Math.max(cols, rows) * 0.5 + 0.75;
  camera.top = s; camera.bottom = -s;
  const container = renderer.domElement.parentElement;
  const aspect = container.clientWidth / container.clientHeight;
  camera.left = -s * aspect;
  camera.right = s * aspect;
  camera.updateProjectionMatrix();
}

export function getScene() { return scene; }
export function getRenderer() { return renderer; }
export function getCamera() { return camera; }

export function triggerShake(mag = 0.05, frames = 8) {
  shakeMag = mag;
  shakeFrames = frames;
}

function animate() {
  requestAnimationFrame(animate);
  if (shakeFrames > 0) {
    camera.position.x = cameraBase.x + (Math.random() - 0.5) * shakeMag * 2;
    camera.position.z = cameraBase.z + (Math.random() - 0.5) * shakeMag * 2;
    shakeFrames--;
    if (shakeFrames === 0) { camera.position.x = cameraBase.x; camera.position.z = cameraBase.z; }
  }
  renderer.render(scene, camera);
}

export function spawnParticles(scene, worldX, worldZ) {
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const particles = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(worldX + (Math.random()-0.5)*0.3, 0.1, worldZ + (Math.random()-0.5)*0.3);
    m.userData.vx = (Math.random()-0.5)*0.12;
    m.userData.vz = (Math.random()-0.5)*0.12;
    m.userData.vy = Math.random()*0.06 + 0.02;
    scene.add(m);
    particles.push(m);
  }
  let frame = 0;
  function tick() {
    frame++;
    particles.forEach(p => {
      p.position.x += p.userData.vx;
      p.position.z += p.userData.vz;
      p.position.y += p.userData.vy;
      p.userData.vy -= 0.004;
    });
    if (frame < 40) requestAnimationFrame(tick);
    else particles.forEach(p => scene.remove(p));
  }
  tick();
}
