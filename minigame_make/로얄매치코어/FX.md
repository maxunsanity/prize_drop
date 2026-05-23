# Project Double Down — FX 연출 정밀 명세서 v2
> 로얄매치 영상 분석 기반. Three.js 구현 타겟.
> PLAN.md 연출 우선도 참조. DESIGN.md 컬러/타이밍 참조.

---

## 0. Three.js FX 공통 원칙

### 레이어 renderOrder (Z 충돌 방지 필수)
```typescript
// 보드 배경        renderOrder: 0
// 젤리 타일        renderOrder: 1
// 일반 블록        renderOrder: 2
// 특수 블록        renderOrder: 3
// 드래그 중 블록   renderOrder: 4  (z += 0.1 임시)
// 파티클 FX       renderOrder: 5
// 레이저/빔        renderOrder: 6
// 아이템 FX       renderOrder: 7
```

### AdditiveBlending 사용 시점
발광·빔·글로우 메시는 반드시 `THREE.AdditiveBlending`.
일반 블록에 사용 금지 — 배경이 비쳐 카드 색상 인식 불가.

### 애니메이션 루프 분리
```typescript
// requestAnimationFrame 루프 내 분리
function animateFrame(dt: number) {
  idleSystem.tick(dt);       // 블록 부유 idle
  particleSystem.tick(dt);   // 파티클 수명/물리
  specialFXSystem.tick(dt);  // 레이저/폭탄 타임라인
  ambientSystem.tick(dt);    // 배경 앰비언트
  cameraFX.tick(dt);         // 쉐이크/비네팅
}
```

---

## 1. 블록 재질 — blockMaterial.ts ⭐ 최우선

로얄매치 블록이 '살아있어 보이는' 핵심은 ShaderMaterial로 구현하는 하이라이트.

### 1.1 블록 ShaderMaterial 스펙

```glsl
// Vertex Shader
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform vec3 uBlockColor;    // 블록 고유 컬러
uniform sampler2D uSymbol;   // 문양 텍스처 (Canvas API로 생성)
uniform float uHighlight;    // 0.0~1.0 하이라이트 강도
uniform float uTime;         // idle 애니메이션용

varying vec2 vUv;

void main() {
  // 1. 기본 블록 컬러
  vec4 base = vec4(uBlockColor, 1.0);

  // 2. 상단 하이라이트 아크 (타원형 밝은 영역)
  float highlightY = smoothstep(0.5, 1.0, vUv.y);      // 상단으로 갈수록 밝음
  float highlightX = 1.0 - abs(vUv.x - 0.5) * 2.0;    // 중앙 집중
  float highlight = highlightY * highlightX * 0.35;

  // 3. 하단 그림자 엣지
  float shadow = smoothstep(0.0, 0.2, vUv.y) * 0.25;

  // 4. 문양 텍스처 오버레이
  vec4 symbol = texture2D(uSymbol, vUv);

  // 5. 최종 합성
  vec3 lit = base.rgb + highlight - shadow;
  vec3 final = mix(lit, symbol.rgb, symbol.a * 0.9);

  gl_FragColor = vec4(final, 1.0);
}
```

### 1.2 블록 문양 텍스처 생성 (Canvas API)
```typescript
function createSymbolTexture(emoji: string, color: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // 배경 투명
  ctx.clearRect(0, 0, 128, 128);

  // 문양 이모지 중앙 렌더링
  ctx.font = '72px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
```

### 1.3 블록 idle 부유 애니메이션
```typescript
// 각 블록에 고유 phase offset 부여 (동시 움직임 방지)
const phaseOffset = (row * BOARD_SIZE + col) * 0.37; // 황금비 배분

// tick() 내부
const floatY = Math.sin(time * Math.PI + phaseOffset) * 0.03; // ±0.03 world unit
const floatScale = 1.0 + Math.sin(time * Math.PI + phaseOffset) * 0.015; // ±1.5%

mesh.position.y = baseY + floatY;
mesh.scale.setScalar(floatScale);
```

