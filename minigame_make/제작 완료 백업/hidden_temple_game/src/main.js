import * as THREE from 'three';
import './style.css';
import eventCsv from '../ht_event_config.csv?raw';
import itemCsv from '../ht_item_config.csv?raw';
import stageCsv from '../ht_stage_config.csv?raw';

const itemEmojis = { 1001: '🏺', 1002: '🗝️', 1003: '⚔️', 1004: '🪖', 1005: '👑', 1006: '🛠️' };
const doorEmojis = ['🚪', '🏛️', '⛩️', '🏰', '🗿', '🌌'];

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
Object.values(itemEmojis).forEach(emoji => emojiTextures[emoji] = createItemTexture(emoji));
emojiTextures['💎'] = createItemTexture('💎');

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        if (!line.trim()) return null;
        const values = [];
        let inQuotes = false; let currentVal = '';
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { values.push(currentVal.trim()); currentVal = ''; }
            else currentVal += char;
        }
        values.push(currentVal.trim());
        const obj = {};
        headers.forEach((h, i) => {
            let val = values[i];
            if (!isNaN(val) && val !== '') val = Number(val);
            obj[h] = val;
        });
        return obj;
    }).filter(Boolean);
}

const eventConfigRows = parseCSV(eventCsv);
const eventConfig = {};
eventConfigRows.forEach(row => { eventConfig[row.config_key] = row.value; });

const itemConfigRows = parseCSV(itemCsv);
const itemConfig = {};
itemConfigRows.forEach(row => {
    if (!itemConfig[row.item_id]) itemConfig[row.item_id] = [];
    itemConfig[row.item_id].push(row);
});

const stageConfig = parseCSV(stageCsv);

export const GameConfig = { tileSize: 1.0, gridSpacing: 1.0 }; // Exactly touching

let playerState = {
    pickaxe_count: eventConfig.pickaxe_debug_start || 9999,
    stage: 1, gems_collected: 0, tiles_remaining: 0, event_completed: false, active_items: [], boardStats: null
};

const savedState = localStorage.getItem('ht_player_state');
if (savedState) {
    playerState = JSON.parse(savedState);
    if (!playerState.active_items) playerState.active_items = [];
    if (playerState.tiles_remaining === undefined) playerState.tiles_remaining = 0;
} else {
    savePlayerState();
}

function savePlayerState() { localStorage.setItem('ht_player_state', JSON.stringify(playerState)); }

let boardGrid = [];

