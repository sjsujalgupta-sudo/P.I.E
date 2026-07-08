"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, User, LogOut, ChevronRight, Bell, Palette, ShieldCheck } from "lucide-react";

import { useState, useRef, useEffect } from "react";

import Image from "next/image";

const pageTitles: Record<string, string> = {
    "/dashboard": "System Overview",
    "/synapse": "Neural Synapse",
    "/insights": "Intelligence Signals",
    "/vault": "Secure Vault",
    "/atlas": "Behavioral Atlas",
    "/marketplace": "Data Marketplace",
    "/contracts": "Smart Contracts",
    "/profile": "Identity Node",
    "/settings": "System Config",
    "/origin": "Origin",
};

export function Navbar() {
    const pathname = usePathname();
    const pageTitle = pageTitles[pathname] || "PIE";
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const quickSettings = [
        { icon: Palette, label: "Appearance", href: "/settings?section=appearance" },
        { icon: ShieldCheck, label: "Privacy", href: "/settings?section=privacy" },
        { icon: Bell, label: "Notifications", href: "/settings?section=notifications" },
    ];

    return (
        <header
            className="sticky top-0 z-30 h-[68px] flex items-center justify-between px-6 shell-glass border-b border-separator"
        >
            {/* Left: Logo (mobile) + Page Title + Home links */}
            <div className="flex items-center gap-4">
                <div className="lg:hidden flex items-center gap-2.5 mr-2">
                    <div className="w-8 h-8 rounded-[10px] metal-chromium metal-shine flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.15)] overflow-hidden">
                        <Image 
                            src="/pie-brand-logo.png" 
                            alt="PIE Logo" 
                            width={32} 
                            height={32} 
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="font-bold text-[13px] metal-text-platinum tracking-tight">PIE</span>
                </div>
                <div className="hidden lg:flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] metal-chromium metal-shine flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.15)] overflow-hidden">
                        <Image 
                            src="/pie-brand-logo.png" 
                            alt="PIE Logo" 
                            width={28} 
                            height={28} 
                            className="object-contain"
                            priority
                        />
                    </div>
                    <motion.h1
                        className="text-[15px] font-bold metal-text-platinum tracking-tight"
                        key={pageTitle}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] as const }}
                    >
                        {pageTitle}
                    </motion.h1>
                </div>
            </div>

            {/* Center: Dynamic Apple Liquid Glass Navbar */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:flex pointer-events-none">
                <nav className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-white/5 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-3xl saturate-[250%] relative overflow-hidden">
                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none rounded-full" />
                    
                    {[
                        { href: "/origin", label: "Origin" },
                        { href: "/vault", label: "Vault" },
                        { href: "/atlas", label: "Atlas" },
                        { href: "/synapse", label: "Synapse" },
                        { href: "/insights", label: "Insights" },
                    ].map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-300 z-10 ${isActive ? "text-white" : "text-white/60 hover:text-white"}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav-indicator"
                                        className="absolute inset-0 bg-white/15 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right: Settings + Theme + User */}
            <div className="flex items-center gap-3">
                

                {/* Settings Dropdown */}
                <div ref={settingsRef} className="relative">
                    <button
                        onClick={() => { setSettingsOpen(!settingsOpen); }}
                        className="p-2.5 rounded-[12px] text-label-tertiary hover:text-label hover:bg-[var(--color-surface-hover)] transition-all duration-200 relative group"

                        aria-label="Settings"
                    >
                        <motion.div
                            animate={{ rotate: settingsOpen ? 90 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Settings className="w-[20px] h-[20px]" />
                        </motion.div>
                        {/* Hover tooltip */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-elevated text-footnote text-label-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Quick Settings
                        </div>
                    </button>

                    <AnimatePresence>
                        {settingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-64 glass-dropdown p-2"
                            >
                                <div className="px-3 py-2 border-b border-separator mb-2">
                                    <p className="text-[13px] font-semibold text-label">Quick Settings</p>
                                    <p className="text-footnote text-label-tertiary mt-0.5">Jump to settings</p>
                                </div>
                                <div className="space-y-0.5">
                                    {quickSettings.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSettingsOpen(false)}
                                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] text-label-secondary hover:text-label hover:bg-[var(--color-surface-hover)] transition-all group"

                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-[8px] bg-[var(--color-surface-elevated)] flex items-center justify-center group-hover:bg-[var(--color-surface-hover)] transition-colors">

                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span>{item.label}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-label-tertiary group-hover:text-label transition-colors" />
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 pt-2 border-t border-separator">
                                    <Link
                                        href="/settings"
                                        onClick={() => setSettingsOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-accent hover:bg-accent-dim transition-all"
                                    >
                                        View All Settings
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </header>
    );
}
