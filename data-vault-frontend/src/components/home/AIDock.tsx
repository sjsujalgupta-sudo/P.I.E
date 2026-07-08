"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Vault, 
    Map, 
    Brain, 
    BarChart3,
    Handshake,
    Home
} from "lucide-react";

const DOCK_ITEMS = [
    { href: "/origin", icon: Home, label: "Home" },
    { href: "/atlas", icon: Map, label: "Atlas" },
    { href: "/vault", icon: Vault, label: "Vault" },
    { href: "/synapse", icon: Brain, label: "Synapse" },
    { href: "/insights", icon: BarChart3, label: "Insights" },
    { href: "/marketplace", icon: Handshake, label: "Market" },
];

export function AIDock() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[28px] bg-white/[0.04] border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative"
            >
                {/* Inner ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-xl pointer-events-none" />

                {DOCK_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="relative group">
                            <motion.div
                                whileHover={{ y: -6, scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative w-11 h-11 rounded-[16px] flex items-center justify-center transition-colors duration-300
                                    ${isActive 
                                        ? "bg-white/10 text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)]" 
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }
                                `}
                            >
                                <item.icon className="w-[20px] h-[20px]" />
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="dock-indicator"
                                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]"
                                    />
                                )}
                            </motion.div>

                            {/* Minimal Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[#1a1a24]/90 border border-white/10 backdrop-blur-xl text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl scale-95 group-hover:scale-100 origin-bottom">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </motion.div>
        </div>
    );
}