function generateBoard(stageId) {
    const stage = stageConfig.find(s => s.stage_id === stageId);
    if (!stage) return;
    boardGrid = []; playerState.active_items = [];
    let boxCount = 0;

    let minCol = 10, maxCol = -1, minRow = 10, maxRow = -1;

    for(let row=1; row<=10; row++) {
        for(let col=1; col<=10; col++) {
            const colType = stage[`col_${col}`], rowType = stage[`row_${row}`];
            let finalType = 'BOX';
            if (colType === 'NULL' || rowType === 'NULL') finalType = 'NULL';
            else if (colType === 'BLOCK' || rowType === 'BLOCK') finalType = 'BLOCK';
            
            if (finalType !== 'NULL') {
                if (col-1 < minCol) minCol = col-1;
                if (col-1 > maxCol) maxCol = col-1;
                if (row-1 < minRow) minRow = row-1;
                if (row-1 > maxRow) maxRow = row-1;
            }
            if (finalType === 'BOX') boxCount++;
            boardGrid.push({ index: (row-1)*10+(col-1), row: row-1, col: col-1, final_type: finalType, content: 'EMPTY', item_instance_id: 0, state: 'hidden' });
        }
    }
    playerState.tiles_remaining = boxCount;
    playerState.boardStats = { minCol, maxCol, minRow, maxRow };

    let instanceId = 1;
    const stageItemIds = String(stage.item_ids).split(',').map(id => id.trim());
    
    stageItemIds.forEach(itemId => {
        const itemTiles = itemConfig[itemId];
        if (!itemTiles) return;
        let placed = false, attempts = 0;
        while (!placed && attempts < 100) {
            const originRow = Math.floor(Math.random() * 10), originCol = Math.floor(Math.random() * 10);
            const cells = itemTiles.map(t => {
                const r = originRow + t.offset_row, c = originCol + t.offset_col;
                if (r >= 0 && r < 10 && c >= 0 && c < 10) return r * 10 + c;
                return -1;
            });
            if (cells.every(idx => idx !== -1 && boardGrid[idx] && boardGrid[idx].final_type === 'BOX' && boardGrid[idx].content === 'EMPTY')) {
                cells.forEach(idx => { boardGrid[idx].content = 'ITEM'; boardGrid[idx].item_instance_id = instanceId; });
                playerState.active_items.push({ instanceId, itemId, totalTiles: cells.length, revealedTiles: 0, filled: false, emoji: itemEmojis[itemId] || '💎' });
                instanceId++; placed = true;
            }
            attempts++;
        }
    });

    let boxCells = boardGrid.filter(c => c.final_type === 'BOX' && c.content === 'EMPTY');
    for(let i=0; i<Math.min(stage.gem_count, boxCells.length); i++) {
        const rndIdx = Math.floor(Math.random() * boxCells.length);
        boxCells[rndIdx].content = 'GEM'; boxCells.splice(rndIdx, 1);
    }
    boxCells = boardGrid.filter(c => c.final_type === 'BOX' && c.content === 'EMPTY');
    const rewardCount = Math.floor(boxCells.length * (eventConfig.empty_reward_default_ratio || 0.15));
    for(let i=0; i<rewardCount; i++) {
        const rndIdx = Math.floor(Math.random() * boxCells.length);
        boxCells[rndIdx].content = 'EMPTY_REWARD'; boxCells.splice(rndIdx, 1);
    }

    localStorage.setItem(`ht_board_state_stage_${stageId}`, JSON.stringify(boardGrid));
    savePlayerState();
}

function loadOrGenerateBoard() {
    const savedBoard = localStorage.getItem(`ht_board_state_stage_${playerState.stage}`);
    if (savedBoard && JSON.parse(savedBoard).length === 100 && playerState.active_items && playerState.active_items.length > 0) {
        boardGrid = JSON.parse(savedBoard);
        if (!playerState.boardStats) {
            let minCol = 10, maxCol = -1, minRow = 10, maxRow = -1;
            boardGrid.forEach(c => {
                if (c.final_type !== 'NULL') {
                    if (c.col < minCol) minCol = c.col;
                    if (c.col > maxCol) maxCol = c.col;
                    if (c.row < minRow) minRow = c.row;
                    if (c.row > maxRow) maxRow = c.row;
                }
            });
            playerState.boardStats = { minCol, maxCol, minRow, maxRow };
        }
    } else generateBoard(playerState.stage);
}
loadOrGenerateBoard();

// --- Three.js Setup ---
const canvas = document.querySelector('#game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfaf8f5); // Match paper color

let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
let shakeDuration = 0; // Camera shake state

function updateCamera() {
    const stats = playerState.boardStats || { minCol:0, maxCol:9, minRow:0, maxRow:9 };
    const cols = stats.maxCol - stats.minCol + 1;
    const rows = stats.maxRow - stats.minRow + 1;
    const activeSize = Math.max(cols, rows) * GameConfig.gridSpacing + 1.5;

    const container = document.getElementById('canvas-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    const aspect = w / h;
    let halfW, halfH;
    if (aspect > 1) { halfW = activeSize * aspect / 2; halfH = activeSize / 2; }
    else { halfW = activeSize / 2; halfH = activeSize / aspect / 2; }
    camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
    camera.updateProjectionMatrix();
}
camera.position.set(0, 10, 0); camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
updateCamera();

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); scene.add(ambientLight);

const tiles = [];
let particles = [];
const tileGeo = new THREE.PlaneGeometry(GameConfig.tileSize, GameConfig.tileSize);

// Minimal sketch style materials
const tileMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee }); 
const blockMat = new THREE.MeshBasicMaterial({ color: 0xcccccc }); 
const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const particleMat = new THREE.MeshBasicMaterial({ color: 0x444444 }); 
const edgesGeo = new THREE.EdgesGeometry(tileGeo);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }); // Black outline

