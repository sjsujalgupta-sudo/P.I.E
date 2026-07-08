"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface IntelligenceSignalProps {
    label: string;
    value: string;
    icon: LucideIcon;
    status?: string;
    delay?: number;
    position: { top?: string; bottom?: string; left?: string; right?: string };
}

export function IntelligenceSignal({ label, value, icon: Icon, status, delay = 0, position }: IntelligenceSignalProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-20 group"
            style={position}
        >
            <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative flex items-center gap-3 cursor-crosshair"
            >
                {/* Orbital connection line (visual aesthetic) */}
                <div className="absolute top-1/2 -left-12 w-10 h-px bg-gradient-to-r from-transparent to-white/20 hidden md:block" />

                {/* The Fragment */}
                <div className="relative overflow-hidden rounded-full border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-3xl p-1.5 pr-5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors group-hover:border-white/30 group-hover:bg-[#101018]/90">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-white border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold text-white tracking-tight leading-none">{value}</p>
                            {status && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {status}
                                </span>
                            )}
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-label-tertiary mt-1">{label}</p>
                    </div>

                    {/* Scanning light reflection */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </div>
            </motion.div>
        </motion.div>
    );
}
