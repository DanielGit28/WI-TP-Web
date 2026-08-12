import * as THREE from "three";

export type StageId = "github" | "guard" | "transform" | "postgres";

export interface Stage {
  id: StageId;
  label: string;
  sublabel: string;
  position: THREE.Vector3;
  /** Position of this stage along the curve, 0–1 — used to trigger the
   * guard-flash effect and to place labels precisely on the path. */
  t: number;
  color: string;
}

// Same left-to-right S-curve rhythm as the approved mockup (see the SVG
// path in the Claude Design export), translated into 3D units and given a
// little z depth so the camera has something to read as "3D" rather than
// a flat curve facing the viewer dead-on.
export const STAGES: Stage[] = [
  {
    id: "github",
    label: "GitHub",
    sublabel: "POST /webhooks/github",
    position: new THREE.Vector3(-6, 0.55, 0),
    t: 0,
    color: "#c3c9d4",
  },
  {
    id: "guard",
    label: "Guard",
    sublabel: "HMAC sha256",
    position: new THREE.Vector3(-2, -0.65, 0.55),
    t: 1 / 3,
    color: "#4f8bff",
  },
  {
    id: "transform",
    label: "Transform",
    sublabel: "normalize → ETO",
    position: new THREE.Vector3(2, 0.65, -0.55),
    t: 2 / 3,
    color: "#a371f7",
  },
  {
    id: "postgres",
    label: "Postgres",
    sublabel: "UQ_provider_delivery",
    position: new THREE.Vector3(6, -0.45, 0),
    t: 1,
    color: "#35d07f",
  },
];

export const GUARD_T = STAGES.find((s) => s.id === "guard")!.t;
export const TRANSFORM_T = STAGES.find((s) => s.id === "transform")!.t;

export function buildPipelineCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    STAGES.map((s) => s.position),
    false,
    "centripetal",
    0.5,
  );
}
