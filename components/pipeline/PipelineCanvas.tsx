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
  /** Human label ("push", "pull_request", …) shown in the spawn toast. */
  label?: string;
  /** A replay of one of the last ~10 real events, not a genuinely new
   * arrival right now — rendered dimmer and doesn't trigger stage pulses
   * or the spawn toast, so a live delivery still reads as "the" event. */
  replay?: boolean;
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
function randomToastKey(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  const [spawnToast, setSpawnToast] = useState<{ key: string; label: string; color: string } | null>(
    null,
  );
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerGuardFlash() {
    setGuardFlash(randomHex(12));
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setGuardFlash(null), 420);
  }

  // Colored ring pulse at whichever stage a particle just crossed — the
  // WebGL analog of the mockup's `ringpulse` keyframes. Guard additionally
  // keeps its own sha256 label, a real functional detail worth preserving.
  // Only called for live (non-replay) particles — see the .map() below.
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

  // The differentiator between "recent history replaying" and "a delivery
  // just landed" — a brief label at the GitHub node naming the event,
  // only for genuinely live particles (replay never calls this).
  function triggerSpawnToast(label: string, color: string) {
    setSpawnToast({ key: randomToastKey(), label, color });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setSpawnToast(null), 1400);
  }

  function pulseForStage(stageId: StageId): StagePulse | undefined {
    const matches = stagePulses.filter((p) => p.stageId === stageId);
    return matches[matches.length - 1];
  }

  const githubStage = STAGES.find((s) => s.id === "github")!;
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
          replay={p.replay}
          onSpawn={() => {
            if (!p.replay) triggerSpawnToast(p.label ?? "event", p.color);
          }}
          onCrossStage={(stageId, color) => {
            if (!p.replay) handleCrossStage(stageId, color);
          }}
          onComplete={() => {
            if (!p.replay) pushStagePulse("postgres", p.color);
            onParticleComplete(p.id);
          }}
        />
      ))}

      {spawnToast && (
        <Html
          center
          position={[githubStage.position.x, githubStage.position.y + 0.4, githubStage.position.z]}
        >
          <span
            className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px]"
            style={{
              borderColor: spawnToast.color,
              color: spawnToast.color,
              background: "rgba(11,13,16,0.9)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: spawnToast.color }}
              aria-hidden="true"
            />
            {spawnToast.label} received
          </span>
        </Html>
      )}

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
