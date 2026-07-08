"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Vault, Handshake, User,
    MessageCircle, Settings, Shield, LogOut, Rocket,
    Map, Brain, BarChart3, Home, Clock, Globe, Cpu, Activity, Zap, Scale, Archive,
    Route, Waves, Network, Lightbulb
} from "lucide-react";
import { BifrostCanvas } from "@/components/home/BifrostCanvas";

/* ─── Real Project Pages (Restored) ─── */
const NAV_SECTIONS = [
    {
        label: "Main",
        items: [
            { href: "/origin",      label: "Origin",      icon: Home,           subs: [] },
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, subs: [] },
            { id: "atlas", href: "/atlas",     label: "Atlas",     icon: Map,            subs: [
                { label: "OVERVIEW", icon: LayoutDashboard, href: "/atlas?mode=overview" },
                { label: "JOURNEY", icon: Route, href: "/atlas?mode=journey" },
                { label: "TIME", icon: Clock, href: "/atlas?mode=time" },
                { label: "PATTERNS", icon: Waves, href: "/atlas?mode=stream" },
                { label: "STRUCTURE", icon: Network, href: "/atlas?mode=structure" },
                { label: "INSIGHTS", icon: Lightbulb, href: "/atlas?mode=insights" },
            ]},
            { id: "insights", href: "/insights",  label: "Insights",  icon: BarChart3,      subs: [
                { label: "SIGNALS", icon: Activity, href: "/insights?mode=signals" },
                { label: "REASONING", icon: Scale, href: "/insights?mode=reasoning" },
            ]},
            { id: "synapse", href: "/synapse",   label: "Synapse",   icon: Brain,          subs: [
                { label: "STATIC", icon: Activity, href: "/synapse?mode=static" },
                { label: "PLAYBACK", icon: Zap, href: "/synapse?mode=playback" },
            ]},
        ],
    },
    {
        label: "Data",
        items: [
            { id: "vault", href: "/vault", label: "Vault", icon: Vault, subs: [
                { label: "LOW SENSITIVITY", icon: Shield, href: "/vault?mode=low" },
                { label: "MEDIUM SENSITIVITY", icon: Shield, href: "/vault?mode=medium" },
                { label: "HIGH SENSITIVITY", icon: Shield, href: "/vault?mode=high" },
            ]},
            { href: "/contracts", label: "Contracts", icon: Handshake, subs: [] },
            { href: "/profile", label: "Profile", icon: User, subs: [] },
        ],
    },
    {
        label: "Tools",
        items: [
            { href: "/assistant", label: "Assistant", icon: MessageCircle, subs: [] },
            { href: "/settings", label: "Settings", icon: Settings, subs: [] },
            { href: "#", label: "Sign Out", icon: LogOut, onClick: true, subs: [] },
        ],
    },
];

