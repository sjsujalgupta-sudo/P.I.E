"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    Search, 
    Filter, 
    ArrowRight, 
    Clock, 
    Shield, 
    Zap, 
    Database, 
    CheckCircle2, 
    XCircle,
    MoreHorizontal,
    TrendingUp,
    Globe,
    Layers,
    Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

type ContractStatus = "active" | "pending" | "incoming" | "completed";

interface Contract {
    id: string;
    title: string;
    entity: string;
    trustScore: number;
    status: ContractStatus;
    value: string;
    expiry: string;
    categories: string[];
    role: "buyer" | "seller";
}

const MOCK_CONTRACTS: Contract[] = [
    {
        id: "CON-9921",
        title: "Consumer Behavior Stream",
        entity: "Quantum Analytics",
        trustScore: 98,
        status: "active",
        value: "$420/mo",
        expiry: "2026-12-01",
        categories: ["Browsing", "Social"],
        role: "seller"
    },
    {
        id: "CON-8842",
        title: "Retail Intent Patterns",
        entity: "Nexus Retail",
        trustScore: 92,
        status: "pending",
        value: "$180/mo",
        expiry: "2026-08-15",
        categories: ["Purchase", "Search"],
        role: "seller"
    },
    {
        id: "CON-7721",
        title: "Health & Fitness Aggregator",
        entity: "BioMetrics Inc",
        trustScore: 95,
        status: "incoming",
        value: "$550/mo",
        expiry: "2027-01-10",
        categories: ["Wearables", "Health"],
        role: "buyer"
    }
];

function StatusRing({ status }: { status: ContractStatus }) {
    const color = {
        active: "text-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]",
        pending: "text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]",
        incoming: "text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
        completed: "text-label-tertiary"
    }[status];

    return (
        <div className={cn("w-3 h-3 rounded-full bg-current", color)} />
    );
}

function ContractItem({ contract }: { contract: Contract }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <GlassCard 
            hover 
            className="p-6 relative overflow-hidden group"
            metal={contract.status === "active" ? "platinum" : "silver"}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{contract.title}</h4>
                            <p className="text-[10px] text-label-tertiary font-mono uppercase tracking-widest">{contract.id} • {contract.entity}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {contract.categories.map(cat => (
                            <span key={cat} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-label-secondary">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-tighter">
                        <Shield className="w-3 h-3 text-amber-400" />
                        {contract.trustScore}% Trust
                    </div>
                    <p className="text-2xl font-mono text-emerald font-bold mt-4">{contract.value}</p>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-8 mt-8 border-t border-white/5 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Protocol Details</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-label-tertiary">Hash</span>
                                            <span className="text-white font-mono">0x4a...92</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-label-tertiary">Encryption</span>
                                            <span className="text-white">AES-256-GCM</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Rewards Stack</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-label-tertiary">Base Yield</span>
                                            <span className="text-white font-mono">$380.00</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-label-tertiary">Trust Bonus</span>
                                            <span className="text-emerald font-mono">+$40.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                                <Brain className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                        AI Contract Intelligence
                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[8px] uppercase font-bold tracking-widest">Analysis Active</span>
                                    </h5>
                                    <p className="text-xs text-label-secondary leading-relaxed">
                                        "Agreement identifies <span className="text-white font-medium">3 primary obligations</span>. Risk profile is <span className="text-emerald font-medium">minimal</span>. Access duration is limited to 12 months with auto-renewal probability of 72%."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Status</p>
                        <div className="flex items-center gap-2">
                            <StatusRing status={contract.status} />
                            <span className="text-xs text-white font-bold capitalize">{contract.status}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Expiration</p>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-label-tertiary" />
                            <span className="text-xs text-white font-mono">{contract.expiry}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/btn">
                        <ArrowRight className={cn("w-4 h-4 text-white transition-transform", isExpanded ? "rotate-90" : "")} />
                    </button>
                </div>
            </div>
            
            {/* Animated Status Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </GlassCard>
    );
}

export function ExchangeHub() {
    const [activeTab, setActiveTab] = useState<ContractStatus | "all">("all");

    const filteredContracts = activeTab === "all" 
        ? MOCK_CONTRACTS 
        : MOCK_CONTRACTS.filter(c => c.status === activeTab);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                    {["all", "active", "pending", "incoming"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                activeTab === tab 
                                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                                    : "text-label-tertiary hover:text-label-secondary"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            placeholder="Search contracts..." 
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all w-64"
                        />
                    </div>
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <Filter className="w-5 h-5 text-label-secondary" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredContracts.map((contract) => (
                        <motion.div
                            key={contract.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <ContractItem contract={contract} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {/* Marketplace Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Active Nodes", value: "24", icon: Layers, color: "text-blue-400" },
                    { label: "Global Reach", value: "142", icon: Globe, color: "text-indigo-400" },
                    { label: "Market Vol", value: "$12.4k", icon: TrendingUp, color: "text-emerald" },
                    { label: "Verified", value: "98.2%", icon: Shield, color: "text-amber-400" },
                ].map(stat => (
                    <GlassCard key={stat.label} className="p-6 flex items-center gap-4 border-white/5" metal="silver">
                        <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-mono text-white font-bold">{stat.value}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
