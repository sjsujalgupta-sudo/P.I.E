"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { BirthSky } from "./BirthSky";

const SLICES = [
  { id: "atlas",       name: "Atlas",       color: "#3b82f6", hex: 0x3b82f6, route: "/atlas",       desc: "Cognitive mapping and behavioral analysis." },
  { id: "vault",       name: "Vault",        color: "#10b981", hex: 0x10b981, route: "/vault",       desc: "Encrypted personal data storage." },
  { id: "synapse",     name: "Synapse",      color: "#c084fc", hex: 0xc084fc, route: "/synapse",     desc: "Neural network connection graph." },
  { id: "insights",    name: "Insights",     color: "#facc15", hex: 0xfacc15, route: "/insights",    desc: "Intelligence signals and pattern discovery." },
  { id: "contracts",   name: "Contracts",    color: "#f97316", hex: 0xf97316, route: "/contracts",   desc: "Smart trust and exchange protocols." },
  { id: "dashboard",   name: "Overview",     color: "#f43f5e", hex: 0xf43f5e, route: "/dashboard",   desc: "Central intelligence dashboard." },
  { id: "assistant",   name: "Assistant",    color: "#8b5cf6", hex: 0x8b5cf6, route: "/assistant",   desc: "Neural AI interface and tasking." },
  { id: "deposit",     name: "Deposit",      color: "#06b6d4", hex: 0x06b6d4, route: "/deposit",     desc: "Value injection and asset locking." },
  { id: "settings",    name: "Settings",     color: "#ffffff", hex: 0xffffff, route: "/settings",    desc: "Core system configuration." },
  { id: "surfing",     name: "Surfing",      color: "#6366f1", hex: 0x6366f1, route: "/surfing-analytics", desc: "Digital footprint and web behavior." },
];

// Orbital parameters — high-density configuration
const ORBITAL_PARAMS = [
  { orbitRadius: 8.5,  orbitSpeed: 0.18,  inclination: 0.32,  ascNode: 0.0,  startAngle: 0,    size: 1.40, pulseFreq: 2.1 },
  { orbitRadius: 13.5, orbitSpeed: 0.14,  inclination: -0.10, ascNode: 1.1,  startAngle: 0.7,  size: 1.65, pulseFreq: 1.5 },
  { orbitRadius: 19.5, orbitSpeed: 0.11,  inclination: 0.65,  ascNode: 2.1,  startAngle: 1.4,  size: 1.25, pulseFreq: 3.2 },
  { orbitRadius: 26.5, orbitSpeed: 0.085, inclination: -0.22, ascNode: 0.8,  startAngle: 2.1,  size: 1.95, pulseFreq: 1.3 },
  { orbitRadius: 34.5, orbitSpeed: 0.070, inclination: 0.48,  ascNode: 3.5,  startAngle: 2.8,  size: 1.50, pulseFreq: 2.8 },
  { orbitRadius: 43.5, orbitSpeed: 0.055, inclination: -0.55, ascNode: 5.0,  startAngle: 3.5,  size: 1.70, pulseFreq: 1.8 },
  { orbitRadius: 53.5, orbitSpeed: 0.045, inclination: 0.15,  ascNode: 1.5,  startAngle: 4.2,  size: 1.45, pulseFreq: 2.3 },
  { orbitRadius: 64.5, orbitSpeed: 0.038, inclination: -0.40, ascNode: 4.2,  startAngle: 4.9,  size: 1.60, pulseFreq: 1.6 },
  { orbitRadius: 76.5, orbitSpeed: 0.032, inclination: 0.80,  ascNode: 2.5,  startAngle: 5.6,  size: 1.20, pulseFreq: 3.5 },
  { orbitRadius: 89.5, orbitSpeed: 0.028, inclination: -0.15, ascNode: 0.2,  startAngle: 6.3,  size: 1.50, pulseFreq: 1.2 },
  { orbitRadius: 104.5, orbitSpeed: 0.022, inclination: 0.35,  ascNode: 3.1,  startAngle: 0.5,  size: 1.35, pulseFreq: 2.5 },
];

// Per-planet style mapping is no longer needed as we use the slice color directly
// for the single-neon-color Pie Sphere look.


// ─── Types ─────────────────────────────────────────────────────────────────────
interface SliceData { id: string; name: string; color: string; hex: number; route: string; desc: string; }

interface PieSliceProps {
  index: number; total: number; data: SliceData;
  hoveredSlice: string | null; setHoveredSlice: (s: string | null) => void;
  activeSlice: string | null; onSliceClick: (d: SliceData) => void;
  launchPhase: number;
}