function renderBoard() {
    while(scene.children.length > 1) { // 1 is ambientLight
        scene.remove(scene.children[scene.children.length - 1]);
    }
    tiles.length = 0;
    
    const stats = playerState.boardStats || { minCol:0, maxCol:9, minRow:0, maxRow:9 };
    const cols = stats.maxCol - stats.minCol + 1;
    const rows = stats.maxRow - stats.minRow + 1;
    const offsetX = (cols * GameConfig.gridSpacing) / 2 - (GameConfig.gridSpacing / 2);
    const offsetZ = (rows * GameConfig.gridSpacing) / 2 - (GameConfig.gridSpacing / 2);
    
    // Draw Item Base Planes First
    playerState.active_items.forEach(item => {
        const itemCells = boardGrid.filter(c => c.item_instance_id === item.instanceId);
        if (itemCells.length === 0) return;
        let minC = 10, maxC = -1, minR = 10, maxR = -1;
        itemCells.forEach(c => {
            if (c.col < minC) minC = c.col; if (c.col > maxC) maxC = c.col;
            if (c.row < minR) minR = c.row; if (c.row > maxR) maxR = c.row;
        });
        const w = (maxC - minC + 1) * GameConfig.gridSpacing;
        const h = (maxR - minR + 1) * GameConfig.gridSpacing;
        const cx = (minC + maxC) / 2 - stats.minCol;
        const cz = (minR + maxR) / 2 - stats.minRow;
        const x = cx * GameConfig.gridSpacing - offsetX;
        const z = cz * GameConfig.gridSpacing - offsetZ;
        
        const tex = emojiTextures[item.emoji] || emojiTextures['💎'];
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
        const geo = new THREE.PlaneGeometry(w * 0.9, h * 0.9);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, -0.005, z);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
    });

    boardGrid.forEach((cell) => {
        if (cell.final_type === 'NULL') return;
        const x = (cell.col - stats.minCol) * GameConfig.gridSpacing - offsetX;
        const z = (cell.row - stats.minRow) * GameConfig.gridSpacing - offsetZ;

        if (cell.final_type === 'BLOCK') {
            const mesh = new THREE.Mesh(tileGeo, blockMat.clone());
            const edges = new THREE.LineSegments(edgesGeo, edgeMat);
            // Fix Z-fighting by raising edges slightly
            edges.position.z = 0.005; 
            mesh.add(edges);
            mesh.position.set(x, 0, z); mesh.rotation.x = -Math.PI / 2;
            scene.add(mesh); return;
        }
        
        // Hole base (paper white to blend in, with a faint border)
        const underGeo = new THREE.PlaneGeometry(GameConfig.tileSize, GameConfig.tileSize);
        const underMat = new THREE.MeshBasicMaterial({ color: 0xfaf8f5 });
        const underMesh = new THREE.Mesh(underGeo, underMat);
        underMesh.position.set(x, -0.01, z); underMesh.rotation.x = -Math.PI / 2;
        
        // Inner hole border
        const underEdges = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 }));
        underEdges.position.z = 0.001;
        underMesh.add(underEdges);
        scene.add(underMesh);

        if (cell.state === 'hidden') {
            const mesh = new THREE.Mesh(tileGeo, tileMat.clone());
            const edges = new THREE.LineSegments(edgesGeo, edgeMat);
            edges.position.z = 0.005; // Raise edges slightly above the tile to prevent z-fighting
            mesh.add(edges);
            mesh.position.set(x, 0, z); mesh.rotation.x = -Math.PI / 2;
            scene.add(mesh); tiles.push({ mesh, cell });
        }
    });
}
renderBoard();

