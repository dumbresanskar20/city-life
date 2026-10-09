import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateProceduralBuildings } from "./utils";
import { useUserStore } from "../store/userStore";

// Animated Scene inside Canvas
function CityScene({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const routeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const buildings = useMemo(() => generateProceduralBuildings(130, isMobile), [isMobile]);

  // Curve for glowing route tube
  const { routeGeometry, pinPositions } = useMemo(() => {
    const points = [
      new THREE.Vector3(-4, 0.4, -3),
      new THREE.Vector3(-2, 0.6, -1),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(2.5, 0.7, 1.5),
      new THREE.Vector3(4, 0.5, 3.5),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);

    const pins: [number, number, number][] = [
      [-4, 1.2, -3],
      [-2, 1.5, -1],
      [0, 1.4, 0],
      [2.5, 1.7, 1.5],
      [4, 1.3, 3.5],
      [-1.5, 2.2, 2.5],
    ];

    return { routeGeometry: geom, pinPositions: pins };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow auto-rotate
    groupRef.current.rotation.y += delta * 0.04;

    // Mouse parallax lerping (max 6 deg ~ 0.1 rad)
    const targetRotX = mousePos.current.y * 0.08;
    const targetRotZ = -mousePos.current.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05);

    // Glowing route emissive pulse
    if (routeMatRef.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
      routeMatRef.current.emissiveIntensity = 1.0 + pulse;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* City Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow={!isMobile}>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#0B1020" roughness={0.9} />
      </mesh>

      {/* Extruded procedural buildings */}
      {buildings.map((b) => (
        <mesh key={b.id} position={b.position} castShadow={!isMobile} receiveShadow={!isMobile}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={b.color} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}

      {/* Glowing route line */}
      <mesh geometry={routeGeometry}>
        <meshStandardMaterial
          ref={routeMatRef}
          color="#2DD4BF"
          emissive="#2DD4BF"
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* Floating pins with staggered bobbing */}
      {pinPositions.map((pos, idx) => (
        <FloatingPin key={idx} position={pos} phase={idx * 1.2} />
      ))}
    </group>
  );
}

function FloatingPin({ position, phase }: { position: [number, number, number]; phase: number }) {
  const pinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!pinRef.current) return;
    const t = state.clock.elapsedTime;
    pinRef.current.position.y = position[1] + Math.sin(t * 2 + phase) * 0.15;
    pinRef.current.rotation.y = t * 1.5 + phase;
  });

  return (
    <group ref={pinRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#2DD4BF" emissive="#2DD4BF" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#2DD4BF" />
      </mesh>
    </group>
  );
}

// Fallback static illustration for Reduced Motion
function StaticCityIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="relative w-80 h-80 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
        <div className="absolute inset-4 rounded-full border border-secondary/20" />
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-2xl">
            CC
          </div>
          <span className="text-sm font-semibold text-text-1 block">CityCompass 3D Engine</span>
          <span className="text-xs text-text-3 block">Reduced Effects Active</span>
        </div>
      </div>
    </div>
  );
}

export const CityHero: React.FC = () => {
  const reduceEffects = useUserStore((s) => s.reduceEffects);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (reduceEffects) {
    return <StaticCityIllustration />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 6, 11], fov: 42 }}
        dpr={Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1)}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Soft fog matching background */}
        <fogExp2 attach="fog" args={["#0B1020", 0.045]} />

        {/* Ambient & Directional light with shadows */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow={!isMobile}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-8, 6, -5]} intensity={0.5} color="#8B5CF6" />

        <CityScene isMobile={isMobile} />
      </Canvas>
    </div>
  );
};

export default CityHero;
