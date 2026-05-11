/* src/game.js */
import * as THREE from 'three';
import { Mechanics } from './mechanics.js';
import { itemEmojis } from './ui.js';

function createItemTexture(emoji) {
  const cvs = document.createElement('canvas');
  cvs.width = 256; cvs.height = 256;
  const ctx = cvs.getContext('2d');
  ctx.font = '180px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 128, 140);
  const tex = new THREE.CanvasTexture(cvs);
  tex.generateMipmaps = true;
  return tex;
}

const emojiTextures = {};
Object.values(itemEmojis).forEach(e => emojiTextures[e] = createItemTexture(e));
emojiTextures['💎'] = createItemTexture('💎');

export const Renderer = {
  scene: null,
  camera: null,
  renderer: null,
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  tiles: [],
  particles: [],
  container: null,
  shakeDuration: 0,
  gridSpacing: 1.0,

  init() {
    this.container = document.getElementById('canvas-container');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfaf8f5);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.set(0, 10, 0);
    this.camera.lookAt(0, 0, 0);

    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    window.addEventListener('resize', () => {
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
      this.updateCamera(Mechanics.boardStats);
    });

    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e, canvas));

    this.animate();
  },

  updateCamera(stats) {
    if (!stats) stats = { minCol:0, maxCol:9, minRow:0, maxRow:9 };
    const cols = stats.maxCol - stats.minCol + 1;
    const rows = stats.maxRow - stats.minRow + 1;
    const activeSize = Math.max(cols, rows) * this.gridSpacing + 1.5;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    
    const aspect = w / h;
    let halfW, halfH;
    if (aspect > 1) { halfW = activeSize * aspect / 2; halfH = activeSize / 2; }
    else { halfW = activeSize / 2; halfH = activeSize / aspect / 2; }
    
    this.camera.left = -halfW; this.camera.right = halfW;
    this.camera.top = halfH; this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  },

  renderBoard(boardData, active_items, stats) {
    while(this.scene.children.length > 1) this.scene.remove(this.scene.children[this.scene.children.length - 1]);
    this.tiles = [];

    if (!stats) stats = { minCol:0, maxCol:9, minRow:0, maxRow:9 };
    const cols = stats.maxCol - stats.minCol + 1;
    const rows = stats.maxRow - stats.minRow + 1;
    const offsetX = (cols * this.gridSpacing) / 2 - (this.gridSpacing / 2);
    const offsetZ = (rows * this.gridSpacing) / 2 - (this.gridSpacing / 2);

    const tileGeo = new THREE.PlaneGeometry(1.0, 1.0);
    const edgesGeo = new THREE.EdgesGeometry(tileGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
    const tileMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee }); 
    const blockMat = new THREE.MeshBasicMaterial({ color: 0xcccccc }); 

    // Render multi-tile textures underneath
    active_items.forEach(item => {
      const itemCells = boardData.filter(c => c.item_instance_id === item.instanceId);
      if (itemCells.length === 0) return;
      let minC = 10, maxC = -1, minR = 10, maxR = -1;
      itemCells.forEach(c => {
        if (c.col < minC) minC = c.col; if (c.col > maxC) maxC = c.col;
        if (c.row < minR) minR = c.row; if (c.row > maxR) maxR = c.row;
      });
      const w = (maxC - minC + 1) * this.gridSpacing;
      const h = (maxR - minR + 1) * this.gridSpacing;
      const cx = (minC + maxC) / 2 - stats.minCol;
      const cz = (minR + maxR) / 2 - stats.minRow;
      const x = cx * this.gridSpacing - offsetX;
      const z = cz * this.gridSpacing - offsetZ;
      
      const emoji = itemEmojis[item.itemId] || '🎁';
      const tex = emojiTextures[emoji] || emojiTextures['💎'];
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
      const geo = new THREE.PlaneGeometry(w * 0.9, h * 0.9);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, -0.005, z);
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    });

    boardData.forEach((cell) => {
      if (cell.final_type === 'NULL') return;
      const x = (cell.col - stats.minCol) * this.gridSpacing - offsetX;
      const z = (cell.row - stats.minRow) * this.gridSpacing - offsetZ;

      if (cell.final_type === 'BLOCK') {
        const mesh = new THREE.Mesh(tileGeo, blockMat.clone());
        const edges = new THREE.LineSegments(edgesGeo, edgeMat);
        edges.position.z = 0.005; mesh.add(edges);
        mesh.position.set(x, 0, z); mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh); return;
      }
      
      const underGeo = new THREE.PlaneGeometry(1.0, 1.0);
      const underMat = new THREE.MeshBasicMaterial({ color: 0xfaf8f5 });
      const underMesh = new THREE.Mesh(underGeo, underMat);
      underMesh.position.set(x, -0.01, z); underMesh.rotation.x = -Math.PI / 2;
      const underEdges = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 }));
      underEdges.position.z = 0.001; underMesh.add(underEdges);
      this.scene.add(underMesh);

      if (cell.state === 'hidden') {
        const mesh = new THREE.Mesh(tileGeo, tileMat.clone());
        const edges = new THREE.LineSegments(edgesGeo, edgeMat);
        edges.position.z = 0.005; mesh.add(edges);
        mesh.position.set(x, 0, z); mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.tiles.push({ mesh, cell });
      }
    });

    this.updateCamera(stats);
  },

  onPointerDown(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    const validIntersects = intersects.filter(i => i.object.type === 'Mesh' && this.tiles.find(t => t.mesh === i.object));

    if (validIntersects.length > 0) {
      const object = validIntersects[0].object;
      const tile = this.tiles.find(t => t.mesh === object);
      if (tile && tile.cell.state === 'hidden') {
        Mechanics.dig(tile, object, e.clientX, e.clientY);
      }
    }
  },

  breakTile(object) {
    this.shakeDuration = 8;
    this.spawnParticles(object.position.x, object.position.z);
    
    let opacity = 1;
    const animateBreak = () => {
      opacity -= 0.15;
      object.material.transparent = true; object.material.opacity = opacity;
      object.scale.set(opacity, opacity, opacity);
      if (opacity <= 0) this.scene.remove(object);
      else requestAnimationFrame(animateBreak);
    };
    animateBreak();
  },

  spawnParticles(x, z) {
    const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x444444 }); 
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      mesh.position.set(x + (Math.random()-0.5)*0.5, 0.1, z + (Math.random()-0.5)*0.5);
      mesh.userData = {
        vx: (Math.random() - 0.5) * 0.2, vy: Math.random() * 0.2 + 0.1,
        vz: (Math.random() - 0.5) * 0.2, rot: Math.random() * 0.2
      };
      this.scene.add(mesh);
      this.particles.push(mesh);
    }
  },

  animate() {
    requestAnimationFrame(() => this.animate());
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.userData.vx; p.position.y += p.userData.vy; p.position.z += p.userData.vz;
      p.userData.vy -= 0.015; 
      p.rotation.x += p.userData.rot; p.rotation.y += p.userData.rot;
      if (p.position.y < -1) { this.scene.remove(p); this.particles.splice(i, 1); }
    }
    if (this.shakeDuration > 0) {
      this.camera.position.x = (Math.random() - 0.5) * 0.15;
      this.camera.position.z = (Math.random() - 0.5) * 0.15;
      this.shakeDuration--;
    } else {
      this.camera.position.x = 0; this.camera.position.z = 0;
    }
    this.renderer.render(this.scene, this.camera);
  }
};