// --- UI Updates ---
function updateUI() {
    const stage = stageConfig.find(s => s.stage_id === playerState.stage) || stageConfig[0];
    const pickaxeEl = document.getElementById('ui-pickaxe');
    if(pickaxeEl) pickaxeEl.innerText = `⛏️ ${playerState.pickaxe_count}`;
    
    const gemEl = document.getElementById('ui-gem-counter');
    if(gemEl) gemEl.innerText = `💎 ${playerState.gems_collected} / ${stage.gem_count}`;
    
    const door = document.querySelector('.door-inner');
    if (door) {
        door.innerText = doorEmojis[playerState.stage - 1] || '🚪';
    }

    // Chests and Lines
    for(let i=1; i<=5; i++) {
        const chest = document.getElementById(`chest-${i}`);
        const line = document.getElementById(`line-${i}`);
        if(chest) {
            chest.className = 'chest';
            if (i < playerState.stage) chest.classList.add('done');
            else if (i === playerState.stage) chest.classList.add('active');
        }
        if(line) {
            line.className = 'line';
            if (i < playerState.stage) line.classList.add('done');
            else if (i === playerState.stage) line.classList.add('active');
        }
    }

    const slotBar = document.getElementById('ui-item-slots');
    if (slotBar) {
        slotBar.innerHTML = '';
        playerState.active_items.forEach(item => {
            const slot = document.createElement('div');
            slot.className = `item-slot ${item.filled ? 'filled' : ''}`;
            slot.id = `item-slot-${item.instanceId}`;
            if (!item.filled) {
                slot.innerHTML = `<span style="font-size:30px; opacity:0.3; filter:grayscale(100%);">${item.emoji}</span>
                                  <span style="font-size:10px; color:#555; position:absolute; bottom:2px; font-weight:bold;">${item.totalTiles}칸</span>`;
            } else {
                slot.innerText = item.emoji;
            }
            slotBar.appendChild(slot);
        });
    }
}
updateUI();

// --- Animations ---
function spawnParticles(x, z) {
    for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(particleGeo, particleMat);
        mesh.position.set(x + (Math.random()-0.5)*0.5, 0.1, z + (Math.random()-0.5)*0.5);
        mesh.userData = {
            vx: (Math.random() - 0.5) * 0.2,
            vy: Math.random() * 0.2 + 0.1,
            vz: (Math.random() - 0.5) * 0.2,
            rot: Math.random() * 0.2
        };
        scene.add(mesh);
        particles.push(mesh);
    }
}

function playAni005(x, y) {
    const popup = document.createElement('div');
    popup.innerText = '+1 💎'; popup.className = 'popup-anim text-green';
    popup.style.left = x + 'px'; popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function playAni006(x, y) {
    const popup = document.createElement('div');
    popup.innerText = '🪙'; popup.className = 'popup-anim';
    popup.style.left = x + 'px'; popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function checkStageClear() {
    const itemsAllFilled = playerState.active_items.length > 0 && playerState.active_items.every(i => i.filled);
    if (itemsAllFilled) {
        playerState.tiles_remaining = 0; // Lock board
        
        const door = document.querySelector('.door-inner');
        const doorRect = door.getBoundingClientRect();
        
        // Items fly up to door
        const flyingPromises = playerState.active_items.map((item, idx) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const slot = document.getElementById(`item-slot-${item.instanceId}`);
                    if (!slot) { resolve(); return; }
                    const slotRect = slot.getBoundingClientRect();
                    const flyEl = document.createElement('div');
                    flyEl.innerText = item.emoji;
                    flyEl.style.position = 'absolute';
                    flyEl.style.zIndex = 300;
                    flyEl.style.fontSize = '40px';
                    flyEl.style.left = slotRect.left + 'px';
                    flyEl.style.top = slotRect.top + 'px';
                    flyEl.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
                    document.body.appendChild(flyEl);
                    
                    setTimeout(() => {
                        flyEl.style.left = (doorRect.left + doorRect.width/2 - 20) + 'px';
                        flyEl.style.top = (doorRect.top + doorRect.height/2 - 20) + 'px';
                        flyEl.style.transform = 'scale(1.5) rotate(720deg)';
                        flyEl.style.opacity = 0;
                        
                        setTimeout(() => {
                            flyEl.remove();
                            door.style.transform = 'scale(1.2)';
                            door.style.boxShadow = '0 0 20px 5px #222';
                            setTimeout(() => {
                                door.style.transform = 'scale(1)';
                                door.style.boxShadow = '3px 3px 0px #222';
                            }, 300);
                            resolve();
                        }, 800);
                    }, 50);
                }, idx * 400); // Stagger items
            });
        });

        Promise.all(flyingPromises).then(() => {
            // Door changes to next stage
            const nextStageNum = Math.min(playerState.stage + 1, 6);
            door.innerText = doorEmojis[nextStageNum - 1] || '🚪';
            door.style.transform = 'scale(1.5)';
            setTimeout(() => door.style.transform = 'scale(1)', 300);

            setTimeout(() => {
                const modal = document.getElementById('stage-clear-modal');
                modal.style.display = 'block';
            }, 500);
        });
    }
}