**idle 타입별 고유 모션:**
| 블록 | idle 특성 |
|---|---|
| BLOCK_01 Spade | 2.0s 부유 + Y scale 1.0→1.03 호흡 |
| BLOCK_02 Diamond | 3.0s 광택 셰이더 슬라이드 (하이라이트 이동) |
| BLOCK_03 Clover | 2.5s 부유 + 이파리 끝 미세 scale 변화 |
| BLOCK_04 Heart | 1.2s 2단 콩콩 박동 (1.0→1.05→0.98→1.0) |
| BLOCK_05 Star | 4.0s 천천히 Z축 360° 자전 |

---

## 2. 블록 파괴 파티클 — particleSystem.ts ⭐ 최우선

### 2.1 파티클 타임라인 (총 180ms)
```
[0ms]     매치 확정 → 블록 수축 준비
[0~50ms]  Phase A: Squash 수축 (Y 1.0→0.5)
[50ms]    블록 스프라이트 소멸 (alpha=0)
[50~120ms] Phase B: 파티클 버스트 방출
[120~180ms] Phase C: 연기/먼지 잔상 페이드
[180ms]   board null 처리 → DROP_SPAWN 진입
```

### 2.2 파티클 생성 패턴
```typescript
interface ParticleBurst {
  position: THREE.Vector3;    // 블록 월드 좌표
  blockType: BlockType;
  count: number;              // 블록 타입별 상이
  colors: [number, number];   // [particleA, particleB] hex
  shape: 'triangle' | 'leaf' | 'heart' | 'star' | 'diamond';
}

// 블록 타입별 파티클 스펙
const PARTICLE_SPEC = {
  BLOCK_01: { count: 8,  shape: 'triangle', speed: 400, life: 300ms },
  BLOCK_02: { count: 12, shape: 'diamond',  speed: 450, life: 250ms },
  BLOCK_03: { count: 6,  shape: 'leaf',     speed: 350, life: 350ms },
  BLOCK_04: { count: 8,  shape: 'heart',    speed: 380, life: 300ms },
  BLOCK_05: { count: 16, shape: 'star',     speed: 420, life: 400ms },
};
```

### 2.3 파티클 물리
```typescript
// 파티클 개별 업데이트
particle.velocity.y -= GRAVITY * dt;              // 중력 (g=9.8 → 보정 적용)
particle.position.addScaledVector(particle.velocity, dt);
particle.opacity = 1.0 - (particle.age / particle.life);  // 선형 fade
particle.scale *= 0.98;                            // 점차 작아짐
```

### 2.4 Points 메시 구조 (성능 최적화)
```typescript
// 개별 Mesh가 아닌 단일 Points 메시로 처리 (드로우콜 최소화)
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(MAX_PARTICLES * 3);
const colors    = new Float32Array(MAX_PARTICLES * 3);
const sizes     = new Float32Array(MAX_PARTICLES);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
```

---

## 3. 블록 낙하 — board3d.ts ⭐ 최우선

### 3.1 낙하 Ease-In-Out 커브
```typescript
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
// ❌ 선형 lerp 금지 — 죽어있는 느낌
```

### 3.2 안착 Squash 모션
```typescript
// 낙하 완료 순간 (t=1.0)
// 다음 3 프레임 동안:
// frame 1: scale.y = 0.75, scale.x = 1.2  (납작 찌그러짐)
// frame 2: scale.y = 1.1,  scale.x = 0.95 (반동 통통)
// frame 3: scale.y = 1.0,  scale.x = 1.0  (원복)
// 총 소요: ~50ms
```

### 3.3 안착 파급 흔들림
```typescript
// 낙하 안착 순간 인접 4칸 블록에 미세 진동 전파
const adjacentOffsets = [[-1,0],[1,0],[0,-1],[0,1]];
adjacentOffsets.forEach(([dr,dc]) => {
  const neighbor = getBlock(row+dr, col+dc);
  if (neighbor) {
    neighbor.applyImpact(0.5); // 강도 0.5 (낙하 블록 대비 50%)
  }
});
```

---

## 4. 줄무늬 레이저 FX — specialFX.ts ⭐ 최우선

