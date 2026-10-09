import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUserStore } from "../store/userStore";
import { ScoreRing } from "../components/ScoreRing";

function AnimatedSphere({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const normalized = Math.min(100, Math.max(0, score));

  // Determine color: danger (#EF4444) -> caution (#F59E0B) -> safe (#22C55E)
  const targetColor =
    normalized >= 75
      ? new THREE.Color("#22C55E")
      : normalized >= 50
      ? new THREE.Color("#F59E0B")
      : new THREE.Color("#EF4444");

  // Lower score = higher turbulence
  const turbulence = (100 - normalized) / 100.0;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * (0.3 + turbulence * 0.8);
    meshRef.current.rotation.y = t * (0.4 + turbulence * 0.8);

    const scale = 1.0 + Math.sin(t * 2.5) * (0.04 + turbulence * 0.08);
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 3]} />
      <meshStandardMaterial
        color={targetColor}
        roughness={0.2}
        metalness={0.4}
        wireframe={turbulence > 0.4}
        emissive={targetColor}
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

export interface SafetyOrbProps {
  score: number;
  size?: number;
  className?: string;
}

export const SafetyOrb: React.FC<SafetyOrbProps> = ({ score, size = 160, className }) => {
  const reduceEffects = useUserStore((s) => s.reduceEffects);

  if (reduceEffects) {
    return <ScoreRing score={score} size={size} strokeWidth={8} label="Safety Score" />;
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className || ""}`} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -2]} intensity={0.5} />
        <AnimatedSphere score={score} />
      </Canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-2xl font-black text-text-1 drop-shadow-md">
          {Math.round(score)}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-text-3">Score</span>
      </div>
    </div>
  );
};

export default SafetyOrb;