// Custom Cursor Logic
const customCursor = document.getElementById('custom-cursor');
document.addEventListener('pointermove', (e) => {
    if (e.target === canvas) {
        customCursor.style.display = 'block';
        customCursor.style.left = (e.clientX - 10) + 'px'; 
        customCursor.style.top = (e.clientY - 35) + 'px';
    } else {
        customCursor.style.display = 'none';
    }
});

// Button listeners
document.getElementById('next-stage-btn')?.addEventListener('click', () => {
    document.getElementById('stage-clear-modal').style.display = 'none';
    playerState.stage++; playerState.gems_collected = 0;
    if (playerState.stage > 5) {
        playerState.event_completed = true;
        alert("축하합니다! 숨겨진 사원의 모든 관문을 통과했습니다. (All-Star 완료)");
    } else {
        generateBoard(playerState.stage);
        loadOrGenerateBoard(); updateCamera(); renderBoard();
    }
    savePlayerState(); updateUI();
});

document.getElementById('reset-btn')?.addEventListener('click', () => {
    if (confirm("게임을 처음부터 다시 시작하시겠습니까? (진행도가 초기화됩니다)")) {
        localStorage.removeItem('ht_player_state');
        for(let i=1; i<=5; i++) localStorage.removeItem(`ht_board_state_stage_${i}`);
        location.reload();
    }
});

document.getElementById('cheat-btn')?.addEventListener('click', () => {
    playerState.pickaxe_count += 100;
    savePlayerState(); updateUI();
});

