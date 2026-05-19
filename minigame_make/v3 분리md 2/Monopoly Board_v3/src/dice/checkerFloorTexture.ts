import * as THREE from "three";

/** 스케치판 바닥 — 흰 내부 + 두꺼운 스케치 외곽선 */
export function makeCheckerFloorTexture(): THREE.CanvasTexture {
  const cw = 512;
  const ch = 160;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const g = canvas.getContext("2d")!;

  // 흰 내부
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, cw, ch);

  // 외곽 스케치 라인 — 손으로 그린 느낌 (약간 불균일하게)
  g.strokeStyle = "#1a1a1a";
  g.lineWidth = 7;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeRect(3.5, 3.5, cw - 7, ch - 7);

  // 내부 미세 선 (종이 느낌)
  g.strokeStyle = "rgba(26, 26, 26, 0.06)";
  g.lineWidth = 2;
  g.strokeRect(12, 12, cw - 24, ch - 24);

  // 모서리 짧은 스케치 강조
  const cs = 22; // corner size
  g.strokeStyle = "rgba(26, 26, 26, 0.35)";
  g.lineWidth = 4;
  // top-left
  g.beginPath(); g.moveTo(3, 3 + cs); g.lineTo(3, 3); g.lineTo(3 + cs, 3); g.stroke();
  // top-right
  g.beginPath(); g.moveTo(cw - 3 - cs, 3); g.lineTo(cw - 3, 3); g.lineTo(cw - 3, 3 + cs); g.stroke();
  // bottom-left
  g.beginPath(); g.moveTo(3, ch - 3 - cs); g.lineTo(3, ch - 3); g.lineTo(3 + cs, ch - 3); g.stroke();
  // bottom-right
  g.beginPath(); g.moveTo(cw - 3 - cs, ch - 3); g.lineTo(cw - 3, ch - 3); g.lineTo(cw - 3, ch - 3 - cs); g.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
