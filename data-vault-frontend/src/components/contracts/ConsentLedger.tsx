"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    Fingerprint, 
    Link2, 
    Eye, 
    EyeOff, 
    RotateCcw, 
    ShieldCheck, 
    History, 
    ArrowRight,
    UserCheck,
    Key,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONSENT_EVENTS = [
    {
        id: "ev-01",
        event: "Permission Granted",
        entity: "Quantum Analytics",
        scope: "Browsing History",
        timestamp: "2026-05-10 09:24",
        status: "success",
        hash: "0x4f2...9a1"
    },
    {
        id: "ev-02",
        event: "Data Access",
        entity: "Nexus Retail",
        scope: "Purchase Intent",
        timestamp: "2026-05-10 08:12",
        status: "active",
        hash: "0x7b1...2c4"
    },
    {
        id: "ev-03",
        event: "Permission Revoked",
        entity: "Unknown Provider",
        scope: "Location Data",
        timestamp: "2026-05-09 22:45",
        status: "revoked",
        hash: "0x1d5...8e0"
    },
    {
        id: "ev-04",
        event: "Access Expired",
        entity: "Legacy Data Corp",
        scope: "Full Access",
        timestamp: "2026-05-08 14:00",
        status: "expired",
        hash: "0x9f0...3b2"
    }
];

function LedgerNode({ event, isLast }: { event: typeof CONSENT_EVENTS[0], isLast: boolean }) {
    return (
        <div className="relative pl-12 pb-12 group">
            {/* Connection Line */}
            {!isLast && (
                <div className="absolute left-[23px] top-10 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-transparent group-hover:from-blue-500 transition-colors" />
            )}
            
            {/* Node Indicator */}
            <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center">
                <div className={cn(
                    "w-3 h-3 rounded-full relative z-10",
                    event.status === "success" ? "bg-emerald" :
                    event.status === "active" ? "bg-blue-400" :
                    event.status === "revoked" ? "bg-red-500" : "bg-label-tertiary"
                )}>
                    <div className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-20",
                        event.status === "success" ? "bg-emerald" :
                        event.status === "active" ? "bg-blue-400" :
                        event.status === "revoked" ? "bg-red-500" : "bg-label-tertiary"
                    )} />
                </div>
                <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10 scale-100 group-hover:scale-125 transition-transform" />
            </div>

            <GlassCard className="p-6 relative overflow-hidden" metal="silver" hover>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-white">{event.event}</p>
                            <span className={cn(
                                "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                event.status === "success" ? "bg-emerald/10 text-emerald border-emerald/20" :
                                event.status === "active" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" :
                                event.status === "revoked" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                                "bg-white/10 text-label-tertiary border-white/20"
                            )}>
                                {event.status}
                            </span>
                        </div>
                        <p className="text-xs text-label-secondary font-medium">
                            <span className="text-white font-bold">{event.entity}</span> accessed <span className="text-white/70 italic">{event.scope}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-label-tertiary font-mono">{event.timestamp}</p>
                            <p className="text-[10px] text-blue-400/50 font-mono mt-0.5">{event.hash}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-label-secondary">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {event.status === "active" && (
                                <button className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-red-400">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

export function ConsentLedger() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Statistics Overview */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-8" metal="platinum">
                        <div className="flex items-center gap-3 mb-8">
                            <Fingerprint className="w-6 h-6 text-blue-400" />
                            <h4 className="font-bold text-white text-lg">Trust Nodes</h4>
                        </div>
                        <div className="space-y-8">
                            {[
                                { label: "Active Accessors", value: "12", icon: UserCheck, color: "text-blue-400" },
                                { label: "Revoked Keys", value: "4", icon: RotateCcw, color: "text-red-400" },
                                { label: "Total Handshakes", value: "1,248", icon: Link2, color: "text-emerald" },
                            ].map(stat => (
                                <div key={stat.label} className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10", stat.color)}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">{stat.label}</p>
                                        <p className="text-2xl font-mono text-white font-bold">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest mb-2">Policy Status</p>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald" />
                                <span className="text-sm text-white font-medium">Auto-Revocation Enabled</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 relative overflow-hidden" variant="liquid">
                        <div className="flex items-center gap-3 mb-4">
                            <Key className="w-5 h-5 text-amber-400" />
                            <h4 className="font-bold text-white">Trust Portability</h4>
                        </div>
                        <p className="text-xs text-label-tertiary leading-relaxed mb-6">
                            This ledger is owned by you. Export your reputation as a W3C Verifiable Credential for cross-platform trust portability.
                        </p>
                        <div className="space-y-3">
                            <button className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                                <ExternalLink className="w-3 h-3" />
                                Export Trust Passport
                            </button>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-[9px] text-white/40 break-all leading-tight">
                                did:pdt:0x4f2...9a1-v0.1
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Timeline */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-blue-400" />
                            <h3 className="text-xl font-bold text-white">Permission History</h3>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" />
                                Show All
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        {CONSENT_EVENTS.map((event, i) => (
                            <LedgerNode 
                                key={event.id} 
                                event={event} 
                                isLast={i === CONSENT_EVENTS.length - 1} 
                            />
                        ))}
                    </div>

                    <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-label-tertiary hover:text-white transition-all flex items-center justify-center gap-3 group">
                        Load Historical Archive
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