### 4.1 타임라인 (총 220ms)
```
[0~100ms]   HitStop: 줄무늬 블록 진동 (8px, 60Hz)
             → 보드 전체 낙하 일시정지
[100ms]     레이저 발사 시작
[100~220ms] 레이저 관통 + 열 블록 동시 파괴
[220ms]     잔광 파티클 + 상태 복귀
```

### 4.2 레이저 빔 구조
```typescript
// 레이저 = 3개 레이어 합성
// Layer 1: 화이트 코어 (두께 40px, AdditiveBlending)
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Layer 2: 컬러 글로우 아우라 (두께 120px, 해당 블록 컬러)
const glowMaterial = new THREE.MeshBasicMaterial({
  color: blockColor,       // 예: 하트 줄무늬 = 0xFFCC00
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Layer 3: 외곽 소프트 페더 (두께 200px, 블러 효과 시뮬레이션)
// → opacity gradient로 Blur 대체 (성능)
```

### 4.3 레이저 퍼짐 파티클
```typescript
// 레이저 관통 시 좌우로 파티클 방출
// 가로 줄무늬: 파티클이 위아래로 튀어나감
// 세로 줄무늬: 파티클이 좌우로 튀어나감
// 속도: 600px/s, 수명: 200ms, 컬러: 화이트 + 블록 컬러
```

### 4.4 예열 오브젝트 (미사일/프로펠러 — 선택 구현)
로얄매치는 레이저 발사 전 미사일 오브젝트가 보드 상단으로 올라가는 예열 연출이 있음.
```typescript
// 구현 시:
// 1. 줄무늬 블록 위치에서 작은 원 오브젝트 생성
// 2. 보드 상단(또는 좌우 끝)까지 빠르게 이동 (80ms)
// 3. 도달 순간 레이저 발사
// 구현 우선도: 🟢 여유 (없어도 레이저 자체로 충분)
```

---

## 5. 봉지 폭탄 FX — specialFX.ts ⭐ 우선

### 5.1 타임라인 (총 500ms)
```
[0~150ms]   1차 폭발: 3x3 적색 스피어 팽창
             카메라 쉐이크 동시 가동 (6px, 150ms)
[150~350ms] 낙하 대기: 빈 자리로 블록 흘러내림
[350~500ms] 2차 폭발: 낙하 안착 직후 다시 3x3 파괴
             사운드: 1차 높은 톤 → 2차 낮은 후폭풍
```

### 5.2 카메라 쉐이크
```typescript
function cameraShake(intensity: number, duration: number) {
  let elapsed = 0;
  const shake = (dt: number) => {
    elapsed += dt;
    const progress = elapsed / duration;
    const dampening = 1 - progress; // 점차 약해짐
    camera.position.x = basePos.x + (Math.random()-0.5) * intensity * dampening;
    camera.position.y = basePos.y + (Math.random()-0.5) * intensity * dampening;
    if (elapsed < duration) requestAnimationFrame(() => shake(16));
    else camera.position.copy(basePos); // 원위치
  };
  shake(0);
}
// 봉지 1차: intensity=0.1, duration=150ms
// 봉지 2차: intensity=0.06, duration=100ms
```

### 5.3 폭발 스피어 FX
```typescript
// SphereGeometry가 빠르게 팽창 후 소멸
// scale: 0 → 3.0 (3x3 칸 크기) 과팽창 → 0 (사라짐)
// material: 반투명 적색 + AdditiveBlending
// duration: 150ms
```

---

## 6. 컬러밤 FX (미러볼) — specialFX.ts ⭐ 우선

### 6.1 타임라인 (총 400ms)
```
[0~150ms]   스파크 아크 링크: 타겟 블록들로 전기선 연결
[150~400ms] 거리 기반 stagger 순차 폭발 (각 16.6ms 간격)
             각 폭발점에서 컬러 빔 방사
```