// --- Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('pointerdown', (event) => {
    if (playerState.pickaxe_count <= 0) return alert("곡괭이가 부족합니다!");
    if (playerState.event_completed) return;
    if (playerState.tiles_remaining <= 0) return;

    // Swing Animation for cursor
    customCursor.style.transform = 'translateY(15px) rotate(-45deg)';
    setTimeout(() => { customCursor.style.transform = 'translateY(0) rotate(0deg)'; }, 150);

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    // Filter only top meshes, ignore lines
    const validIntersects = intersects.filter(i => i.object.type === 'Mesh');

    if (validIntersects.length > 0) {
        const object = validIntersects[0].object;
        const tile = tiles.find(t => t.mesh === object);
        
        if (tile && tile.cell.state === 'hidden') {
            playerState.pickaxe_count--;
            playerState.tiles_remaining--;
            tile.cell.state = 'revealed';
            
            // Screen shake + particles
            shakeDuration = 8;
            spawnParticles(object.position.x, object.position.z);
            
            // Break animation
            let opacity = 1;
            const animateBreak = () => {
                opacity -= 0.15;
                object.material.transparent = true; object.material.opacity = opacity;
                object.scale.set(opacity, opacity, opacity);
                if (opacity <= 0) scene.remove(object);
                else requestAnimationFrame(animateBreak);
            };
            animateBreak();
            
            // Content Logic
            setTimeout(() => {
                if (tile.cell.content === 'GEM') {
                    playerState.gems_collected++;
                    playAni005(event.clientX, event.clientY);
                } else if (tile.cell.content === 'EMPTY_REWARD') {
                    playAni006(event.clientX, event.clientY);
                } else if (tile.cell.content === 'ITEM') {
                    const item = playerState.active_items.find(it => it.instanceId === tile.cell.item_instance_id);
                    if (item && !item.filled) {
                        item.revealedTiles++;
                        if (item.revealedTiles >= item.totalTiles) {
                            
                            const stats = playerState.boardStats;
                            const itemCells = boardGrid.filter(c => c.item_instance_id === item.instanceId);
                            let sumX = 0, sumZ = 0;
                            itemCells.forEach(c => {
                                sumX += (c.col - stats.minCol) * GameConfig.gridSpacing;
                                sumZ += (c.row - stats.minRow) * GameConfig.gridSpacing;
                            });
                            const cx3d = sumX / itemCells.length - ((stats.maxCol - stats.minCol + 1)*GameConfig.gridSpacing)/2 + GameConfig.gridSpacing/2;
                            const cz3d = sumZ / itemCells.length - ((stats.maxRow - stats.minRow + 1)*GameConfig.gridSpacing)/2 + GameConfig.gridSpacing/2;
                            
                            const vector = new THREE.Vector3(cx3d, 0, cz3d);
                            vector.project(camera);
                            const cx = rect.left + (vector.x * 0.5 + 0.5) * rect.width;
                            const cy = rect.top + -(vector.y * 0.5 - 0.5) * rect.height;

                            const blinkEl = document.createElement('div');
                            blinkEl.className = 'popup-anim'; 
                            blinkEl.innerText = item.emoji;
                            blinkEl.style.left = cx + 'px';
                            blinkEl.style.top = cy + 'px';
                            blinkEl.style.fontSize = '40px';
                            document.body.appendChild(blinkEl);

                            setTimeout(() => {
                                const flyEl = document.createElement('div');
                                flyEl.className = 'flying-item';
                                flyEl.style.left = cx + 'px'; flyEl.style.top = cy + 'px';
                                flyEl.innerText = item.emoji;
                                document.body.appendChild(flyEl);
                                setTimeout(() => {
                                    flyEl.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
                                    flyEl.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(360deg)';
                                    const targetSlot = document.getElementById(`item-slot-${item.instanceId}`);
                                    if (targetSlot) {
                                        const targetRect = targetSlot.getBoundingClientRect();
                                        flyEl.style.left = (targetRect.left + targetRect.width/2) + 'px';
                                        flyEl.style.top = (targetRect.top + targetRect.height/2) + 'px';
                                    }
                                }, 50);
                                
                                setTimeout(() => {
                                    flyEl.remove(); item.filled = true;
                                    const itemConf = itemConfig[item.itemId]?.[0];
                                    if (itemConf && itemConf.reward_type === 'pickaxe') {
                                        playerState.pickaxe_count += Number(itemConf.reward_amount || 0);
                                    }
                                    savePlayerState(); updateUI(); checkStageClear();
                                }, 800);
                            }, 500); 
                        }
                    }
                }
                savePlayerState();
                localStorage.setItem(`ht_board_state_stage_${playerState.stage}`, JSON.stringify(boardGrid));
                updateUI(); checkStageClear();
            }, 100);
            
            updateUI();
        }
    }
});

const canvasContainer = document.getElementById('canvas-container');

function onResize() {
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        updateCamera();
    }
}
window.addEventListener('resize', () => requestAnimationFrame(onResize));
requestAnimationFrame(onResize);

function animate() { 
    requestAnimationFrame(animate); 
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.x += p.userData.vx;
        p.position.y += p.userData.vy;
        p.position.z += p.userData.vz;
        p.userData.vy -= 0.015; 
        p.rotation.x += p.userData.rot;
        p.rotation.y += p.userData.rot;
        if (p.position.y < -1) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    if (shakeDuration > 0) {
        camera.position.x = (Math.random() - 0.5) * 0.15;
        camera.position.z = (Math.random() - 0.5) * 0.15;
        shakeDuration--;
    } else {
        camera.position.x = 0;
        camera.position.z = 0;
    }

    renderer.render(scene, camera); 
}
animate();
