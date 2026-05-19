import * as THREE from "three";

import { makePipFaceTexture } from "./pipFaceTexture";

/**
 * BoxGeometry 면분할 순서(Three r173): +X, -X, +Y, -Y, +Z, -Z
 * 면 숫자는 합 7 맞은편 규칙: 1↔6, 2↔5, 3↔4
 */
const FACE_VALUES: (1 | 2 | 3 | 4 | 5 | 6)[] = [3, 4, 1, 6, 2, 5];

/** 각 숫자 면의 로컬 법선(정규화, 박스 밖 방향) — `quatForTop` 과 짝 맞춤 */
export const VALUE_TO_NORMAL: Record<1 | 2 | 3 | 4 | 5 | 6, THREE.Vector3> = {
  3: new THREE.Vector3(1, 0, 0),
  4: new THREE.Vector3(-1, 0, 0),
  1: new THREE.Vector3(0, 1, 0),
  6: new THREE.Vector3(0, -1, 0),
  2: new THREE.Vector3(0, 0, 1),
  5: new THREE.Vector3(0, 0, -1),
};

const up = new THREE.Vector3(0, 1, 0);

/** 윗면(+Y 월드)이 `value`가 되도록 하는 쿼터니언 */
export function quatForTopValue(value: number): THREE.Quaternion {
  const n = VALUE_TO_NORMAL[value as 1 | 2 | 3 | 4 | 5 | 6];
  if (!n) return new THREE.Quaternion();
  return new THREE.Quaternion().setFromUnitVectors(n, up);
}

export function createStandardDie(size = 1): THREE.Mesh {
  const geo = new THREE.BoxGeometry(size, size, size, 1, 1, 1);
  const mats = FACE_VALUES.map(
    (v) =>
      new THREE.MeshStandardMaterial({
        map: makePipFaceTexture(v),
        color: 0xffffff,  // 클린 화이트
        roughness: 0.35,
        metalness: 0.0,
      }),
  );
  return new THREE.Mesh(geo, mats);
}
