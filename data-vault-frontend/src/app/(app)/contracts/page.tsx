"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Layers, 
    ShieldCheck, 
    Zap, 
    Fingerprint, 
    BarChart3, 
    ArrowRight,
    Search,
    Filter,
    Activity,
    Brain,
    Database,
    Shield,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

// --- Components ---
import { ExchangeHub } from "@/components/contracts/ExchangeHub";
import { TrustCenter } from "@/components/contracts/TrustCenter";
import { DatasetIntelligence } from "@/components/contracts/DatasetIntelligence";
import { ConsentLedger } from "@/components/contracts/ConsentLedger";
import { ContractAnalytics } from "@/components/contracts/ContractAnalytics";
import { TrustGraph } from "@/components/contracts/TrustGraph";
import { DisputeCenter } from "@/components/contracts/DisputeCenter";

type Section = "exchange" | "trust" | "graph" | "dispute" | "intelligence" | "consent" | "analytics";

interface NavItem {
    id: Section;
    label: string;
    icon: any;
    description: string;
}

const NAV_ITEMS: NavItem[] = [
    { 
        id: "exchange", 
        label: "Exchange Hub", 
        icon: Layers, 
        description: "Transactional data marketplace & active agreements." 
    },
    { 
        id: "trust", 
        label: "Trust Center", 
        icon: ShieldCheck, 
        description: "Multi-dimensional reliability metrics & AI reasoning." 
    },
    { 
        id: "graph", 
        label: "Trust Graph", 
        icon: Globe, 
        description: "Relationship-based reputation & partner networks." 
    },
    { 
        id: "dispute", 
        label: "Dispute Center", 
        icon: Shield, 
        description: "Smart resolution, evidence tracking & AI verdicts." 
    },
    { 
        id: "intelligence", 
        label: "Dataset Intelligence", 
        icon: Brain, 
        description: "ML-driven structural quality & confidence scoring." 
    },
    { 
        id: "consent", 
        label: "Consent Ledger", 
        icon: Fingerprint, 
        description: "Blockchain-verified permission history & access logs." 
    },
    { 
        id: "analytics", 
        label: "Analytics", 
        icon: BarChart3, 
        description: "Performance metrics, yield growth & retention." 
    },
];

export default function ContractsPage() {
    const [activeSection, setActiveSection] = useState<Section>("exchange");

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-black/50">
            <div className="w-full px-6 md:px-12 py-10 space-y-12 pb-40 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                <Database className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-blue-400">Trust Infrastructure</h2>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Contracts & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Trust Ledger</span>
                        </h1>
                        <p className="text-label-tertiary max-w-xl text-lg font-medium">
                            The decentralized engine for secure data commerce and reputation intelligence.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <GlassCard className="py-3 px-6 flex items-center gap-4 border-white/10" metal="silver">
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Global Trust</p>
                                <p className="text-xl font-mono text-white font-bold">88.2</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Shield className="w-5 h-5 text-blue-400" />
                            </div>
                        </GlassCard>
                        <GlassCard className="py-3 px-6 flex items-center gap-4 border-white/10" metal="silver">
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Daily Yield</p>
                                <p className="text-xl font-mono text-emerald font-bold">$142.50</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center border border-emerald/20">
                                <Zap className="w-5 h-5 text-emerald" />
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Primary Navigation Hub */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className="group relative text-left outline-none"
                            >
                                <GlassCard 
                                    className={cn(
                                        "h-full p-6 transition-all duration-500 relative overflow-hidden",
                                        isActive ? "bg-white/[0.08] border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.15)]" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                    )}
                                    metal={isActive ? "platinum" : undefined}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                            isActive ? "bg-blue-500/20 text-blue-400 scale-110" : "bg-white/5 text-label-tertiary group-hover:text-label-secondary"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeIndicator"
                                                className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                            />
                                        )}
                                    </div>
                                    <h3 className={cn(
                                        "text-sm font-bold tracking-tight mb-2 transition-colors",
                                        isActive ? "text-white" : "text-label-secondary group-hover:text-white"
                                    )}>
                                        {item.label}
                                    </h3>
                                    <p className="text-[10px] text-label-tertiary leading-relaxed font-medium">
                                        {item.description}
                                    </p>

                                    {/* Animated Underline for Active */}
                                    {isActive && (
                                        <motion.div 
                                            className="absolute bottom-0 left-0 h-0.5 bg-blue-400 w-full"
                                            layoutId="activeUnderline"
                                        />
                                    )}
                                </GlassCard>
                            </button>
                        );
                    })}
                </div>

                {/* Section Content */}
                <div className="relative pt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        >
                            {activeSection === "exchange" && <ExchangeHub />}
                            {activeSection === "trust" && <TrustCenter />}
                            {activeSection === "graph" && <TrustGraph />}
                            {activeSection === "dispute" && <DisputeCenter />}
                            {activeSection === "intelligence" && <DatasetIntelligence />}
                            {activeSection === "consent" && <ConsentLedger />}
                            {activeSection === "analytics" && <ContractAnalytics />}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>

            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-600/10 blur-[160px] rounded-full animate-pulse" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
            </div>
        </div>
    );
}
