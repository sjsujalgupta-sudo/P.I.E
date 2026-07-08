"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NeuralCore } from "@/components/home/NeuralCore";
import { BifrostCanvas } from "@/components/home/BifrostCanvas";

export type IntelligenceMode = "neural" | "focus" | "privacy" | "value";

interface LaunchedSlice {
  name: string;
  color: string;
  route: string;
}

export default function Home() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode]                   = useState<IntelligenceMode>("neural");
  const [isCoreHovered, setIsCoreHovered] = useState(false);
  const [launched, setLaunched]           = useState<LaunchedSlice | null>(null);
  const [phase, setPhase]                 = useState(0);
  const [transitionPhase, setTransitionPhase] = useState(0);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const navFired                          = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handlePortalLaunch = useCallback((slice: LaunchedSlice) => {
    navFired.current = false;
    setLaunched(slice);
    setTransitionPhase(1); // 1 = Bifrost
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[100vh] bg-[#020108] overflow-hidden font-sans">
      {/* ── Celestial Alignment Proof ────────────────────────────── */}
      <motion.div
        className="absolute bottom-6 left-6 z-30 pointer-events-none flex flex-col text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: (isCoreHovered || phase > 0) ? 0 : 1 }}
        transition={{ duration: 1.2 }}
      >
        <div className="text-[9px] font-mono tracking-[0.2em] text-white/40 mb-1 flex items-center gap-2">
          <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_5px_#4ade80]" />
          CELESTIAL ALIGNMENT LOCKED
        </div>
        <div className="text-[10px] font-mono tracking-widest text-white/20">DATE: 14 OCT 2005</div>
        <div className="text-[10px] font-mono tracking-widest text-white/20">LOC: 23.09° N, 77.53° E</div>
      </motion.div>

      {/* ── Fullscreen Toggle ─────────────────────────────────── */}
      <motion.button
        onClick={() => {
          if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => console.log(err));
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: (isCoreHovered || phase > 0) ? 0 : 1 }}
        transition={{ duration: 1.2 }}
        className="absolute bottom-6 right-6 z-40 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white/50 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer"
      >
        {isFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </motion.button>

      {/* ── Welcome HUD ─────────────────────────────────────────── */}
      <motion.div
        className="absolute top-10 left-0 right-0 z-30 pointer-events-none flex flex-col items-center text-center px-4"
        initial={{ opacity: 0 }}
        animate={{
          opacity: (isCoreHovered || phase > 0) ? 0 : 1,
          y:       (isCoreHovered || phase > 0) ? -16 : 0,
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse" />
          <span className="text-[9px] font-bold text-white/60 tracking-[0.35em] uppercase">Intelligence Signal Active</span>
        </div>

        <h1 className="mt-6 text-[36px] md:text-[52px] font-[300] tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/20 leading-none uppercase ml-[0.35em]">
          Origin
        </h1>

        <p className="mt-4 text-[11px] font-medium text-white/40 max-w-[320px] leading-relaxed tracking-[0.15em] uppercase">
          A personal cosmic intelligence environment.
        </p>

        <div className="mt-10 flex items-center gap-4 opacity-50">
          <span className="text-[8px] text-white uppercase tracking-[0.35em] font-bold">Drag to rotate</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-[8px] text-white uppercase tracking-[0.35em] font-bold">Click to launch</span>
        </div>
      </motion.div>

      {/* ── 3D Sphere ───────────────────────────────────────────── */}
      <div className="absolute inset-0 z-20">
        <NeuralCore
          mode={mode}
          setMode={setMode}
          onHoverChange={setIsCoreHovered}
          onPortalLaunch={handlePortalLaunch}
          onPhaseChange={setPhase}
        />
      </div>

      {/* ── Phase 1: Bifrost Tunnel ───────────────────────────── */}
      {transitionPhase === 1 && launched && (
        <BifrostCanvas
          accentColor={launched.color}
          onComplete={() => {
            if (!navFired.current) {
              navFired.current = true;
              router.push(launched.route);
            }
          }}
        />
      )}
    </div>
  );
}
