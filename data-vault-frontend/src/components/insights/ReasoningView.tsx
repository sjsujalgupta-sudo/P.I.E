"use client";

import { motion } from "framer-motion";
import {
    Search,
    Globe,
    Zap,
    BrainCircuit,
    Terminal,
    HelpCircle,
    Quote
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";

interface ReasoningViewProps {
    insights: any;
}

export function ReasoningView({ insights }: ReasoningViewProps) {
    return (
        <motion.div
            key="reasoning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/5 border border-accent/20 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold text-white">Grok AI Behavioral Synthesis</h3>
                    <p className="text-[11px] text-accent font-bold uppercase tracking-widest">Processing cleared & structured dataset</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Answers Pillar */}
                <div className="space-y-4">
                    <AnswerBlock q="What user searches?" a={insights.reasoning.what} icon={Search} color="purple" />
                    <AnswerBlock q="Where he searches?" a={insights.reasoning.where} icon={Globe} color="blue" />
                    <AnswerBlock q="Why he searches / Motivation?" a={insights.reasoning.why} icon={HelpCircle} color="amber" />
                    <AnswerBlock q="How he searches?" a={insights.reasoning.how} icon={Terminal} color="emerald" />
                    <AnswerBlock q="What can be done for building recommendations?" a={insights.reasoning.recommendations} icon={Zap} color="accent" />
                </div>

                {/* Deep Behavioral Insight Pillar */}
                <div className="space-y-6">
                    <GlassCard className="p-8 h-full flex flex-col justify-between border-accent/10 bg-accent/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Quote className="w-6 h-6 text-accent" />
                                <h4 className="text-[18px] font-bold text-white">Deep Behavioral Insight</h4>
                            </div>
                            <p className="text-[15px] text-label-secondary leading-relaxed font-medium mb-8">
                                {insights.reasoning.deepInsight}
                            </p>
                        </div>
                        <div className="relative z-10 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-[10px] font-black text-accent uppercase tracking-tighter">Model conclusion</span>
                            </div>
                            <p className="text-[12px] text-label-tertiary italic">
                                "This synthesis identifies a high-engagement profile with a specialized technical focus, currently hindered by metadata gaps but ready for niche recommendation engine training."
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}

function AnswerBlock({ q, a, icon: Icon, color }: any) {
    const colorClasses: any = {
        purple: "border-purple-500/50 text-purple-400",
        blue: "border-blue-500/50 text-blue-400",
        amber: "border-amber-500/50 text-amber-400",
        emerald: "border-emerald-500/50 text-emerald-400",
        accent: "border-accent/50 text-accent"
    };
    return (
        <GlassCard className={`p-6 border-l-2 ${colorClasses[color]} bg-white/[0.01]`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" />
                <h4 className="text-[13px] font-black uppercase tracking-widest">{q}</h4>
            </div>
            <p className="text-[14px] text-label-secondary leading-relaxed italic">"{a}"</p>
        </GlassCard>
    );
}
