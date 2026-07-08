"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// Global hover states to coordinate slowdown and highlighting without heavy re-renders
let globalHoverState = false;
let globalHoveredStarName: string | null = null;

const REAL_STARS = [
    // Original Brightest
    {name: 'Sirius', ra: 6.75, dec: -16.7, mag: -1.46, color: '#c8e2ff', dist: '8.6 ly', spectral: 'A1V', info: 'Brightest star in the night sky.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Sirius_A_and_B_Hubble_photo.jpg/240px-Sirius_A_and_B_Hubble_photo.jpg'},
    {name: 'Canopus', ra: 6.39, dec: -52.69, mag: -0.74, color: '#fff4e8', dist: '310 ly', spectral: 'A9II', info: 'Second brightest star, supergiant.'},
    {name: 'Rigil Kentaurus', ra: 14.66, dec: -60.83, mag: -0.27, color: '#fff4e8', dist: '4.3 ly', spectral: 'G2V', info: 'Closest star system to Earth.'},
    {name: 'Arcturus', ra: 14.26, dec: 19.18, mag: -0.05, color: '#ffd2a1', dist: '37 ly', spectral: 'K1.5III', info: 'Brightest star in Northern Hemisphere.'},
    {name: 'Vega', ra: 18.61, dec: 38.78, mag: 0.03, color: '#c8e2ff', dist: '25 ly', spectral: 'A0V', info: 'Former North Star, bright blue-white.'},
    {name: 'Capella', ra: 5.27, dec: 45.99, mag: 0.08, color: '#fff4e8', dist: '43 ly', spectral: 'G3III', info: 'A quadruple star system.'},
    {name: 'Procyon', ra: 7.65, dec: 5.22, mag: 0.34, color: '#fff4e8', dist: '11.4 ly', spectral: 'F5IV-V', info: 'Eighth brightest star in the sky.'},
    {name: 'Achernar', ra: 1.63, dec: -57.24, mag: 0.46, color: '#c8e2ff', dist: '139 ly', spectral: 'B6Vep', info: 'Highly flattened due to rapid spin.'},
    {name: 'Hadar', ra: 14.06, dec: -60.37, mag: 0.61, color: '#c8e2ff', dist: '390 ly', spectral: 'B1III', info: 'Part of the Southern Pointer.'},
    {name: 'Altair', ra: 19.84, dec: 8.86, mag: 0.76, color: '#f2f2ff', dist: '16.7 ly', spectral: 'A7V', info: 'Rapid rotator with a flattened pole.'},
    {name: 'Aldebaran', ra: 4.59, dec: 16.5, mag: 0.86, color: '#ffb56c', dist: '65 ly', spectral: 'K5III', info: 'The fiery eye of Taurus the Bull.'},
    {name: 'Antares', ra: 16.49, dec: -26.43, mag: 0.96, color: '#ffb56c', dist: '550 ly', spectral: 'M1.5Iab', info: 'Heart of the Scorpion, rival of Mars.'},
    {name: 'Spica', ra: 13.41, dec: -11.16, mag: 0.97, color: '#c8e2ff', dist: '250 ly', spectral: 'B1III-IV', info: 'A tight binary star system.'},
    {name: 'Pollux', ra: 7.75, dec: 28.02, mag: 1.14, color: '#ffd2a1', dist: '34 ly', spectral: 'K0III', info: 'Has a confirmed exoplanet.'},
    {name: 'Fomalhaut', ra: 22.96, dec: -29.62, mag: 1.16, color: '#f2f2ff', dist: '25 ly', spectral: 'A3V', info: 'Surrounded by a massive debris disk.'},
    {name: 'Deneb', ra: 20.69, dec: 45.28, mag: 1.25, color: '#c8e2ff', dist: '2600 ly', spectral: 'A2Ia', info: 'One of the most luminous stars known.'},
    {name: 'Regulus', ra: 10.13, dec: 11.96, mag: 1.35, color: '#c8e2ff', dist: '79 ly', spectral: 'B8IVn', info: 'The heart of the Lion.'},
    {name: 'Adhara', ra: 6.97, dec: -28.97, mag: 1.5, color: '#c8e2ff', dist: '430 ly', spectral: 'B2II', info: 'Emits more extreme UV light than any other.'},
    {name: 'Castor', ra: 7.57, dec: 31.88, mag: 1.58, color: '#c8e2ff', dist: '51 ly', spectral: 'A1V', info: 'A complex sextuple star system.'},
    {name: 'Shaula', ra: 17.56, dec: -37.1, mag: 1.62, color: '#c8e2ff', dist: '570 ly', spectral: 'B1.5IV', info: 'The stinger of the Scorpion.'},
    
    // Orion Constellation Stars
    {name: 'Betelgeuse', ra: 5.91, dec: 7.4, mag: 0.50, color: '#ffb56c', dist: '640 ly', spectral: 'M1-M2Ia-ab', info: 'Red supergiant, shoulder of Orion.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Betelgeuse_captured_by_ALMA.jpg/240px-Betelgeuse_captured_by_ALMA.jpg'},
    {name: 'Rigel', ra: 5.24, dec: -8.2, mag: 0.13, color: '#c8e2ff', dist: '860 ly', spectral: 'B8Ia', info: 'Blue supergiant, foot of Orion.'},
    {name: 'Bellatrix', ra: 5.41, dec: 6.34, mag: 1.64, color: '#c8e2ff', dist: '250 ly', spectral: 'B2III', info: 'The Amazon Star.'},
    {name: 'Saiph', ra: 5.79, dec: -9.66, mag: 2.07, color: '#c8e2ff', dist: '650 ly', spectral: 'B0.5Iac', info: 'Sword of Orion.'},
    {name: 'Alnilam', ra: 5.6, dec: -1.2, mag: 1.69, color: '#c8e2ff', dist: '2000 ly', spectral: 'B0Ia', info: 'Center of Orion\'s belt.'},
    {name: 'Alnitak', ra: 5.67, dec: -1.94, mag: 1.77, color: '#c8e2ff', dist: '1260 ly', spectral: 'O9.5Iab', info: 'Eastern star of the belt.'},
    {name: 'Mintaka', ra: 5.53, dec: -0.29, mag: 2.23, color: '#c8e2ff', dist: '1200 ly', spectral: 'O9.5II', info: 'Western star of the belt.'},

    // Ursa Major (Big Dipper)
    {name: 'Dubhe', ra: 11.06, dec: 61.75, mag: 1.79, color: '#ffd2a1', dist: '123 ly', spectral: 'K0III', info: 'Pointer star to the North Star.'},
    {name: 'Merak', ra: 11.03, dec: 56.38, mag: 2.37, color: '#c8e2ff', dist: '79 ly', spectral: 'A1V', info: 'Pointer star to the North Star.'},
    {name: 'Phecda', ra: 11.89, dec: 53.69, mag: 2.44, color: '#c8e2ff', dist: '83 ly', spectral: 'A0V', info: 'Bowl of the Dipper.'},
    {name: 'Megrez', ra: 12.25, dec: 57.03, mag: 3.31, color: '#c8e2ff', dist: '58 ly', spectral: 'A3V', info: 'Dimmest star of the Dipper.'},
    {name: 'Alioth', ra: 12.9, dec: 55.95, mag: 1.77, color: '#c8e2ff', dist: '81 ly', spectral: 'A1p', info: 'Brightest star in Ursa Major.'},
    {name: 'Mizar', ra: 13.39, dec: 54.92, mag: 2.23, color: '#c8e2ff', dist: '83 ly', spectral: 'A2V', info: 'Famous binary pair with Alcor.'},
    {name: 'Alkaid', ra: 13.79, dec: 49.31, mag: 1.86, color: '#c8e2ff', dist: '104 ly', spectral: 'B3V', info: 'End of the Dipper\'s handle.'},

    // Crux (Southern Cross)
    {name: 'Acrux', ra: 12.44, dec: -63.09, mag: 0.76, color: '#c8e2ff', dist: '320 ly', spectral: 'B0.5IV', info: 'Southernmost star of the Cross.'},
    {name: 'Mimosa', ra: 12.78, dec: -59.68, mag: 1.25, color: '#c8e2ff', dist: '280 ly', spectral: 'B0.5III', info: 'Eastern arm of the Cross.'},
    {name: 'Gacrux', ra: 12.52, dec: -57.11, mag: 1.63, color: '#ffb56c', dist: '88 ly', spectral: 'M3.5III', info: 'Red giant at top of the Cross.'},
    {name: 'Imai', ra: 12.25, dec: -58.74, mag: 2.79, color: '#c8e2ff', dist: '345 ly', spectral: 'B2IV', info: 'Western arm of the Cross.'},

    // Cassiopeia
    {name: 'Caph', ra: 0.15, dec: 59.14, mag: 2.28, color: '#fff4e8', dist: '54 ly', spectral: 'F2III', info: 'Right edge of the W.'},
    {name: 'Schedar', ra: 0.67, dec: 56.53, mag: 2.24, color: '#ffd2a1', dist: '228 ly', spectral: 'K0IIIa', info: 'Bottom right point of the W.'},
    {name: 'Gamma Cas', ra: 0.94, dec: 60.71, mag: 2.15, color: '#c8e2ff', dist: '550 ly', spectral: 'B0IV', info: 'Center point of the W.'},
    {name: 'Ruchbah', ra: 1.43, dec: 60.23, mag: 2.68, color: '#c8e2ff', dist: '99 ly', spectral: 'A5III-IV', info: 'Bottom left point of the W.'},
    {name: 'Segin', ra: 1.9, dec: 63.67, mag: 3.37, color: '#c8e2ff', dist: '440 ly', spectral: 'B3III', info: 'Left edge of the W.'},

    // Solar System
];

