"use client";

import { motion } from "framer-motion";

export function BackgroundBlobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] select-none">
            {/* Main background material */}
            <div className="absolute inset-0 bg-[var(--color-background)]" />
            
            {/* Vibrant Liquid Orbs - High saturation for glass bleed */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.1) 60%, transparent 100%)",
                    filter: "blur(140px)",
                }}
                animate={{
                    x: [0, 60, -40, 0],
                    y: [0, -40, 60, 0],
                    scale: [1, 1.2, 0.85, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute bottom-[-15%] right-[-5%] w-[65%] h-[65%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0.1) 60%, transparent 100%)",
                    filter: "blur(120px)",
                }}
                animate={{
                    x: [0, -80, 50, 0],
                    y: [0, 50, -80, 0],
                    scale: [1.2, 0.85, 1.15, 1.2],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(167, 139, 250, 0.05) 60%, transparent 100%)",
                    filter: "blur(130px)",
                }}
                animate={{
                    x: [0, -50, 70, 0],
                    y: [0, 70, -40, 0],
                }}
                transition={{
                    duration: 35,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Apple Specular Dust - Light mode only for ethereal feel */}
            <div className="absolute inset-0 opacity-[0.03] dark:hidden pointer-events-none"
                 style={{
                     backgroundImage: `radial-gradient(circle, #000 0.5px, transparent 0.5px)`,
                     backgroundSize: '24px 24px'
                 }} 
            />
        </div>
    );
}
