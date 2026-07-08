"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CinematicPortalProps {
  sliceName: string;
  sliceColor: string;
  sliceDesc: string;
  visible: boolean;
}

export function CinematicPortal({ sliceName, sliceColor, sliceDesc, visible }: CinematicPortalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cinematic"
          className="fixed inset-0 z-[500] flex items-center justify-center"
          style={{ backgroundColor: "#000000" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeIn" }}
        >
          {/* Vignette texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)"
            }}
          />

          {/* Horizontal accent line (like a scope reticle) */}
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{ top: "50%", backgroundColor: sliceColor, opacity: 0.2 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Main content block */}
          <div className="relative flex flex-col items-center text-center select-none">

            {/* Module label (small, Netflix-style episode type) */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="w-5 h-[1.5px] rounded-full"
                style={{ backgroundColor: sliceColor }}
              />
              <span
                className="text-[10px] font-bold tracking-[0.45em] uppercase"
                style={{ color: sliceColor }}
              >
                PIE Module
              </span>
              <div
                className="w-5 h-[1.5px] rounded-full"
                style={{ backgroundColor: sliceColor }}
              />
            </motion.div>

            {/* The big name — like Netflix title */}
            <div className="relative overflow-hidden">
              <motion.h1
                className="text-[64px] md:text-[96px] font-[200] tracking-[-4px] text-white leading-none"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {sliceName}
              </motion.h1>

              {/* Light sweep — the Netflix "N" light streak effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, transparent 0%, transparent 35%, ${sliceColor}55 48%, white 52%, ${sliceColor}55 56%, transparent 65%, transparent 100%)`,
                }}
                initial={{ x: "-160%", opacity: 1 }}
                animate={{ x: "160%",  opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.75, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>

            {/* Descriptor */}
            <motion.p
              className="mt-5 text-[13px] font-medium tracking-widest text-white/40 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              {sliceDesc}
            </motion.p>

            {/* Bottom loading bar — Netflix "continue playing" bar */}
            <motion.div
              className="mt-12 w-32 h-[2px] rounded-full overflow-hidden bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: sliceColor }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.9, delay: 0.85, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
