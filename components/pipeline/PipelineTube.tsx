"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { CatmullRomCurve3 } from "three";

const TUBULAR_SEGMENTS = 128;
const TUBE_RADIUS = 0.1;

export function PipelineTube({ curve }: { curve: CatmullRomCurve3 }) {
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, TUBE_RADIUS, 16, false),
    [curve],
  );

  // A dashed centerline "painted" on the tube's surface, like lane markings
  // on a road, rather than a bare pipe — the design's own flowing dashed
  // line, given actual width to sit on this time. Uses the exact same
  // Frenet frames TubeGeometry itself builds the tube surface from, so the
  // line rides the tube's curvature/twist consistently instead of floating
  // through its middle.
  //
  // Built as a plain THREE.Line via useMemo + <primitive> rather than the
  // <line> JSX intrinsic — TypeScript resolves the lowercase `line` tag to
  // the DOM/SVG element type here, not @react-three/fiber's Object3D
  // primitive, so `<line>` fails to typecheck against a Ref<THREE.Line>.
  const centerline = useMemo(() => {
    const frames = curve.computeFrenetFrames(TUBULAR_SEGMENTS, false);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= TUBULAR_SEGMENTS; i++) {
      const t = i / TUBULAR_SEGMENTS;
      const point = curve.getPointAt(t);
      const normal = frames.normals[i] ?? new THREE.Vector3(0, 1, 0);
      points.push(point.clone().addScaledVector(normal, TUBE_RADIUS * 0.99));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: "#8b93a1",
      dashSize: 0.14,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }, [curve]);

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#3a4250"
          emissive="#232a34"
          emissiveIntensity={0.6}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>
      <primitive object={centerline} />
    </group>
  );
}
