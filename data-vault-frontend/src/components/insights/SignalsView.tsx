"use client";

import { motion } from "framer-motion";
import { 
    Target, 
    Clock, 
    Layers, 
    Cpu
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";

import { GlassCard } from "@/components/ui/glass-card";

const PALETTE = ["#a78bfa", "#22d3ee", "#34d399", "#f59e0b", "#f472b6", "#60a5fa"];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item: any = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function GlassTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-3 rounded-xl shadow-2xl">
                <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} className="text-[12px] font-bold" style={{ color: p.color || p.fill }}>
                        {p.name}: {p.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

interface SignalsViewProps {
    insights: any;
}

export function SignalsView({ insights }: SignalsViewProps) {
    return (
        <motion.div 
            key="signals" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="space-y-12"
        >
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.components.map((comp: any) => (
                    <motion.div key={comp.name} variants={item}>
                        <GlassCard className="p-5 border-white/[0.04] bg-white/[0.01]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                                    <comp.icon className="w-4 h-4" style={{ color: comp.color }} />
                                </div>
                            </div>
                            <h3 className="text-[13px] font-bold text-label-secondary mb-1">{comp.name}</h3>
                            <span className="text-2xl font-bold text-white">{comp.score.toFixed(0)}</span>
                        </GlassCard>
                    </motion.div>
                ))}
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <GlassCard className="lg:col-span-8 p-6">
                    <h3 className="text-lg font-bold text-label mb-8">Temporal Signal Density</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={insights.charts.hourlyData}>
                                <defs>
                                    <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} interval={2} />
                                <YAxis hide />
                                <Tooltip content={<GlassTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={3} fill="url(#hourGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
                
                <GlassCard className="lg:col-span-4 p-6">
                    <h3 className="text-lg font-bold text-label mb-8">Weekly Distribution</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={insights.charts.weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                                <YAxis hide />
                                <Tooltip content={<GlassTooltip />} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={24}>
                                    {insights.charts.weeklyData.map((_: any, index: number) => (
                                        <Cell key={index} fill={PALETTE[index % PALETTE.length]} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );
}
