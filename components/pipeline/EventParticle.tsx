"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CatmullRomCurve3, Mesh } from "three";
import { GUARD_T } from "./curve";

const DURATION_MS = 2600;

export interface EventParticleProps {
  curve: CatmullRomCurve3;
  color: string;
  onCrossGuard: () => void;
  onComplete: () => void;
}

export function EventParticle({ curve, color, onCrossGuard, onComplete }: EventParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const startRef = useRef<number | null>(null);
  const guardFiredRef = useRef(false);
  const doneRef = useRef(false);
  const point = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (doneRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;

    const elapsedMs = (state.clock.elapsedTime - startRef.current) * 1000;
    const progress = Math.min(elapsedMs / DURATION_MS, 1);

    curve.getPointAt(progress, point.current);
    meshRef.current?.position.copy(point.current);

    if (!guardFiredRef.current && progress >= GUARD_T) {
      guardFiredRef.current = true;
      onCrossGuard();
    }

    if (progress >= 1 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  );
}
