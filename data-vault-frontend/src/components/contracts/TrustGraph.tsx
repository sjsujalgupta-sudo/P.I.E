"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Network, Share2, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Note: Using a simplified visual representation for the trust graph 
// instead of a full force-graph to maintain the Apple Liquid Glass aesthetic.

const TRUST_NODES = [
    { id: "User", type: "core", x: 50, y: 50, label: "You" },
    { id: "QA", type: "partner", x: 20, y: 30, label: "Quantum" },
    { id: "NR", type: "partner", x: 80, y: 25, label: "Nexus" },
    { id: "BM", type: "partner", x: 75, y: 75, label: "BioMetrics" },
    { id: "EA", type: "partner", x: 30, y: 80, label: "Enterprise" },
];

const TRUST_EDGES = [
    { from: "User", to: "QA", strength: 0.8 },
    { from: "User", to: "NR", strength: 0.6 },
    { from: "User", to: "BM", strength: 0.9 },
    { from: "User", to: "EA", strength: 0.4 },
    { from: "QA", to: "NR", strength: 0.3 },
];

export function TrustGraph() {
    return (
        <GlassCard className="h-full min-h-[400px] p-8 relative overflow-hidden" metal="silver">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-white">Trust Graph Network</h4>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-label-tertiary uppercase font-bold">Strong</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500/30" />
                        <span className="text-[10px] text-label-tertiary uppercase font-bold">Emerging</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full aspect-square md:aspect-video bg-black/20 rounded-[32px] border border-white/5 overflow-hidden">
                {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full">
                    {TRUST_EDGES.map((edge, i) => {
                        const from = TRUST_NODES.find(n => n.id === edge.from)!;
                        const to = TRUST_NODES.find(n => n.id === edge.to)!;
                        return (
                            <motion.line
                                key={i}
                                x1={`${from.x}%`}
                                y1={`${from.y}%`}
                                x2={`${to.x}%`}
                                y2={`${to.y}%`}
                                stroke="currentColor"
                                strokeWidth={edge.strength * 3}
                                className="text-blue-500/20"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: i * 0.2 }}
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {TRUST_NODES.map((node, i) => (
                    <motion.div
                        key={node.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                            node.type === "core" 
                                ? "bg-blue-500 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]" 
                                : "bg-white/5 border-white/10 group-hover:border-blue-400/50 group-hover:bg-blue-500/10"
                        )}>
                            {node.type === "core" ? <Shield className="w-6 h-6 text-white" /> : <Users className="w-5 h-5 text-white/70" />}
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">{node.label}</span>
                        </div>
                        
                        {/* Hover Pulse */}
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}

                {/* Animated Particles on Lines */}
                <div className="absolute inset-0 pointer-events-none">
                    {TRUST_EDGES.map((edge, i) => {
                        const from = TRUST_NODES.find(n => n.id === edge.from)!;
                        const to = TRUST_NODES.find(n => n.id === edge.to)!;
                        return (
                            <motion.div
                                key={`p-${i}`}
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"
                                animate={{
                                    left: [`${from.x}%`, `${to.x}%`],
                                    top: [`${from.y}%`, `${to.y}%`],
                                }}
                                transition={{
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                style={{ position: "absolute" }}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest mb-1">Network Density</p>
                    <p className="text-xl font-mono text-white font-bold">0.84</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest mb-1">Reputation Path</p>
                    <p className="text-xl font-mono text-blue-400 font-bold">Optimized</p>
                </div>
            </div>
            
            <button className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-3 h-3" />
                Export Trust Passport
            </button>
        </GlassCard>
    );
}