### 6.2 미러볼 idle 애니메이션
```typescript
// 컬러밤 블록 idle
// 1. 느리게 Z축 자전 (1 rps)
// 2. 표면에 무지개 텍스처 (hue shift shader)
// 3. 주변에 소형 빛 입자 공전 (반경 0.3 unit, 3개)

// hue shift shader fragment
uniform float uTime;
void main() {
  vec3 rainbow = hsvToRgb(mod(uTime * 0.5 + vUv.x, 1.0), 1.0, 1.0);
  gl_FragColor = vec4(rainbow, 1.0);
}
```

### 6.3 스파크 아크 (전기 링크)
```typescript
// 미러볼 → 각 타겟 블록까지 전기 아크 라인
// Three.js Line + 구불구불한 CatmullRomCurve3
// 매 프레임 포인트 위치를 약간 흔들어 전기 느낌
// 컬러: 흰색 + 흡수된 블록 컬러
// duration: 150ms → fade out
```

### 6.4 순차 폭발 + 컬러 빔
```typescript
// 각 타겟 블록 폭발 시:
// 1. 블록 파티클 버스트 (일반 파괴 동일)
// 2. 해당 위치에서 6방향 컬러 빔 방사 (100ms, AdditiveBlending)
// 3. 빔 컬러 = 해당 블록 고유 컬러

// 전체 완료 시 화면이 무지개빛으로 물든 느낌:
// → 모든 빔이 동시에 살아있는 150~250ms 구간이 클라이맥스
```

---

## 7. 터치 Squash 피드백 — board3d.ts

```typescript
// pointerdown 이벤트 시 즉시 실행
function onBlockTap(mesh: THREE.Mesh) {
  // Squash: X 팽창, Y 수축
  gsap.to(mesh.scale, {
    x: 1.15, y: 0.85,
    duration: 0.05,
    ease: 'power2.out',
    onComplete: () => {
      // 원복
      gsap.to(mesh.scale, { x: 1.0, y: 1.0, duration: 0.1, ease: 'elastic.out(1,0.5)' });
    }
  });
}
// GSAP 없을 경우: requestAnimationFrame 수동 lerp로 구현
```

---

## 8. 스왑 Ease-Out-Back — board3d.ts

```typescript
// 스왑 복귀 시 Ease-Out-Back (5px 초과 후 탄성 복귀)
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
// 적용: lerp(startPos, endPos, easeOutBack(progress))
// progress: 0→1 (SWAP_BACK_MS=150ms 동안)
```

---

## 9. 배경 분위기 — ambientSystem.ts + board3d.ts 🟡 일반

### 9.1 보드 배경 레이어 구성
```
Z=-0.5: Felt 배경 메시 (카지노 벨벳 그린 텍스처)
Z=-0.3: 보드 그림자 (소프트 원형 그림자, 타원형 PlaneGeometry)
Z=0:    격자 라인 메시 (미세 1px 흰 선, opacity 0.03)
Z=0.1:  보드 프레임 (골드 BorderGeometry)
```

### 9.2 보드 프레임 글로우
```typescript
// 보드 외곽 골드 글로우 (idle pulse)
// 2.0s 주기로 opacity 0.4→0.7 맥동
// 콤보 발생 시 1회 flash (opacity 1.0 → fade)
const frameMaterial = new THREE.MeshBasicMaterial({
  color: 0xf5a623,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});
```

### 9.3 앰비언트 파티클 (카드 먼지)
```typescript
// 50개의 작은 흰 점이 보드 위를 느리게 떠다님
// 속도: 0.01~0.03 unit/s (매우 느림)
// 크기: 0.02~0.05 unit
// opacity: 0.1~0.3 (거의 보일 듯 말 듯)
// 화면 하단에서 생성, 상단에서 사라짐
```

---

## 10. 아이템 announce 오버레이 🟠 우선

### 10.1 연출 시퀀스 (총 2000ms)
```
[0ms]      풀스크린 딤 (rgba 0,0,0 → 0.75, duration 200ms)
[100ms]    아이템 아이콘 scale 0 → 1.2 → 1.0 (bounce 400ms)
[200ms]    아이템 이름 텍스트 fade in (200ms)
[400ms]    설명 텍스트 타이핑 인 효과 (600ms)
[1000ms]   "탭해서 사용!" 플래시 텍스트 등장
[2000ms]   딤 해제 (200ms) → 아이템 선택 모드 진입
```

