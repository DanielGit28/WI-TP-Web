"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial } from "three";
import type { Stage, StageId } from "./curve";

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
      <ringGeometry args={[0.28, 0.33, 32]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

// Small recognizable glyph per stage, rendered as a DOM overlay (same
// mechanism as the text labels below) rather than 3D geometry — far
// higher fidelity at this size than trying to sculpt icons out of
// meshes, and it's how the approved mockup's own database-cylinder icon
// on the Postgres node was built (an SVG overlay, not a WebGL shape).
function StageIcon({ stageId }: { stageId: StageId }) {
  switch (stageId) {
    case "github":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.78 1.07.78 2.16 0 1.56-.02 2.82-.02 3.2 0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
        </svg>
      );
    case "guard":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "transform":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m18 4 4 4-4 4" />
          <path d="M2 8h20" />
          <path d="m6 20-4-4 4-4" />
          <path d="M22 16H2" />
        </svg>
      );
    case "postgres":
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );
  }
}

export interface StagePulseData {
  key: string;
  color: string;
}

export function PipelineStage({ stage, pulse }: { stage: Stage; pulse?: StagePulseData }) {
  return (
    <group position={stage.position}>
      <mesh>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial
          color={stage.color}
          emissive={stage.color}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {/* faint outer ring so the node reads even where bloom is subtle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.31, 32]} />
        <meshBasicMaterial color={stage.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {pulse && <StagePulse key={pulse.key} color={pulse.color} />}

      {/* Icon + its glow live in one DOM tree so the aura's size is
          guaranteed to be bigger than the icon in actual rendered pixels —
          a WebGL glow behind an Html-overlaid icon doesn't reliably scale
          against it (the icon is sized in CSS px via distanceFactor, the
          glow in 3D world units; they don't scale together as camera
          distance/FOV change), which is why the previous attempt at this
          didn't visibly read as "aura bigger than icon". */}
      <Html center distanceFactor={8} occlude={false}>
        <div
          className="pointer-events-none flex items-center justify-center rounded-full"
          style={{
            width: 46,
            height: 46,
            background: `radial-gradient(circle, ${stage.color}59 0%, ${stage.color}26 55%, transparent 78%)`,
            boxShadow: `0 0 20px 6px ${stage.color}4d`,
          }}
        >
          <div style={{ color: "#07080a" }}>
            <StageIcon stageId={stage.id} />
          </div>
        </div>
      </Html>

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