// ─── Individual Pie Slice (Core backup — untouched) ────────────────────────────
function PieSlice({ index, total, data, hoveredSlice, setHoveredSlice, activeSlice, onSliceClick, launchPhase }: PieSliceProps) {
  const radius    = 3.8;
  const phiLength = (Math.PI * 2) / total - 0.08;
  const phiStart  = index * (Math.PI * 2) / total;

  const isHovered = hoveredSlice === data.id;
  const isActive  = activeSlice  === data.id;

  const sliceRef = useRef<THREE.Mesh>(null);
  const matRef   = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    if (!sliceRef.current || !matRef.current) return;

    let tE = 0.38, tO = 0.62, tScale = 1;

    if (launchPhase === 0) {
      tE = isHovered ? 1.6 : 0.38;
      tO = isHovered ? 0.88 : 0.62;
    } else if (launchPhase === 1) {
      tE = isActive ? 4.5 + Math.sin(state.clock.elapsedTime * 20) * 2.5 : 0.05;
      tO = isActive ? 1.0 : 0.05;
      if (isActive) sliceRef.current.rotation.z += delta * 12; // Hyper spin for core slice
    } else if (launchPhase === 2) {
      tE = isActive ? 6 : 0.0;
      tO = isActive ? 1.0 : 0.0;
      tScale = isActive ? 1.1 : 0.0;
    }

    const k = 6;
    matRef.current.emissiveIntensity = THREE.MathUtils.damp(matRef.current.emissiveIntensity, tE, k, delta);
    matRef.current.opacity           = THREE.MathUtils.damp(matRef.current.opacity,           tO, k, delta);
    const s = THREE.MathUtils.damp(sliceRef.current.scale.x, tScale, k * 1.5, delta);
    sliceRef.current.scale.set(s, s, s);

    let targetX = 0, targetY = 0, targetZ = 0;
    if (launchPhase === 0 && isHovered) {
      targetX = Math.sin(phiStart + phiLength / 2) * 0.2;
      targetZ = Math.cos(phiStart + phiLength / 2) * 0.2;
      targetY = 0.1;
    } else if (launchPhase === 2 && isActive) {
      targetX = Math.sin(phiStart + phiLength / 2) * 2.5;
      targetZ = Math.cos(phiStart + phiLength / 2) * 2.5;
      targetY = 1.0;
    }
    sliceRef.current.position.x = THREE.MathUtils.damp(sliceRef.current.position.x, targetX, 5, delta);
    sliceRef.current.position.y = THREE.MathUtils.damp(sliceRef.current.position.y, targetY, 5, delta);
    sliceRef.current.position.z = THREE.MathUtils.damp(sliceRef.current.position.z, targetZ, 5, delta);
  });

  return (
    <mesh
      ref={sliceRef}
      onClick={(e) => { e.stopPropagation(); if (!activeSlice) onSliceClick(data); }}
      onPointerOver={(e) => { e.stopPropagation(); if (!activeSlice) { setHoveredSlice(data.id); document.body.style.cursor = "pointer"; } }}
      onPointerOut={() => { if (!activeSlice) { setHoveredSlice(null); document.body.style.cursor = "auto"; } }}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <sphereGeometry args={[radius, 32, 32, phiStart, phiLength]} />
      <meshStandardMaterial
        ref={matRef}
        color={data.color} emissive={data.color} emissiveIntensity={0.38}
        opacity={0.62} transparent roughness={0.08} metalness={0.95} side={THREE.DoubleSide}
      />
      {launchPhase === 0 && isHovered && (
        <Html position={[0, radius + 1.2, 0]} center className="pointer-events-none" zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center select-none">
            <span className="text-white text-[14px] font-bold tracking-[0.22em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] whitespace-nowrap">{data.name}</span>
            <span className="mt-1 text-[8px] font-mono text-white/45 tracking-[0.28em] uppercase whitespace-nowrap">{data.desc}</span>
          </div>
        </Html>
      )}
    </mesh>
  );
}

