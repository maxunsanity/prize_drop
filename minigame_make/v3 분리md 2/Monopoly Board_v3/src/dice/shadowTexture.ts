import * as THREE from "three";

/** 연필로 슥슥 그린듯한 원형 그림자 텍스처 */
export function makeSketchShadowTexture(): THREE.CanvasTexture {
  const sz = 128;
  const canvas = document.createElement("canvas");
  canvas.width = sz;
  canvas.height = sz;
  const g = canvas.getContext("2d")!;

  const center = sz / 2;
  const radius = sz * 0.35;

  g.clearRect(0, 0, sz, sz);

  // 여러 번 겹쳐 그려서 스케치 느낌 내기
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    const rx = radius + (Math.random() - 0.5) * 8;
    const ry = (radius * 0.7) + (Math.random() - 0.5) * 6; // 타원형
    const angle = (Math.random() * Math.PI * 2);
    
    g.ellipse(
      center + (Math.random() - 0.5) * 4,
      center + (Math.random() - 0.5) * 4,
      rx,
      ry,
      angle,
      0,
      Math.PI * 2
    );
    
    g.strokeStyle = `rgba(26, 26, 26, ${0.05 + Math.random() * 0.1})`;
    g.lineWidth = 1 + Math.random() * 2;
    g.stroke();
  }

  // 중앙 채우기 (연하게)
  const grad = g.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, "rgba(26, 26, 26, 0.15)");
  grad.addColorStop(0.7, "rgba(26, 26, 26, 0.05)");
  grad.addColorStop(1, "rgba(26, 26, 26, 0)");
  g.fillStyle = grad;
  g.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
