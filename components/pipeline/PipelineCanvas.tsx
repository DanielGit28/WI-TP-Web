"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { buildPipelineCurve, STAGES, type StageId } from "./curve";
import { EventParticle } from "./EventParticle";
import { PipelineTube } from "./PipelineTube";
import { PipelineStage, type StagePulseData } from "./PipelineStage";

export interface PipelineParticle {
  id: string;
  color: string;
}

interface PipelineCanvasProps {
  particles: PipelineParticle[];
  onParticleComplete: (id: string) => void;
  reducedMotion: boolean;
}

interface StagePulse extends StagePulseData {
  stageId: StageId;
}

const HEX_CHARS = "0123456789abcdef";
function randomHex(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += HEX_CHARS[Math.floor(Math.random() * 16)];
  return out;
}

// Module-scope so the impure Date.now()/Math.random() calls aren't
// textually inside the component body (same reasoning as randomHex above).
function randomPulseKey(stageId: StageId): string {
  return `${stageId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Very slow autonomous drift so the scene never feels perfectly static —
 * disabled entirely when the visitor prefers reduced motion. */
function CameraDrift({ enabled }: { enabled: boolean }) {
  useFrame(({ clock, camera }) => {
    if (!enabled) return;
    const t = clock.elapsedTime * 0.05;
    camera.position.x = Math.sin(t) * 0.4;
    camera.position.y = 0.3 + Math.cos(t * 0.7) * 0.15;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function PipelineCanvas({
  particles,
  onParticleComplete,
  reducedMotion,
}: PipelineCanvasProps) {
  const curve = useMemo(() => buildPipelineCurve(), []);
  const [guardFlash, setGuardFlash] = useState<string | null>(null);
  const [stagePulses, setStagePulses] = useState<StagePulse[]>([]);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerGuardFlash() {
    setGuardFlash(randomHex(12));
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setGuardFlash(null), 420);
  }

  // Colored ring pulse at whichever stage a particle just crossed — the
  // WebGL analog of the mockup's `ringpulse` keyframes. Guard additionally
  // keeps its own sha256 label, a real functional detail worth preserving.
  function pushStagePulse(stageId: StageId, color: string) {
    const key = randomPulseKey(stageId);
    setStagePulses((prev) => [...prev, { key, stageId, color }]);
    setTimeout(() => {
      setStagePulses((prev) => prev.filter((p) => p.key !== key));
    }, 600);
  }

  function handleCrossStage(stageId: StageId, color: string) {
    pushStagePulse(stageId, color);
    if (stageId === "guard") triggerGuardFlash();
  }

  function pulseForStage(stageId: StageId): StagePulse | undefined {
    const matches = stagePulses.filter((p) => p.stageId === stageId);
    return matches[matches.length - 1];
  }

  const guardStage = STAGES.find((s) => s.id === "guard")!;

  return (
    <Canvas
      camera={{ position: [0, 0.3, 9], fov: 38 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#07080a"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 3, 4]} intensity={40} />

      <CameraDrift enabled={!reducedMotion} />

      <PipelineTube curve={curve} />

      {STAGES.map((stage) => (
        <PipelineStage key={stage.id} stage={stage} pulse={pulseForStage(stage.id)} />
      ))}

      {particles.map((p) => (
        <EventParticle
          key={p.id}
          curve={curve}
          color={p.color}
          onCrossStage={handleCrossStage}
          onComplete={() => {
            pushStagePulse("postgres", p.color);
            onParticleComplete(p.id);
          }}
        />
      ))}

      {guardFlash && (
        <Html center position={[guardStage.position.x, guardStage.position.y + 0.4, guardStage.position.z]}>
          <span className="pointer-events-none whitespace-nowrap rounded bg-surface-2/90 px-1.5 py-0.5 font-mono text-[10px] text-push">
            sha256:{guardFlash}
          </span>
        </Html>
      )}

      <EffectComposer enableNormalPass={false}>
        <Bloom intensity={0.9} luminanceThreshold={0.25} luminanceSmoothing={0.35} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