// ─── Orbital Trail Ring (uses true 3D inclination) ───────────────────────────
function OrbitalTrail({ radius, inclination, ascNode, color }: { radius: number; inclination: number; ascNode: number; color: string }) {
  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const sinI = Math.sin(inclination), cosI = Math.cos(inclination);
    const sinO = Math.sin(ascNode),     cosO = Math.cos(ascNode);
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      // Orbit in its own plane then rotate by inclination + ascending node
      const ox = Math.cos(a) * radius;
      const oz = Math.sin(a) * radius;
      pts.push(new THREE.Vector3(
        ox * cosO - oz * sinI * sinO,
        oz * cosI,
        ox * sinO + oz * sinI * cosO
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false });
    return new THREE.Line(geo, mat);
  }, [radius, inclination, ascNode, color]);

  return <primitive object={lineObj} />;
}

// ─── Orbital World (Intelligence Planet) ──────────────────────────────────────
interface OrbitalWorldProps {
  data: SliceData;
  orbital: typeof ORBITAL_PARAMS[0];
  onLaunch: (d: SliceData) => void;
  activeSlice: string | null;
  launchPhase: number;
}

function OrbitalWorld({ data, orbital, onLaunch, activeSlice, launchPhase }: OrbitalWorldProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const pieGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const angleRef  = useRef(orbital.startAngle);

  // Precompute orbital plane trig
  const sinI = Math.sin(orbital.inclination);
  const cosI = Math.cos(orbital.inclination);
  const sinO = Math.sin(orbital.ascNode);
  const cosO = Math.cos(orbital.ascNode);

  const sliceCount = 4;
  const phiLength = (Math.PI * 2) / sliceCount - 0.12;

  useFrame((state, delta) => {
    if (!groupRef.current || !pieGroupRef.current) return;

    const speed = hovered ? orbital.orbitSpeed * 0.08 : orbital.orbitSpeed;
    angleRef.current += delta * speed;
    const a = angleRef.current;
    const r = orbital.orbitRadius;

    // True 3D Keplerian position
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    groupRef.current.position.set(
      ox * cosO - oz * sinI * sinO,
      oz * cosI,
      ox * sinO + oz * sinI * cosO
    );

    pieGroupRef.current.rotation.y += delta * (hovered ? 1.2 : 0.4);
    pieGroupRef.current.rotation.z += delta * 0.2;

    if (launchPhase === 1 && data.id === activeSlice) {
      pieGroupRef.current.rotation.y += delta * 18; // Cinematic Hyper-spin
      pieGroupRef.current.rotation.z += delta * 8;
    }

    const targetScale = hovered ? 1.4 : (launchPhase === 1 && data.id === activeSlice) ? 2.5 : 1.0;
    const s = THREE.MathUtils.damp(pieGroupRef.current.scale.x, targetScale, 4, delta);
    pieGroupRef.current.scale.set(s, s, s);
  });

  const isDimmed = launchPhase > 0 && data.id !== activeSlice;

  return (
    <group ref={groupRef}>
      <group
        ref={pieGroupRef}
        onClick={(e) => { e.stopPropagation(); if (!activeSlice) onLaunch(data); }}
        onPointerOver={(e) => { e.stopPropagation(); if (!activeSlice) { setHovered(true); document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { if (!activeSlice) { setHovered(false); document.body.style.cursor = "auto"; } }}
      >
        {/* The 3D Pie Sphere segments */}
        {[...Array(sliceCount)].map((_, i) => {
          const phiStart = i * (Math.PI * 2) / sliceCount;
          return (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
              <sphereGeometry args={[orbital.size, 32, 32, phiStart, phiLength]} />
              <meshStandardMaterial
                color={data.color}
                emissive={data.color}
                emissiveIntensity={hovered ? 4.0 : (launchPhase === 1 && data.id === activeSlice) ? 8.0 : 0.8}
                transparent
                opacity={isDimmed ? 0.05 : 0.8}
                roughness={0.05}
                metalness={0.95}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Inner core glow for the pie sphere */}
        <mesh>
          <sphereGeometry args={[orbital.size * 0.4, 16, 16]} />
          <meshBasicMaterial color={data.color} transparent opacity={isDimmed ? 0.02 : 0.4} />
        </mesh>

        {/* Wireframe Shell - matches the central core style */}
        <mesh>
          <sphereGeometry args={[orbital.size * 1.15, 24, 24]} />
          <meshStandardMaterial
            color={data.color}
            emissive={data.color}
            emissiveIntensity={0.3}
            transparent
            opacity={isDimmed ? 0.02 : 0.15}
            wireframe
          />
        </mesh>
      </group>

      {/* Hover label */}
      {hovered && (
        <Html center position={[0, orbital.size + 1.8, 0]} className="pointer-events-none" zIndexRange={[50, 0]}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="px-4 py-2.5 rounded-2xl backdrop-blur-2xl border text-center"
              style={{
                background: `${data.color}14`,
                borderColor: `${data.color}55`,
                boxShadow: `0 0 32px ${data.color}40`,
                opacity: isDimmed ? 0 : 1,
              }}
            >
              <div className="text-white font-bold text-[13px] tracking-[0.2em] uppercase whitespace-nowrap"
                style={{ textShadow: `0 0 14px ${data.color}` }}>
                {data.name}
              </div>
              <div className="text-white/45 text-[8px] font-mono tracking-[0.22em] uppercase mt-1 whitespace-nowrap">
                {data.desc}
              </div>
            </div>
            <div className="w-px h-5" style={{ background: `linear-gradient(to bottom, ${data.color}99, transparent)` }} />
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Orbital System wrapper ────────────────────────────────────────────────────
function OrbitalSystem({ onPortalLaunch, activeSlice, launchPhase }: { onPortalLaunch: (s: SliceData) => void; activeSlice: string | null; launchPhase: number }) {
  return (
    <group>
      {SLICES.map((slice, i) => {
        return (
          <group key={slice.id}>
            <OrbitalTrail
              radius={ORBITAL_PARAMS[i].orbitRadius}
              inclination={ORBITAL_PARAMS[i].inclination}
              ascNode={ORBITAL_PARAMS[i].ascNode}
              color={slice.color}
            />
            <OrbitalWorld
              data={slice}
              orbital={ORBITAL_PARAMS[i]}
              onLaunch={onPortalLaunch}
              activeSlice={activeSlice}
              launchPhase={launchPhase}
            />
          </group>
        );
      })}
    </group>
  );
}

// ─── Core (PieSphere — COMPLETELY UNTOUCHED INTERNALLY) ───────────────────────
interface PieSphereProps {
  onPortalLaunch: (s: SliceData) => void;
  onHoverChange?: (v: boolean) => void;
  onPhaseChange?: (p: number) => void;
}

function PieSphere({ onPortalLaunch, onHoverChange, onPhaseChange }: PieSphereProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [activeSlice,  setActiveSlice]  = useState<string | null>(null);
  const [launchPhase,  setLaunchPhase]  = useState(0);

  const velocity   = useRef(0);
  const phaseTimer = useRef(0);
  const controlsRef = useRef<any>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup")    keys.current.w = true;
      if (k === "s" || k === "arrowdown")  keys.current.s = true;
      if (k === "a" || k === "arrowleft")  keys.current.a = true;
      if (k === "d" || k === "arrowright") keys.current.d = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup")    keys.current.w = false;
      if (k === "s" || k === "arrowdown")  keys.current.s = false;
      if (k === "a" || k === "arrowleft")  keys.current.a = false;
      if (k === "d" || k === "arrowright") keys.current.d = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => { onHoverChange?.(hoveredSlice !== null || activeSlice !== null); }, [hoveredSlice, activeSlice]);
  useEffect(() => { onPhaseChange?.(launchPhase); }, [launchPhase]);

  const handleClick = (slice: typeof SLICES[0]) => {
    if (activeSlice) return;
    setActiveSlice(slice.id);
    setHoveredSlice(null);
    setLaunchPhase(1);
    document.body.style.cursor = "auto";
    velocity.current   = 0;
    phaseTimer.current = 0;
    setTimeout(() => setLaunchPhase(2), 800);
    setTimeout(() => onPortalLaunch(slice), 900);
  };

  // 🌉 Cosmic Bridge: Listen for Navbar Navigation
  useEffect(() => {
    const handleCosmosNav = (e: any) => {
      const { label, id } = e.detail;
      const target = SLICES.find(s => s.id === id || s.name.toLowerCase() === label.toLowerCase());
      if (target) {
        handleClick(target);
      }
    };
    window.addEventListener("COSMOS_NAVIGATE", handleCosmosNav);
    return () => window.removeEventListener("COSMOS_NAVIGATE", handleCosmosNav);
  }, [activeSlice]);

  useFrame((state, delta) => {
    // WASD / Arrow key camera orbit
    if (controlsRef.current) {
      const spd = delta;
      if (keys.current.a) controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - spd);
      if (keys.current.d) controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + spd);
      if (keys.current.w) controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() - spd);
      if (keys.current.s) controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() + spd);
    }

    if (!groupRef.current) return;
    phaseTimer.current += delta;

    if (launchPhase === 1) {
      velocity.current = THREE.MathUtils.damp(velocity.current, 0, 3, delta);
      groupRef.current.rotation.y += delta * velocity.current;
    } else if (launchPhase === 2) {
      velocity.current = THREE.MathUtils.damp(velocity.current, 0, 3, delta);
      groupRef.current.rotation.y += delta * velocity.current;
      groupRef.current.scale.set(1, 1, 1);
    } else {
      velocity.current = 0.05;
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.rotation.y += delta * velocity.current;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.035;
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={launchPhase === 0}
        enableZoom minDistance={8} maxDistance={180} zoomSpeed={1.2}
        enablePan={false} autoRotate={false}
        enableDamping dampingFactor={0.05} rotateSpeed={0.5}
        minPolarAngle={Math.PI / 6} maxPolarAngle={(5 * Math.PI) / 6}
      />

      {/* ── CORE STAR — bigger, radiant, named ─────────────── */}
      {/* Innermost white-hot corona */}
      <mesh>
        <sphereGeometry args={[5.0, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} depthWrite={false} />
      </mesh>
      {/* Mid blue corona */}
      <mesh>
        <sphereGeometry args={[7.5, 32, 32]} />
        <meshBasicMaterial color="#6aa8ff" transparent opacity={0.018} depthWrite={false} />
      </mesh>
      {/* Outer faint halo */}
      <mesh>
        <sphereGeometry args={[10.0, 32, 32]} />
        <meshBasicMaterial color="#4466cc" transparent opacity={0.007} depthWrite={false} />
      </mesh>
      {/* "Core" label floating above */}
      <Html position={[0, 4.8, 0]} center className="pointer-events-none" zIndexRange={[10, 0]}>
        <div className="text-white/25 text-[9px] font-mono tracking-[0.35em] uppercase whitespace-nowrap select-none">
          ◈ Core
        </div>
      </Html>

      {/* PIE Sphere with slices — scaled up to feel like a star */}
      <group ref={groupRef} rotation={[0.25, 0, 0]} scale={[1.5, 1.5, 1.5]}>
        {SLICES.map((slice, i) => (
          <PieSlice
            key={slice.id} index={i} total={SLICES.length}
            data={slice}
            hoveredSlice={hoveredSlice} setHoveredSlice={setHoveredSlice}
            activeSlice={activeSlice} onSliceClick={handleClick}
            launchPhase={launchPhase}
          />
        ))}
        <mesh>
          <sphereGeometry args={[3.33, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08}
            transparent opacity={0.07} roughness={0} metalness={1} wireframe
          />
        </mesh>
      </group>

      {/* Orbiting intelligence worlds */}
      <OrbitalSystem
        onPortalLaunch={handleClick}
        activeSlice={activeSlice}
        launchPhase={launchPhase}
      />
    </>
  );
}

// ─── Post-processing ───────────────────────────────────────────────────────────
function Effects({ phase }: { phase: number }) {
  const isLaunching = phase > 0;
  const isImploding = phase === 2;
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        luminanceThreshold={isImploding ? 0.05 : isLaunching ? 0.25 : 0.4}
        mipmapBlur
        intensity={isImploding ? 6 : isLaunching ? 2.2 : 1.5}
      />
    </EffectComposer>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
interface NeuralCoreProps {
  mode: string;
  setMode?: (m: any) => void;
  onHoverChange?: (v: boolean) => void;
  onPortalLaunch: (s: any) => void;
  onPhaseChange?: (p: number) => void;
}

export function NeuralCore({ onHoverChange, onPortalLaunch, onPhaseChange }: NeuralCoreProps) {
  const [phase, setPhase] = useState(0);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto z-50 cursor-grab active:cursor-grabbing">
      {/* Immersive close-up view for the high-density neural cosmos */}
      <Canvas camera={{ position: [0, 30, 110], fov: 50 }}>
        <ambientLight intensity={0.06} />
        <pointLight position={[10,  10,  10]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-8, -10, -10]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[0,   12,   0]} intensity={0.3} color="#c084fc" />
        {/* Core sun: illuminates the nearest planets with warm blue-white */}
        <pointLight position={[0, 0, 0]} intensity={3.5} color="#aac8ff" distance={150} decay={2} />

        <Environment preset="city" />
        <BirthSky />

        <PieSphere
          onPortalLaunch={onPortalLaunch}
          onHoverChange={onHoverChange}
          onPhaseChange={(p) => { setPhase(p); onPhaseChange?.(p); }}
        />

        <Effects phase={phase} />
      </Canvas>
    </div>
  );
}