export default function DynamicIslandNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<any>(null);
    const [warpTarget, setWarpTarget] = useState<any>(null);
    const [anchorX, setAnchorX] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // ─── Auto-Hide Logic (Ghost Mode) ───
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const threshold = window.innerHeight - 100;
            setIsRevealed(e.clientY > threshold || isOpen);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isOpen]);

    const handleHover = (item: any | null, e?: React.MouseEvent) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (item && e) {
            const rect = e.currentTarget.getBoundingClientRect();
            setAnchorX(rect.left + rect.width / 2);
            setHoveredItem(item);
        } else {
            timeoutRef.current = setTimeout(() => setHoveredItem(null), 400);
        }
    };

    const handleNavigate = (item: any) => {
        if (item.onClick) {
            signOut();
            return;
        }

        // 🌉 The Cinematic Bridge: If on Origin, trigger the 3D Universe Launch
        if (pathname === "/origin" && item.href !== "/origin") {
            window.dispatchEvent(new CustomEvent("COSMOS_NAVIGATE", { 
                detail: { 
                    label: item.label, 
                    id: item.id || item.label.toLowerCase(),
                    route: item.href 
                } 
            }));
            setIsOpen(false);
            setHoveredItem(null);
            return;
        }

        // If NOT on Origin, but navigating to a new page, trigger Warp locally
        if (pathname !== item.href && item.href !== "#") {
            setWarpTarget(item);
            setIsOpen(false);
            setHoveredItem(null);
            return;
        }

        router.push(item.href);
        setIsOpen(false);
        setHoveredItem(null);
    };

    const allItems = NAV_SECTIONS.flatMap(s => s.items);

    return (
        <div className="fixed bottom-8 left-0 w-full z-[100] flex flex-col items-center pointer-events-none">
            
            {/* ─── Level 1: Predictive Satellite Bloom (Sub-Menus) ─── */}
            <AnimatePresence>
                {hoveredItem && hoveredItem.subs?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                        exit={{ opacity: 0, y: 5, scale: 0.95, x: "-50%" }}
                        className="absolute bottom-16 h-10 px-1 rounded-2xl bg-[#0a0a0b]/60 backdrop-blur-3xl saturate-[200%] border border-white/10 flex items-center gap-0.5 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] pointer-events-auto"
                        style={{ left: anchorX }}
                        onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
                        onMouseLeave={() => handleHover(null)}
                    >
                        {hoveredItem.subs.map((sub: any) => (
                            <button
                                key={sub.label}
                                onClick={() => handleNavigate(sub)}
                                className="h-8 px-3 rounded-xl flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                            >
                                <sub.icon className="w-3 h-3 group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase">{sub.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Level 0: The Master Cinematic Dock (Passengers Theme) ─── */}
            <div className="pointer-events-auto">
                <AnimatePresence mode="wait">
                    {!isOpen ? (
                        <motion.button
                            key="collapsed"
                            onClick={() => setIsOpen(true)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                                opacity: isRevealed ? 1 : 0.4, 
                                y: isRevealed ? 0 : 8,
                                scale: isRevealed ? 1 : 0.99
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ opacity: 1, scale: 1.01 }}
                            className="h-12 px-8 rounded-full bg-[#1c1c1e]/60 backdrop-blur-3xl saturate-[250%] border border-white/10 flex items-center gap-4 transition-all duration-500 group shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-[#2c2c2e]/60 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none rounded-full" />
                            <Rocket className="w-4 h-4 text-white/60 group-hover:text-white transition-all duration-500 z-10 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                            <span className="text-[10px] font-bold tracking-[0.3em] text-white/60 group-hover:text-white uppercase transition-all duration-500 z-10">Begin</span>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded"
                            className="h-14 p-1.5 rounded-full bg-[#1c1c1e]/60 backdrop-blur-3xl saturate-[250%] border border-white/10 flex items-center shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] relative overflow-hidden"
                            initial={{ width: 100, opacity: 0, y: 15 }}
                            animate={{ width: "auto", opacity: 1, y: 0 }}
                            exit={{ width: 100, opacity: 0, y: 15 }}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none rounded-full" />
                            <div className="flex items-center px-1.5 gap-1 relative z-10">
                                {allItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <div 
                                            key={item.label} 
                                            className="relative px-0.5"
                                            onMouseEnter={(e) => handleHover(item, e)}
                                        >
                                            <button
                                                onClick={() => handleNavigate(item)}
                                                className={`h-11 px-4 rounded-full flex items-center gap-2.5 transition-all duration-300 relative group z-10
                                                    ${isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                                            >
                                                <item.icon className={`w-4 h-4 relative z-10 transition-all duration-300 ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "group-hover:text-white"}`} />
                                                <span className="text-[10px] font-bold tracking-[0.15em] uppercase hidden xl:block relative z-10">{item.label}</span>
                                                
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="island-active"
                                                        className="absolute inset-0 bg-white/15 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10 -z-10"
                                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Global Warp Canvas when triggered from Navbar outside of Origin */}
            {warpTarget && (
                <BifrostCanvas 
                    accentColor="#06b6d4" 
                    onComplete={() => {
                        router.push(warpTarget.href);
                        setTimeout(() => setWarpTarget(null), 500);
                    }}
                />
            )}
        </div>
    );
}
