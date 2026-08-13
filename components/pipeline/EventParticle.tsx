"use client";

import { useEffect, useRef } from "react";
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
// A replayed recent event stays visually subordinate to a genuinely live
// one — dimmer ceiling opacity, smaller, thinner trail — so "this just
// happened" always reads as the more important thing on screen, even
// though both are colored by real event data.
const REPLAY_OPACITY_CEILING = 0.7;

export interface EventParticleProps {
  curve: CatmullRomCurve3;
  color: string;
  /** A replay of a recent real event, not a genuinely new arrival right
   * now — travels the same path but stays visually subdued and never
   * triggers stage pulses or the spawn toast. */
  replay?: boolean;
  onSpawn?: () => void;
  onCrossStage: (stageId: StageId, color: string) => void;
  onComplete: () => void;
}

export function EventParticle({
  curve,
  color,
  replay = false,
  onSpawn,
  onCrossStage,
  onComplete,
}: EventParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const startRef = useRef<number | null>(null);
  const guardFiredRef = useRef(false);
  const transformFiredRef = useRef(false);
  const doneRef = useRef(false);
  const point = useRef(new THREE.Vector3());

  // Fires once, when this particle is actually placed in the scene — same
  // timing as "a new delivery started at GitHub."
  useEffect(() => {
    onSpawn?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally once-per-mount, not re-run if onSpawn's identity changes
  }, []);

  useFrame((state) => {
    if (doneRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;

    const elapsedMs = (state.clock.elapsedTime - startRef.current) * 1000;
    const progress = Math.min(elapsedMs / DURATION_MS, 1);

    curve.getPointAt(progress, point.current);
    meshRef.current?.position.copy(point.current);

    const edge = Math.min(progress, 1 - progress);
    const fade = Math.min(1, edge / EASE_FRACTION);
    const opacityCeiling = replay ? REPLAY_OPACITY_CEILING : 1;
    meshRef.current?.scale.setScalar((replay ? 0.55 : 0.65) + 0.4 * fade);
    if (materialRef.current) materialRef.current.opacity = fade * opacityCeiling;

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
    <Trail width={replay ? 2.4 : 3.8} length={replay ? 3.5 : 5.5} color={color} decay={1} local={false}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[replay ? 0.13 : 0.18, 16, 16]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={replay ? 1.6 : 2.8}
          toneMapped={false}
          transparent
          opacity={0}
        />
      </mesh>
    </Trail>
  );
}
