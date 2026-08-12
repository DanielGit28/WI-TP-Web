"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial } from "three";
import type { Stage } from "./curve";

const PULSE_DURATION_MS = 550;

/** A colored ring that grows outward and fades — fired whenever a
 * particle crosses this stage. The WebGL analog of the approved mockup's
 * `@keyframes ringpulse` (r: 26px→52px, opacity: .5→0). Keyed by the
 * caller so each new pulse remounts and restarts cleanly. */
function StagePulse({ color }: { color: string }) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const elapsedMs = (state.clock.elapsedTime - startRef.current) * 1000;
    const t = Math.min(elapsedMs / PULSE_DURATION_MS, 1);

    meshRef.current?.scale.setScalar(1 + t * 1.8);
    if (materialRef.current) materialRef.current.opacity = 0.6 * (1 - t);
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.24, 0.29, 32]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

export interface StagePulseData {
  key: string;
  color: string;
}

export function PipelineStage({ stage, pulse }: { stage: Stage; pulse?: StagePulseData }) {
  return (
    <group position={stage.position}>
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color={stage.color}
          emissive={stage.color}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {/* faint outer ring so the node reads even where bloom is subtle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.27, 32]} />
        <meshBasicMaterial color={stage.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {pulse && <StagePulse key={pulse.key} color={pulse.color} />}

      <Html center distanceFactor={8} position={[0, -0.55, 0]} occlude={false}>
        <div className="pointer-events-none flex w-max flex-col items-center text-center">
          <span className="font-display text-xs font-medium text-text-primary">
            {stage.label}
          </span>
          <span className="font-mono text-[10px] text-text-faint">{stage.sublabel}</span>
        </div>
      </Html>
    </group>
  );
}