const CONSTELLATIONS = [
  { name: 'Orion', lines: [['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Betelgeuse', 'Alnitak']] },
  { name: 'Ursa Major', lines: [['Alkaid', 'Mizar'], ['Mizar', 'Alioth'], ['Alioth', 'Megrez'], ['Megrez', 'Phecda'], ['Phecda', 'Merak'], ['Merak', 'Dubhe'], ['Dubhe', 'Megrez']] },
  { name: 'Crux', lines: [['Gacrux', 'Acrux'], ['Mimosa', 'Imai'], ['Gacrux', 'Mimosa']] },
  { name: 'Cassiopeia', lines: [['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']] },
  { name: 'Centaurus', lines: [['Rigil Kentaurus', 'Hadar']] },
  { name: 'Canis Major', lines: [['Sirius', 'Adhara']] }
];

function RaycasterSettings() {
  const raycaster = useThree(state => state.raycaster);
  useEffect(() => {
    raycaster.params.Points.threshold = 1.5;
  }, [raycaster]);
  return null;
}

function createDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const radial = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  radial.addColorStop(0, "rgba(255,255,255,1)");
  radial.addColorStop(0.2, "rgba(255,255,255,0.8)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function createFlareTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  
  const gradientX = ctx.createLinearGradient(0, 64, 128, 64);
  gradientX.addColorStop(0, "rgba(255,255,255,0)");
  gradientX.addColorStop(0.45, "rgba(255,255,255,0.8)");
  gradientX.addColorStop(0.5, "rgba(255,255,255,1)");
  gradientX.addColorStop(0.55, "rgba(255,255,255,0.8)");
  gradientX.addColorStop(1, "rgba(255,255,255,0)");
  
  const gradientY = ctx.createLinearGradient(64, 0, 64, 128);
  gradientY.addColorStop(0, "rgba(255,255,255,0)");
  gradientY.addColorStop(0.45, "rgba(255,255,255,0.8)");
  gradientY.addColorStop(0.5, "rgba(255,255,255,1)");
  gradientY.addColorStop(0.55, "rgba(255,255,255,0.8)");
  gradientY.addColorStop(1, "rgba(255,255,255,0)");
  
  ctx.fillStyle = gradientX; ctx.fillRect(0, 62, 128, 4);
  ctx.fillStyle = gradientY; ctx.fillRect(62, 0, 4, 128);

  const radial = ctx.createRadialGradient(64, 64, 0, 64, 64, 24);
  radial.addColorStop(0, "rgba(255,255,255,1)");
  radial.addColorStop(0.5, "rgba(255,255,255,0.5)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial; ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

function InteractiveStar({ star, radius, flareTex }: { star: typeof REAL_STARS[0], radius: number, flareTex: THREE.Texture }) {
  const [hovered, setHovered] = useState(false);
  const outerGlowRef = useRef<THREE.Sprite>(null);

  const ra_rad = (star.ra / 24.0) * 2 * Math.PI;
  const dec_rad = (star.dec / 180.0) * Math.PI;
  
  const x = radius * Math.cos(dec_rad) * Math.cos(ra_rad);
  const z = radius * Math.cos(dec_rad) * Math.sin(ra_rad);
  const y = radius * Math.sin(dec_rad);
  
  const baseSize = (star as any).isSun ? 10 : (star as any).isMoon ? 4 : Math.max(0.4, 0.8 - (star.mag + 1.5) * 0.15);

  useFrame((state) => {
    if (hovered && outerGlowRef.current) {
      const s = baseSize * 15 + Math.sin(state.clock.elapsedTime * 8) * 2;
      outerGlowRef.current.scale.set(s, s, 1);
    } else if (outerGlowRef.current) {
      outerGlowRef.current.scale.lerp(new THREE.Vector3(baseSize * 10, baseSize * 10, 1), 0.1);
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh 
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHovered(true); 
          globalHoverState = true;
          globalHoveredStarName = star.name;
          document.body.style.cursor = "pointer"; 
        }}
        onPointerOut={() => { 
          setHovered(false); 
          globalHoverState = false;
          globalHoveredStarName = null;
          document.body.style.cursor = "auto"; 
        }}
      >
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <sprite ref={outerGlowRef} scale={[baseSize * 10, baseSize * 10, 1]}>
        <spriteMaterial map={flareTex} color={star.color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      <mesh>
        <sphereGeometry args={[baseSize * 0.5, 16, 16]} />
        <meshBasicMaterial color={star.color} />
      </mesh>
      
      {hovered && (
        <Html center position={[0, 5, 0]} className="pointer-events-none z-50">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-[#020108]/95 border border-[#40a0ff]/40 rounded-[12px] backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.8)] min-w-[220px] pointer-events-auto">
              {(star as any).img && (
                <div className="w-full h-[100px] mb-3 rounded-lg overflow-hidden border border-white/10 relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <img src={(star as any).img} alt={star.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ backgroundColor: star.color, color: star.color }} />
                <span className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">{star.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50 tracking-wider">
                <div className="flex flex-col"><span className="text-white/30 text-[8px] uppercase">Magnitude</span><span className="text-white/80">{star.mag.toFixed(2)}</span></div>
                <div className="flex flex-col"><span className="text-white/30 text-[8px] uppercase">Distance</span><span className="text-white/80">{star.dist}</span></div>
                <div className="flex flex-col"><span className="text-white/30 text-[8px] uppercase">Spectral</span><span className="text-white/80">{star.spectral}</span></div>
                <div className="flex flex-col"><span className="text-white/30 text-[8px] uppercase">Dec</span><span className="text-white/80">{star.dec.toFixed(1)}°</span></div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 text-[9.5px] text-white/70 leading-relaxed font-sans tracking-wide">
                {star.info}
              </div>
            </div>
            <div className="w-[1px] h-6 bg-gradient-to-b from-white/40 to-transparent mt-1" />
          </div>
        </Html>
      )}
    </group>
  );
}

function generateStars(count: number, isMilkyWay = false) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const l = Math.random() * 2.0 * Math.PI;
    let b;
    
    if (isMilkyWay) {
      // Gaussian distribution around the galactic plane
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      b = z * 0.12; // Tight spread around b=0
    } else {
      const rand = Math.random();
      if (rand > 0.6) b = (Math.random() - 0.5) * (Math.random() - 0.5) * 0.8;
      else if (rand > 0.2) b = (Math.random() - 0.5) * (Math.random() - 0.5) * 2.5;
      else b = Math.asin(2.0 * Math.random() - 1.0);
    }

    const r = 80 + Math.pow(Math.random(), 2) * 220; 
    
    const gx = r * Math.cos(b) * Math.cos(l);
    const gy = r * Math.cos(b) * Math.sin(l);
    const gz = r * Math.sin(b);

    const tilt = 62.87 * (Math.PI / 180);
    const ex = gx;
    const ey = gy * Math.cos(tilt) - gz * Math.sin(tilt);
    const ez = gy * Math.sin(tilt) + gz * Math.cos(tilt);

    positions[i * 3] = ex;
    positions[i * 3 + 1] = ey;
    positions[i * 3 + 2] = ez;

    const mix = Math.random();
    let c = new THREE.Color();
    if (isMilkyWay) {
      if (mix > 0.6) c.set("#ffffff");
      else if (mix > 0.3) c.set("#aaccff");
      else c.set("#ffd2a1");
    } else {
      if (mix > 0.8) c.set("#ffffff");
      else if (mix > 0.5) c.set("#aaccff");
      else if (mix > 0.3) c.set("#ffddaa");
      else if (mix > 0.15) c.set("#ff8866");
      else c.set("#4488ff");
    }
    
    const dim = isMilkyWay ? (0.4 + Math.random() * 0.6) : (0.2 + Math.random() * 0.8);
    colors[i * 3] = c.r * dim;
    colors[i * 3 + 1] = c.g * dim;
    colors[i * 3 + 2] = c.b * dim;
  }
  return { positions, colors };
}

export function BirthSky() {
  const parallaxGroupRef = useRef<THREE.Group>(null);
  const skyGroupRef = useRef<THREE.Group>(null);
  const speedRef = useRef(0.04);

  const [hoveredBgStar, setHoveredBgStar] = useState<{ id: string, pos: [number, number, number] } | null>(null);
  // Force a re-render when global hovered constellation changes
  const [activeConstellation, setActiveConstellation] = useState<string | null>(null);

  const dotTex = useMemo(() => createDotTexture(), []);
  const flareTex = useMemo(() => createFlareTexture(), []);

  const layer1 = useMemo(() => generateStars(12000), []);
  const layer2 = useMemo(() => generateStars(3500), []);
  const layer3 = useMemo(() => generateStars(500), []);
  const milkyWay = useMemo(() => generateStars(18000, true), []); // Dense galactic band

  const handlePointerMove = (e: any, positionsArr: Float32Array, prefix: string) => {
    e.stopPropagation();
    if (e.index !== undefined) {
      setHoveredBgStar({
        id: `${prefix}-${e.index}`,
        pos: [positionsArr[e.index * 3], positionsArr[e.index * 3 + 1], positionsArr[e.index * 3 + 2]]
      });
      globalHoverState = true;
      document.body.style.cursor = "crosshair";
    }
  };

  const handlePointerOut = () => {
    setHoveredBgStar(null);
    globalHoverState = false;
    document.body.style.cursor = "auto";
  };

  // Generate constellation dashed lines
  const constellationMeshes = useMemo(() => {
    const getXYZ = (ra: number, dec: number, r: number) => {
      const ra_rad = (ra / 24.0) * 2 * Math.PI;
      const dec_rad = (dec / 180.0) * Math.PI;
      return new THREE.Vector3(
        r * Math.cos(dec_rad) * Math.cos(ra_rad),
        r * Math.sin(dec_rad),
        r * Math.cos(dec_rad) * Math.sin(ra_rad)
      );
    };

    return CONSTELLATIONS.map(c => {
      const pts: THREE.Vector3[] = [];
      const starNames = new Set<string>();
      c.lines.forEach(([s1, s2]) => {
        const star1 = REAL_STARS.find(s => s.name === s1);
        const star2 = REAL_STARS.find(s => s.name === s2);
        if (star1 && star2) {
          pts.push(getXYZ(star1.ra, star1.dec, 90));
          pts.push(getXYZ(star2.ra, star2.dec, 90));
          starNames.add(s1);
          starNames.add(s2);
        }
      });
      
      const center = new THREE.Vector3();
      if (pts.length > 0) {
        pts.forEach(p => center.add(p));
        center.divideScalar(pts.length);
        center.multiplyScalar(0.9); // Pull slightly inward so text floats above stars
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineSegments(geo);
      line.computeLineDistances();
      return { name: c.name, geometry: line.geometry, starNames, center: [center.x, center.y, center.z] };
    });
  }, []);

  useFrame((state, delta) => {
    // Stop time completely on hover
    const targetSpeed = globalHoverState ? 0.0 : 0.03;
    speedRef.current += (targetSpeed - speedRef.current) * 0.1;
    
    if (skyGroupRef.current) {
      skyGroupRef.current.rotation.y += delta * speedRef.current;
    }

    // Sync constellation highlighting
    let currentConstellation = null;
    if (globalHoveredStarName) {
      const found = constellationMeshes.find(c => c.starNames.has(globalHoveredStarName as string));
      if (found) currentConstellation = found.name;
    }
    if (currentConstellation !== activeConstellation) {
      setActiveConstellation(currentConstellation);
    }
  });

  // ─── SCALABLE ASTRONOMICAL ENGINE ─────────────────────────────────────────
  // Instead of fetching static star coordinates from an API (which is inefficient 
  // since stars don't move), we use a standard planetarium approach (like Stellarium):
  // We use a fixed lightweight catalog and apply complex mathematical rotation 
  // based on the user's specific birth time, latitude, and longitude.
  
  const USER_PROFILE = {
    date: new Date('2005-10-14T21:00:00+05:30'), // Mandideep night time
    latitude: 23.09,
    longitude: 77.53
  };

  const { lst_rad, lat_rad } = useMemo(() => {
    // 1. Calculate Julian Date
    const jd = (USER_PROFILE.date.getTime() / 86400000.0) + 2440587.5;
    // 2. Days since J2000 epoch
    const d = jd - 2451545.0;
    // 3. Greenwich Mean Sidereal Time (GMST) in degrees
    let gmst = 280.46061837 + 360.98564736629 * d;
    gmst = ((gmst % 360.0) + 360.0) % 360.0; // Ensure positive
    // 4. Local Sidereal Time (LST) based on user's longitude
    const lst = (gmst + USER_PROFILE.longitude) % 360.0;
    
    return {
      lst_rad: lst * (Math.PI / 180.0),
      lat_rad: USER_PROFILE.latitude * (Math.PI / 180.0)
    };
  }, []);

  const getRealisticInfo = (idStr: string) => {
     const id = parseInt(idStr.split('-')[1] || "0");
     const mag = ((id % 100) / 100 * 5 + 4).toFixed(2);
     const dist = (10 + (id % 500) * 10) + " ly";
     const classes = ["O", "B", "A", "F", "G", "K", "M"];
     const spectral = classes[id % 7] + (id % 10) + "V";
     return { mag, dist, spectral };
  };

  return (
    <group>
      <RaycasterSettings />

      <mesh scale={300}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#000105" side={THREE.BackSide} />
      </mesh>

      {/* The sky is mathematically rotated to perfectly match the user's birth time & location */}
      <group rotation={[-lat_rad + Math.PI / 2, 0, 0]}>
        <group ref={skyGroupRef} rotation={[0, lst_rad, 0]}>
          
          {/* Constellations */}
        {constellationMeshes.map((c) => {
          const isActive = c.name === activeConstellation;
          return (
            <group key={c.name}>
              <lineSegments geometry={c.geometry}>
                <lineBasicMaterial 
                  color={isActive ? "#ffffff" : "#60b0ff"} 
                  transparent 
                  opacity={isActive ? 1.0 : 0.5} 
                  linewidth={isActive ? 2 : 1}
                  depthWrite={false}
                />
              </lineSegments>
              {isActive && (c as any).center && (
                 <Html position={(c as any).center} center className="pointer-events-none z-10">
                    <div className="text-white text-[24px] font-bold uppercase tracking-[0.2em] pointer-events-none mix-blend-screen drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] px-4 py-2 bg-black/20 rounded-xl backdrop-blur-md border border-white/10 whitespace-nowrap">
                      {c.name}
                    </div>
                 </Html>
              )}
            </group>
          );
        })}

        <points onPointerMove={(e) => handlePointerMove(e, layer1.positions, 'L1')} onPointerOut={handlePointerOut}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer1.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[layer1.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={1.2} vertexColors map={dotTex} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>

        <points onPointerMove={(e) => handlePointerMove(e, layer2.positions, 'L2')} onPointerOut={handlePointerOut}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer2.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[layer2.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={2.5} vertexColors map={dotTex} transparent opacity={1.0} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>

        <points onPointerMove={(e) => handlePointerMove(e, layer3.positions, 'L3')} onPointerOut={handlePointerOut}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer3.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[layer3.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={8.0} vertexColors map={flareTex} transparent opacity={1.0} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>

        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[milkyWay.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[milkyWay.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={1.8} vertexColors map={dotTex} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>

        {hoveredBgStar && (
          <Html center position={[hoveredBgStar.pos[0] * 0.9, hoveredBgStar.pos[1] * 0.9, hoveredBgStar.pos[2] * 0.9]} className="pointer-events-none z-40">
             <div className="p-2.5 bg-[#020108]/95 border border-[#40a0ff]/30 rounded-[8px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] min-w-[140px]">
                <div className="flex items-center gap-1.5 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#40a0ff] shadow-[0_0_6px_#40a0ff]" />
                   <div className="text-white text-[10px] font-bold tracking-[0.15em] uppercase">Sector {hoveredBgStar.id}</div>
                </div>
                {(() => {
                   const info = getRealisticInfo(hoveredBgStar.id);
                   return (
                     <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-white/50 tracking-wider">
                       <div className="flex flex-col"><span className="text-white/30 text-[7px] uppercase">Mag</span><span className="text-white/80">{info.mag}</span></div>
                       <div className="flex flex-col"><span className="text-white/30 text-[7px] uppercase">Dist</span><span className="text-white/80">{info.dist}</span></div>
                       <div className="flex flex-col"><span className="text-white/30 text-[7px] uppercase">Class</span><span className="text-white/80">{info.spectral}</span></div>
                       <div className="flex flex-col"><span className="text-white/30 text-[7px] uppercase">Status</span><span className="text-[#40a0ff]/80">Logged</span></div>
                     </div>
                   );
                })()}
             </div>
          </Html>
        )}

        {REAL_STARS.map((star) => (
          <InteractiveStar key={star.name} star={star} radius={90} flareTex={flareTex} />
        ))}

      </group>
      </group>
    </group>
  );
}
