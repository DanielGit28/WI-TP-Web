"use client";

import { Html } from "@react-three/drei";
import type { Stage } from "./curve";

export function PipelineStage({ stage }: { stage: Stage }) {
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
