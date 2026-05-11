import * as THREE from 'three';

export let scene, camera, renderer;
export let boardGroup = new THREE.Group();
export let particlesGroup = new THREE.Group();

let shakeTime = 0;

export function initGame(containerId) {
  const container = document.getElementById(containerId);
  scene = new THREE.Scene();

  const aspect = container.clientWidth / container.clientHeight;
  const frustumSize = 10;
  camera = new THREE.OrthographicCamera(-frustumSize*aspect/2, frustumSize*aspect/2, frustumSize/2, -frustumSize/2, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(boardGroup);
  scene.add(particlesGroup);
}

export function centerCamera(boardData) {
  let minR = 10, maxR = 0, minC = 10, maxC = 0;
  let activeFound = false;
  for(let r=0; r<10; r++) {
    for(let c=0; c<10; c++) {
      const cell = boardData[r][c];
      if(cell.final_type === 'BOX' || cell.final_type === 'BLOCK') {
        activeFound = true;
        if(r < minR) minR = r;
        if(r > maxR) maxR = r;
        if(c < minC) minC = c;
        if(c > maxC) maxC = c;
      }
    }
  }
  if(!activeFound) { minR=0; maxR=9; minC=0; maxC=9; }
  
  const centerX = minC + (maxC - minC) / 2;
  const centerZ = minR + (maxR - minR) / 2;
  const width = maxC - minC + 1;
  const height = maxR - minR + 1;

  camera.position.set(centerX, 10, centerZ);
  camera.lookAt(centerX, 0, centerZ);

  const container = document.getElementById('canvas-container');
  const aspect = container.clientWidth / container.clientHeight;
  
  const margin = 1.0;
  const fW = (width + margin) / 2;
  const fH = (height + margin) / 2;
  const fSize = Math.max(fW, fH * aspect);

  camera.left = -fSize;
  camera.right = fSize;
  camera.top = fSize / aspect;
  camera.bottom = -fSize / aspect;
  camera.updateProjectionMatrix();
}

export function resizeCanvas() {
  if(!renderer || !camera) return;
  const container = document.getElementById('canvas-container');
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  const aspect = container.clientWidth / container.clientHeight;
  const fSize = camera.right;
  camera.left = -fSize;
  camera.right = fSize;
  camera.top = fSize / aspect;
  camera.bottom = -fSize / aspect;
  camera.updateProjectionMatrix();
}

export function shakeCamera() {
  shakeTime = 10;
}

export function spawnParticles(x, z) {
  const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
  for(let i=0; i<10; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + (Math.random()-0.5)*0.5, 0.5, z + (Math.random()-0.5)*0.5);
    mesh.userData = {
      vx: (Math.random()-0.5)*0.1,
      vy: Math.random()*0.2 + 0.1,
      vz: (Math.random()-0.5)*0.1
    };
    particlesGroup.add(mesh);
  }
}

let baseCamPos = new THREE.Vector3();

export function renderLoop() {
  requestAnimationFrame(renderLoop);
  
  if (shakeTime > 0) {
    if (shakeTime === 10) baseCamPos.copy(camera.position);
    camera.position.x = baseCamPos.x + (Math.random() - 0.5) * 0.2;
    camera.position.z = baseCamPos.z + (Math.random() - 0.5) * 0.2;
    shakeTime--;
    if (shakeTime === 0) camera.position.copy(baseCamPos);
  }

  for(let i=particlesGroup.children.length-1; i>=0; i--) {
    const p = particlesGroup.children[i];
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.userData.vy -= 0.015;
    if(p.position.y < -2) {
      particlesGroup.remove(p);
    }
  }

  renderer.render(scene, camera);
}