### 10.2 DOM 구조
```html
<div id="item-announce-overlay" class="hidden">
  <div id="announce-icon"><!-- 아이템 이모지 --></div>
  <div id="announce-name"><!-- 아이템 이름 --></div>
  <div id="announce-desc"><!-- 설명 텍스트 --></div>
  <div id="announce-hint">탭해서 사용!</div>
</div>
```

---

## 11. 콤보 텍스트 & 비네팅 🟡 일반

### 11.1 콤보 텍스트 (CSS2D)
```typescript
// CSS2DObject로 보드 중앙 좌표에 배치
const comboEl = document.createElement('div');
comboEl.className = 'combo-label';
comboEl.textContent = `COMBO x${comboCount}`;

// 등장: scale 0→1.3→1.0 (200ms)
// 유지: 800ms
// 퇴장: opacity 1→0 + translateY -20px (200ms)
// combo count 3 이상 시 골드 글로우 추가
```

### 11.2 비네팅 (CSS overlay)
```css
#vignette-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    rgba(0,0,0,var(--vignette-opacity, 0)) 100%
  );
  pointer-events: none;
  transition: --vignette-opacity 200ms;
}
```
```typescript
// 콤보 발생 시 강도 증가
const vignetteOpacity = Math.min(0.0 + comboCount * 0.08, 0.5);
overlay.style.setProperty('--vignette-opacity', vignetteOpacity.toString());
```

---

## 12. HUD 피드백 — hudSync.ts 🟡 일반

### 12.1 무브 수 차감 모션
```typescript
// 무브 -1 시:
// 숫자가 scale 1.0 → 1.3 → 1.0 (100ms, bounce)
// 무브 5 이하: text 컬러 → #ef4444, 0.5s 주기 깜빡임
```

### 12.2 타겟 수집 Punch Scale
```typescript
// 미션 타겟 파괴 → 카운터 UI
// scale 1.0 → 1.3 → 1.0 (80ms)
// 컬러 flash: 흰색 → 골드 → 원래 컬러 (150ms)
```

### 12.3 별점 팝 (성공 모달)
```typescript
// 별 1~3개 순차 등장
// 각 별: scale 0 → 1.5 → 1.0 (400ms, elastic)
// 간격: 400ms
// 파티클 burst: 골드 파티클 10개 방사
// 사운드: 높은 종소리 3번 (피치 상승)
```

---

## 13. 보너스 타임 연출 🟡 일반

```
[0ms]      "BONUS TIME!" 배너 등장 (top banner)
[0~]       잔여 무브만큼 무작위 블록 → STRIPED 변환 (200ms 간격)
           변환 시: 반짝임 flash + 변환 파티클
[변환 완료] 모든 STRIPED 순차 폭발 (300ms 간격)
[전체 완료] 배너 퇴장 → 성공 모달 등장
```

---

## 14. Web Audio API 사운드 — audioSystem.ts 🟢 여유

### 14.1 Web Audio 합성 스펙
```typescript
function createSFX(freq: number, type: OscillatorType, duration: number, gain = 0.15) {
  const osc  = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gainNode).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + duration);
}
```

### 14.2 사운드 맵
| 이벤트 | freq | type | duration |
|---|---|---|---|
| 블록 탭 | 440Hz | sine | 0.08s |
| 3매치 폭발 | 523Hz | triangle | 0.12s |
| 콤보 +1 (피치 +5%) | base×1.05^combo | triangle | 0.15s |
| 줄무늬 레이저 | 987Hz | sawtooth | 0.20s |
| 봉지 1차 폭발 | 100Hz | triangle | 0.35s |
| 봉지 2차 폭발 | 70Hz | triangle | 0.40s |
| 미러볼 아크 | 660Hz | sine | 0.15s |
| 스왑 실패 | 220Hz | sine | 0.20s |
| 클리어 성공 | 880Hz | sine | 0.50s |
