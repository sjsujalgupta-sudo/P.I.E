"use client";

import { useEffect, useRef } from "react";

interface BifrostCanvasProps {
  accentColor: string;
  onComplete: () => void;
}

const TOTAL_MS = 2600; // slightly longer for dramatic build-up

export function BifrostCanvas({ accentColor, onComplete }: BifrostCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef   = useRef(false);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;

    doneRef.current = false;

    // Generate stars for warp effect
    const starCount = 300;
    const stars = Array.from({ length: starCount }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random(); // 0 (center) to 1 (edge)
      const depth = Math.random();
      return { angle, distance, depth, lengthMult: 0.5 + Math.random() * 1.5 };
    });

    // Generate quantum accretion rings
    const ringCount = 12;
    const rings = Array.from({ length: ringCount }).map((_, i) => {
      return { 
        depth: i / ringCount, 
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 2 + Math.random() * 3
      };
    });

    function frame(now: number) {
      if (doneRef.current) return;
      if (!startRef.current) startRef.current = now;

      const elapsed = now - startRef.current;
      const t  = Math.min(elapsed / TOTAL_MS, 1);
      const t2 = t * t;
      const t3 = t2 * t;

      // ── Space Background ──────────────────────────────────────────
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      // Camera shake at peak speed
      const shakeAmount = t > 0.4 && t < 0.9 ? (t - 0.4) * 15 : 0;
      const dx = (Math.random() - 0.5) * shakeAmount;
      const dy = (Math.random() - 0.5) * shakeAmount;
      ctx.save();
      ctx.translate(dx, dy);

      // ── Star Warp (Interstellar jump) ─────────────────────────────
      // As t increases, speed goes exponential
      const warpSpeed = 0.02 + t3 * 6;
      
      for (const star of stars) {
        star.depth -= warpSpeed * 0.05;
        if (star.depth <= 0) {
          star.depth = 1;
          star.distance = Math.random();
          star.angle = Math.random() * Math.PI * 2;
        }

        // Perspective calculation
        const z = Math.max(0.001, star.depth);
        const screenDist = (star.distance / z) * Math.max(W, H) * 0.5;
        
        // Star stretching based on speed (the warp effect)
        const tailZ = z + warpSpeed * star.lengthMult * 0.08;
        const tailDist = (star.distance / tailZ) * Math.max(W, H) * 0.5;

        if (screenDist > Math.max(W, H)) continue;

        const x = cx + Math.cos(star.angle) * screenDist;
        const y = cy + Math.sin(star.angle) * screenDist;
        const tx = cx + Math.cos(star.angle) * tailDist;
        const ty = cy + Math.sin(star.angle) * tailDist;

        // Color shifts from blue/white to accent color near edge
        const distRatio = Math.min(1, screenDist / (W * 0.5));
        const alpha = Math.min(1, (1 - z) * 2) * (t > 0.1 ? 1 : t * 10);
        
        const grad = ctx.createLinearGradient(x, y, tx, ty);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(1, `rgba(0, 200, 255, 0)`); // Cyan tail

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + (1 - z) * 3;
        ctx.stroke();
      }

      // ── Quantum Wormhole Rings ────────────────────────────────────
      const ringScrollSpeed = 0.5 + t2 * 5;
      
      for (const ring of rings) {
        ring.depth -= ringScrollSpeed * 0.01;
        if (ring.depth <= 0) ring.depth = 1;

        const z = ring.depth;
        const radius = (1 / Math.max(0.001, z)) * Math.min(W, H) * 0.1;
        
        if (radius > Math.max(W, H) * 1.5) continue;

        // Wobble effect for turbulent space
        const wobble = Math.sin(t * ring.wobbleSpeed + ring.wobbleOffset) * radius * 0.1;
        const rx = radius + wobble;
        const ry = radius * 0.85 - wobble;

        const alpha = Math.min(1, (1 - z) * 3) * (0.1 + t2 * 0.4);
        const lw = 2 + (1 - z) * 15;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, t * Math.PI * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = accentColor.replace("rgb", "rgba").replace(")", `, ${alpha})`).replace("#", "") + (alpha * 255).toString(16).split('.')[0];
        
        // Use raw rgba if accentColor is hex
        if (accentColor.startsWith("#")) {
            const r = parseInt(accentColor.slice(1, 3), 16);
            const g = parseInt(accentColor.slice(3, 5), 16);
            const b = parseInt(accentColor.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        ctx.lineWidth = lw;
        ctx.stroke();
        
        // Inner bright edge for ring
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.98, ry * 0.98, t * Math.PI * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = lw * 0.2;
        ctx.stroke();
      }

      // ── Event Horizon Center (Black Hole) ─────────────────────────
      // Center stays pitch black to suck you in, with a glowing corona
      const coronaRadius = Math.max(5, (1 - t3) * Math.min(W, H) * 0.05 + t3 * Math.min(W, H) * 0.8);
      
      const corona = ctx.createRadialGradient(cx, cy, coronaRadius * 0.2, cx, cy, coronaRadius * 2);
      let r=0,g=200,b=255;
      if (accentColor.startsWith("#")) {
          r = parseInt(accentColor.slice(1, 3), 16);
          g = parseInt(accentColor.slice(3, 5), 16);
          b = parseInt(accentColor.slice(5, 7), 16);
      }
      
      corona.addColorStop(0, "rgba(0,0,0,1)"); // Pure black center
      corona.addColorStop(0.2, `rgba(0,0,0,0.8)`);
      corona.addColorStop(0.4, `rgba(${r},${g},${b},${0.6 * t})`);
      corona.addColorStop(1, "rgba(0,0,0,0)");
      
      ctx.fillStyle = corona;
      ctx.fillRect(0, 0, W, H);

      ctx.restore(); // Remove shake

      // ── Flash to White at Absolute End ────────────────────────────
      // This perfectly bridges into SpectralBurst's start flash
      if (t > 0.85) {
        const flash = (t - 0.85) / 0.15;
        // Cubic easing for the flash
        const flashEase = flash * flash * flash;
        ctx.fillStyle = `rgba(255,255,255,${flashEase})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        doneRef.current = true;
        onComplete();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [accentColor, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 500,
        pointerEvents: "none",
      }}
    />
  );
}
