"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    AlertTriangle, 
    ShieldAlert, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Search,
    Scale,
    Brain,
    Info,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_DISPUTES = [
    {
        id: "DSP-102",
        contract: "Consumer Patterns v2",
        party: "Quantum Analytics",
        status: "under_review",
        type: "Data Staleness",
        timestamp: "2026-05-09 14:20",
        evidenceDepth: 85,
        aiPrediction: "Likely Valid"
    },
    {
        id: "DSP-098",
        contract: "Retail Intent Feed",
        party: "Nexus Retail",
        status: "resolved",
        type: "Payment Delay",
        timestamp: "2026-05-04 11:10",
        evidenceDepth: 100,
        aiPrediction: "Resolved"
    }
];

export function DisputeCenter() {
    const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Dispute Overview & Filing */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-8 border-amber-400/10" metal="titanium">
                        <div className="flex items-center gap-3 mb-6">
                            <Scale className="w-6 h-6 text-amber-400" />
                            <h4 className="font-bold text-white text-lg">Smart Resolution</h4>
                        </div>
                        <p className="text-sm text-label-tertiary leading-relaxed mb-8">
                            Disputes reduce <span className="text-white font-bold">Confidence Score</span> first. Trust impact only occurs after verified evidence validation.
                        </p>
                        
                        <div className="space-y-4">
                            <button className="w-full py-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold text-sm hover:bg-amber-400/20 transition-all flex items-center justify-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                File New Dispute
                            </button>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                                <Info className="w-4 h-4 text-blue-400/50" />
                                <p className="text-[10px] text-label-tertiary font-medium">AI assists in evidence matching and anomaly detection.</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8" metal="silver">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h4 className="font-bold text-white">Impact Preview</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-label-secondary">Potential Trust Loss</span>
                                <span className="text-sm font-mono text-red-400 font-bold">-4.2</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-label-secondary">Confidence Volatility</span>
                                <span className="text-sm font-mono text-amber-400 font-bold">+12%</span>
                            </div>
                            <div className="h-px bg-white/5 w-full" />
                            <p className="text-[10px] text-label-tertiary leading-relaxed italic">
                                "Impact is currently theoretical. System maintains neutral bias until 3rd party verification."
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Active Dispute Ledger */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-blue-400" />
                            <h3 className="text-xl font-bold text-white">Dispute Ledger</h3>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-label-tertiary" />
                            <input 
                                placeholder="Search IDs..." 
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white w-48 focus:outline-none focus:border-blue-500/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {MOCK_DISPUTES.map((dsp) => (
                            <GlassCard 
                                key={dsp.id} 
                                className={cn(
                                    "p-6 cursor-pointer group transition-all",
                                    selectedDispute === dsp.id ? "border-blue-500/40 bg-blue-500/[0.03]" : "border-white/5 hover:border-white/10"
                                )}
                                onClick={() => setSelectedDispute(dsp.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                            dsp.status === "under_review" ? "bg-amber-400/10 border-amber-400/20" : "bg-emerald/10 border-emerald/20"
                                        )}>
                                            {dsp.status === "under_review" ? <AlertTriangle className="w-6 h-6 text-amber-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-white">{dsp.type}</h4>
                                                <span className={cn(
                                                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                    dsp.status === "under_review" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" : "bg-emerald/10 text-emerald border-emerald/20"
                                                )}>
                                                    {dsp.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-label-tertiary mt-1">
                                                {dsp.contract} • <span className="text-white/70">{dsp.party}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-widest">AI Verdict</p>
                                            <p className={cn(
                                                "text-xs font-bold mt-1",
                                                dsp.aiPrediction.includes("Likely") ? "text-amber-400" : "text-emerald"
                                            )}>{dsp.aiPrediction}</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10 hidden md:block" />
                                        <div className="text-right">
                                            <p className="text-[10px] text-label-tertiary font-mono">{dsp.timestamp}</p>
                                            <p className="text-[10px] text-blue-400/50 font-mono mt-0.5">{dsp.id}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-label-tertiary group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {selectedDispute === dsp.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest flex items-center gap-2">
                                                        <FileText className="w-3 h-3" />
                                                        Evidence Log
                                                    </p>
                                                    <div className="space-y-2">
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] text-label-secondary font-mono">
                                                            [2026-05-09 14:22] Anomaly detected in data stream entropy.
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] text-label-secondary font-mono">
                                                            [2026-05-09 14:25] Batch comparison with ground truth failed.
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Resolution Progress</p>
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 w-[65%]" />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold text-label-tertiary uppercase tracking-widest">
                                                        <span>Processing</span>
                                                        <span className="text-white">65% Complete</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
