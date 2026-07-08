"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    Brain, 
    Target, 
    Zap, 
    Activity, 
    Search, 
    Database, 
    ChevronRight,
    Sparkles,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTELLIGENCE_METRICS = [
    { label: "Completeness", value: 94, color: "bg-blue-500" },
    { label: "Recency", value: 88, color: "bg-emerald" },
    { label: "Actionability", value: 76, color: "bg-amber-400" },
    { label: "Consistency", value: 92, color: "bg-indigo-400" },
    { label: "AI Confidence", value: 96, color: "bg-purple-500" },
];

function LiquidProgress({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-label-secondary">{label}</span>
                <span className="text-sm font-mono text-white font-bold">{value}%</span>
            </div>
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn("h-full relative", color)}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
            </div>
        </div>
    );
}

export function DatasetIntelligence() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Score & Reasoning */}
                <GlassCard className="lg:col-span-7 p-10" metal="platinum" shine>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Sparkles className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Intelligence Profile</h3>
                                <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-[0.2em] mt-1">Computed by ML Engine v4.2</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-label-tertiary font-bold">Aggregate Score</p>
                            <p className="text-4xl font-mono text-white font-bold">92.4</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {INTELLIGENCE_METRICS.map(metric => (
                            <LiquidProgress key={metric.label} {...metric} />
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10" />
                        <div className="flex gap-4">
                            <Brain className="w-8 h-8 text-blue-400/50 flex-shrink-0" />
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    AI Reasoning Output
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[8px] text-blue-400 uppercase font-bold tracking-widest">Active Insight</span>
                                </h4>
                                <p className="text-sm text-label-secondary leading-relaxed italic">
                                    "Dataset displays exceptional structural integrity and consistency. Recommendation: Focus on increasing 'Social' category recency to reach Elite status."
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Dataset Specifics */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <GlassCard className="p-8 flex-1" metal="silver">
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            <h4 className="font-bold text-white">Structural Quality</h4>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: "Source Validation", status: "Verified", color: "text-emerald", icon: CheckCircle2 },
                                { label: "Anomaly Detection", status: "Clean", color: "text-emerald", icon: CheckCircle2 },
                                { label: "Redundancy Level", status: "2.4%", color: "text-blue-400", icon: Info },
                                { label: "Entropy Rating", status: "Optimal", color: "text-emerald", icon: Activity },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 group/row">
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-3 h-3 text-label-tertiary group-hover/row:text-blue-400 transition-colors" />
                                        <span className="text-xs text-label-tertiary">{item.label}</span>
                                    </div>
                                    <span className={cn("text-xs font-bold font-mono uppercase", item.color)}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                        
                        <button className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            View Deep Validation Report
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </GlassCard>

                    <div className="grid grid-cols-2 gap-6">
                        <GlassCard className="p-6 border-emerald/10" metal="titanium">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald" />
                                <span className="text-[10px] font-bold text-emerald uppercase tracking-widest">Strengths</span>
                            </div>
                            <p className="text-xs text-white leading-relaxed">High temporal density and cross-platform coherence.</p>
                        </GlassCard>
                        <GlassCard className="p-6 border-amber-400/10" metal="titanium">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Growth</span>
                            </div>
                            <p className="text-xs text-white leading-relaxed">Increase granularity in Finance category nodes.</p>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* AI Confidence Heatmap Mockup */}
            <GlassCard className="p-8" metal="silver">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-400" />
                        <h4 className="font-bold text-white">Confidence Heatmap</h4>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[8px] text-label-tertiary uppercase font-bold">Reliable</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span className="text-[8px] text-label-tertiary uppercase font-bold">Predicted</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-12 gap-2 h-32">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.02, duration: 0.5 }}
                            className={cn(
                                "rounded-full w-full",
                                i % 3 === 0 ? "bg-purple-500/40 h-full" : 
                                i % 5 === 0 ? "bg-blue-500/60 h-3/4 self-center" : 
                                "bg-white/10 h-1/2 self-end"
                            )}
                        />
                    ))}
                </div>
                
                <p className="text-[10px] text-center text-label-tertiary font-bold tracking-widest mt-6">Temporal Confidence Distribution across Dataset Nodes</p>
            </GlassCard>
        </div>
    );
}
