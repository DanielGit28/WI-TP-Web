"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { CatmullRomCurve3 } from "three";

export function PipelineTube({ curve }: { curve: CatmullRomCurve3 }) {
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 128, 0.028, 8, false),
    [curve],
  );

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#3a4250"
        emissive="#232a34"
        emissiveIntensity={0.6}
        roughness={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}
