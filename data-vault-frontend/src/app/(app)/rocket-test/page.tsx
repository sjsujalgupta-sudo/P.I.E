"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";

type FlightStage = "idle" | "igniting" | "liftoff" | "flight" | "burn" | "landing" | "touchdown";

/* ─── Seamless Cinematic Sprite (Cross-fade & Flash) ─── */
const RocketSprite = ({ stage }: { stage: FlightStage }) => {
    const stageMap: Record<FlightStage, string> = {
        "idle": "0%", "igniting": "0%", "liftoff": "20%", 
        "flight": "40%", "burn": "60%", "landing": "80%", "touchdown": "100%",
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={stage}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px) brightness(2)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(8px) brightness(2)" }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.23, 1, 0.32, 1], // Cinematic ease-out
                        scale: { type: "spring", stiffness: 200, damping: 20 }
                    }}
                    className="w-full h-full"
                    style={{
                        backgroundImage: "url('/rocket-stages.png')",
                        backgroundSize: "600% 100%",
                        backgroundPosition: `${stageMap[stage] || "0%"} center`,
                        backgroundRepeat: "no-repeat",
                    }}
                />
            </AnimatePresence>

            {/* Transition Flash Overlay */}
            <AnimatePresence>
                <motion.div
                    key={`flash-${stage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white pointer-events-none z-50"
                />
            </AnimatePresence>
        </div>
    );
};

const RichRocketSimulator = ({ stage }: { stage: FlightStage }) => (
    <div className="relative w-64 h-96 bg-black rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
        {/* Stable Cosmic Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] to-black opacity-40" />
        
        <RocketSprite stage={stage} />
        
        {/* High-Refractive Border */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 rounded-[40px]" />
    </div>
);

export default function RocketTestPage() {
    const [currentStage, setCurrentStage] = useState<FlightStage>("idle");

    const stages: FlightStage[] = ["idle", "igniting", "liftoff", "flight", "burn", "landing", "touchdown"];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 font-sans text-white">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">SSTO FLIGHT SIMULATOR</h1>
            <p className="text-slate-400 mb-12">Testing Propulsive Reusable Rocket Stages</p>

            {/* Large Preview Area */}
            <div className="mb-16 transform scale-150">
                <RichRocketSimulator stage={currentStage} />
            </div>

            {/* Mission Progress Bar */}
            <div className="w-full max-w-xl h-1 bg-white/5 rounded-full mb-12 relative overflow-hidden">
                <motion.div 
                    className="absolute inset-y-0 left-0 bg-white"
                    animate={{ width: `${((stages.indexOf(currentStage) + 1) / stages.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
            </div>

            {/* Controller UI */}
            <div className="grid grid-cols-4 gap-4 max-w-2xl w-full">
                {stages.map((stage) => (
                    <button
                        key={stage}
                        onClick={() => setCurrentStage(stage)}
                        className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-[0.2em] transition-all duration-300
                            ${currentStage === stage 
                                ? "bg-white border-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]" 
                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        {stage}
                    </button>
                ))}
            </div>

            {/* Sequence Player */}
            <button
                onClick={() => {
                    const timeline = [0, 800, 1600, 2400, 3200, 4000, 5000];
                    stages.forEach((stage, i) => {
                        setTimeout(() => setCurrentStage(stage), timeline[i]);
                    });
                }}
                className="mt-12 px-16 py-5 bg-white text-black rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
            >
                EXECUTE FULL MISSION
            </button>
        </div>
    );
}
