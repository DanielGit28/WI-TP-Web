"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import type { CatmullRomCurve3, Mesh, MeshStandardMaterial } from "three";
import { GUARD_T, TRANSFORM_T, type StageId } from "./curve";

const DURATION_MS = 2600;
// Fraction of total travel spent easing in at the start and out at the
// end, so particles grow/fade in and out instead of popping — matches
// the mockup's own `trip` keyframes (opacity/rx ramp over ~6-8%).
const EASE_FRACTION = 0.08;

export interface EventParticleProps {
  curve: CatmullRomCurve3;
  color: string;
  onCrossStage: (stageId: StageId, color: string) => void;
  onComplete: () => void;
}

export function EventParticle({ curve, color, onCrossStage, onComplete }: EventParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const startRef = useRef<number | null>(null);
  const guardFiredRef = useRef(false);
  const transformFiredRef = useRef(false);
  const doneRef = useRef(false);
  const point = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (doneRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;

    const elapsedMs = (state.clock.elapsedTime - startRef.current) * 1000;
    const progress = Math.min(elapsedMs / DURATION_MS, 1);

    curve.getPointAt(progress, point.current);
    meshRef.current?.position.copy(point.current);

    const edge = Math.min(progress, 1 - progress);
    const fade = Math.min(1, edge / EASE_FRACTION);
    meshRef.current?.scale.setScalar(0.6 + 0.4 * fade);
    if (materialRef.current) materialRef.current.opacity = fade;

    if (!guardFiredRef.current && progress >= GUARD_T) {
      guardFiredRef.current = true;
      onCrossStage("guard", color);
    }
    if (!transformFiredRef.current && progress >= TRANSFORM_T) {
      transformFiredRef.current = true;
      onCrossStage("transform", color);
    }

    if (progress >= 1 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <Trail width={2.5} length={5} color={color} decay={1} local={false}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
          toneMapped={false}
          transparent
          opacity={0}
        />
      </mesh>
    </Trail>
  );
}
