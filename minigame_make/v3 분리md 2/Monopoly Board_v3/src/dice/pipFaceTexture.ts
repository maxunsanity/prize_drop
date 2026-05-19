import * as THREE from "three";

const SZ = 256;
const PAD = 30;
const DOT = 36;
const CORNER_R = 32;

/** Blank Paper Sketch 주사위 면 1~6 — 아이보리 바탕 + 다크 pip */
export function makePipFaceTexture(value: 1 | 2 | 3 | 4 | 5 | 6): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = SZ;
  c.height = SZ;
  const g = c.getContext("2d")!;

  // 라운드 코너 배경 — 웜 아이보리
  g.clearRect(0, 0, SZ, SZ);
  g.beginPath();
  g.moveTo(CORNER_R, 0);
  g.lineTo(SZ - CORNER_R, 0);
  g.quadraticCurveTo(SZ, 0, SZ, CORNER_R);
  g.lineTo(SZ, SZ - CORNER_R);
  g.quadraticCurveTo(SZ, SZ, SZ - CORNER_R, SZ);
  g.lineTo(CORNER_R, SZ);
  g.quadraticCurveTo(0, SZ, 0, SZ - CORNER_R);
  g.lineTo(0, CORNER_R);
  g.quadraticCurveTo(0, 0, CORNER_R, 0);
  g.closePath();

  // 아이보리 배경 그라데이션
  const grad = g.createLinearGradient(0, 0, SZ, SZ);
  grad.addColorStop(0, "#faf7f0");
  grad.addColorStop(1, "#f0ece2");
  g.fillStyle = grad;
  g.fill();

  // 미세 테두리
  g.strokeStyle = "rgba(26, 26, 26, 0.2)";
  g.lineWidth = 4;
  g.stroke();

  const u = (SZ - PAD * 2) / 4;

  const dotAt = (ix: number, iy: number) => {
    const cx = PAD + u * ix;
    const cy = PAD + u * iy;
    const r = DOT / 2;

    // pip — 다크 찰콜
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = "#1a1a1a";
    g.fill();
  };

  const slots: [number, number][] =
    value === 1
      ? [[2, 2]]
      : value === 2
        ? [[1, 1], [3, 3]]
        : value === 3
          ? [[1, 1], [2, 2], [3, 3]]
          : value === 4
            ? [[1, 1], [3, 1], [1, 3], [3, 3]]
            : value === 5
              ? [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]]
              : [
                  [1, 1],
                  [1, 2],
                  [1, 3],
                  [3, 1],
                  [3, 2],
                  [3, 3],
                ];

  for (const [ix, iy] of slots) dotAt(ix, iy);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}
