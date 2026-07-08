"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020203]">
            {/* Infinite Depth Base */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(15,20,35,0.4)_0%,_rgba(2,2,3,1)_100%)]" />
            
            {/* Deep Volumetric Fog Layers */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15),transparent_60%)] blur-[100px] mix-blend-screen"
            />
            
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.05, 0.15, 0.05],
                    rotate: [0, -90, 0]
                }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear", delay: 5 }}
                className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15),transparent_60%)] blur-[100px] mix-blend-screen"
            />

            {/* Giant Slow Topology Mesh */}
            <div className="absolute inset-0 perspective-[2000px] flex items-center justify-center opacity-20">
                <motion.div 
                    animate={{ rotateX: 70, rotateZ: 360, y: [0, -20, 0] }}
                    transition={{ 
                        rotateZ: { duration: 200, repeat: Infinity, ease: "linear" },
                        y: { duration: 20, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-[300vw] h-[300vw] absolute"
                    style={{
                        backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)`,
                        backgroundSize: '120px 120px',
                        transform: 'rotateX(70deg)'
                    }}
                />
            </div>

            {/* Ultra-low-opacity Constellation Lines / Ambient Connections */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <pattern id="constellation" width="200" height="200" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1" fill="#fff" />
                    <circle cx="150" cy="80" r="1.5" fill="#fff" />
                    <circle cx="80" cy="160" r="1" fill="#fff" />
                    <line x1="20" y1="20" x2="150" y2="80" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
                    <line x1="150" y1="80" x2="80" y2="160" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
                    <line x1="80" y1="160" x2="20" y2="20" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#constellation)" />
            </svg>

            {/* Neural Pathways / Computational Dust */}
            <div className="absolute inset-0">
                {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ 
                            x: Math.random() * 100 + "vw", 
                            y: Math.random() * 100 + "vh",
                            scale: Math.random() * 0.5 + 0.5,
                            opacity: 0
                        }}
                        animate={{ 
                            y: [null, Math.random() * 100 + "vh"],
                            x: [null, Math.random() * 100 + "vw"],
                            opacity: [0, Math.random() * 0.4 + 0.1, 0]
                        }}
                        transition={{ 
                            duration: 20 + Math.random() * 30, 
                            repeat: Infinity, 
                            ease: "linear",
                            delay: Math.random() * 20
                        }}
                        className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                    />
                ))}
            </div>
            
            {/* Cinematic Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#020203_100%)]" />
        </div>
    );
}
