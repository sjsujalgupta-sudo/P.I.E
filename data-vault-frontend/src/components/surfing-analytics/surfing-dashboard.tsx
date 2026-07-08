"use client";

import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ZAxis,
    Treemap,
    Legend,
    RadialBarChart,
    RadialBar,
    ComposedChart,
    Line,
    FunnelChart,
    Funnel
} from "recharts";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SurfingSession } from "@/lib/mock-surfing-data";
import { Clock, Smartphone, LayoutGrid, Activity, Share2, Target } from "lucide-react";

const PALETTE = ["#a78bfa", "#22d3ee", "#34d399", "#60a5fa", "#f472b6", "#f59e0b", "#818cf8", "#fb7185"];

function GlassTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl text-[12px]">
                <p className="font-bold text-label mb-1">{label || payload[0].name}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                        <span className="text-label-secondary">{p.name}:</span>
                        <span className="font-mono text-accent">{p.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

// SECTION A: KPIs
function SummaryKPIs({ data }: { data: SurfingSession[] }) {
    const totalSeconds = data.reduce((sum, s) => sum + s.duration_seconds, 0);
    const targetSeconds = 4 * 3600; // 4 hours
    const progress = Math.min(100, Math.round((totalSeconds / targetSeconds) * 100));
    
    const deviceData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(s => counts[s.device_type] = (counts[s.device_type] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI Gauge */}
            <GlassCard className="flex flex-col items-center justify-center py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-accent" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Screen Time Goal</h3>
                </div>
                <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ value: progress }, { value: 100 - progress }]}
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={180}
                                endAngle={0}
                                dataKey="value"
                            >
                                <Cell fill="#a78bfa" />
                                <Cell fill="rgba(255,255,255,0.05)" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <span className="text-3xl font-bold text-label">{progress}%</span>
                        <span className="text-[10px] text-label-tertiary">of 4h limit</span>
                    </div>
                </div>
            </GlassCard>

            {/* Device Radial (Replacing Doughnut) */}
            <GlassCard className="py-6">
                <div className="flex items-center gap-2 mb-4 px-4">
                    <Smartphone className="w-4 h-4 text-cyan" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Device Spectrum</h3>
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="30%" 
                            outerRadius="100%" 
                            data={deviceData.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }))} 
                            startAngle={180} 
                            endAngle={0}
                        >
                            <RadialBar label={{ fill: '#fff', position: 'insideStart', fontSize: 10 }} background dataKey="value" />
                            <Tooltip content={<GlassTooltip />} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
}

// SECTION B: Trends
function TrendsAnalytics({ data }: { data: SurfingSession[] }) {
    const heatmapData = useMemo(() => {
        const matrix = Array.from({ length: 7 }, (_, day) => 
            Array.from({ length: 24 }, (_, hour) => ({ day, hour, value: 0 }))
        );
        data.forEach(s => {
            const day = s.timestamp.getDay();
            const hour = s.timestamp.getHours();
            matrix[day][hour].value += s.duration_seconds;
        });
        return matrix.flat();
    }, [data]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard className="p-4 overflow-x-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-4 h-4 text-emerald" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Peak Surfing Hours (Heatmap)</h3>
                </div>
                <div className="min-w-[600px] h-[300px] grid grid-cols-[auto_1fr] gap-2">
                    <div className="flex flex-col justify-between py-2 pr-2">
                        {days.map(d => <span key={d} className="text-[10px] text-label-tertiary">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-24 gap-1">
                        {heatmapData.map((cell, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="aspect-square rounded-[4px] hover:scale-125 transition-transform"
                                style={{ 
                                    backgroundColor: `rgba(167, 139, 250, ${Math.min(1, cell.value / 3600)})`,
                                    border: cell.value > 0 ? "1px solid rgba(167, 139, 250, 0.2)" : "none"
                                }}
                                title={`${days[cell.day]} ${cell.hour}:00 - ${Math.round(cell.value / 60)} mins`}
                            />
                        ))}
                    </div>
                    <div className="col-start-2 flex justify-between px-1">
                        {[0, 6, 12, 18, 23].map(h => <span key={h} className="text-[9px] text-label-tertiary">{h}h</span>)}
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-pink" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Category Flow (Stream Graph)</h3>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={heatmapData.slice(0, 24)}> {/* Simulating time trend for demo */}
                            <defs>
                                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: "var(--color-label-tertiary)", fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: "var(--color-label-tertiary)", fontSize: 10}} />
                            <Tooltip content={<GlassTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#colorWork)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
}

// SECTION C: Hierarchies
function HierarchyAnalytics({ data }: { data: SurfingSession[] }) {
    const treemapData = useMemo(() => {
        const categories: Record<string, { name: string; children: any[] }> = {};
        data.forEach(s => {
            if (!categories[s.category]) categories[s.category] = { name: s.category, children: [] };
            const existing = categories[s.category].children.find(c => c.name === s.domain);
            if (existing) existing.size += s.duration_seconds;
            else categories[s.category].children.push({ name: s.domain, size: s.duration_seconds });
        });
        return Object.values(categories);
    }, [data]);

    const topDomains = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(s => counts[s.domain] = (counts[s.domain] || 0) + 1);
        return Object.entries(counts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [data]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-6">
                    <LayoutGrid className="w-4 h-4 text-orange" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Category & Domain Treemap</h3>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={treemapData}
                            dataKey="size"
                            stroke="#fff"
                            fill="#8884d8"
                            isAnimationActive
                        >
                            <Tooltip content={<GlassTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-accent" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Top 10 Most Visited Domains</h3>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topDomains} layout="vertical" margin={{ left: 30, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{fill: "var(--color-label-secondary)", fontSize: 11}} width={100} />
                            <Tooltip content={<GlassTooltip />} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#a78bfa" fillOpacity={0.8}>
                                {topDomains.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
}

// SECTION D: Flow Simulation (Using customized Bar as a Sankey alternative since Sankey is heavy)
function FlowAnalytics({ data }: { data: SurfingSession[] }) {
    return (
        <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <Share2 className="w-4 h-4 text-accent" />
                <h3 className="text-caption font-semibold uppercase tracking-wider">User Journey Flow (Referrer → Category → Domain)</h3>
            </div>
            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between px-10">
                    <span className="text-[11px] font-bold text-label-secondary uppercase">Referrer</span>
                    <span className="text-[11px] font-bold text-label-secondary uppercase">Category</span>
                    <span className="text-[11px] font-bold text-label-secondary uppercase">Domain</span>
                </div>
                <div className="h-[200px] relative">
                    {/* Simulated Flow lines using SVG */}
                    <svg className="absolute inset-0 w-full h-full">
                        {[1, 2, 3].map(i => (
                            <motion.path
                                key={i}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                d={`M 100 ${20 + i * 40} L 400 ${50 + i * 30} L 800 ${20 + i * 50}`}
                                stroke="rgba(167, 139, 250, 0.2)"
                                strokeWidth="20"
                                fill="none"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-between px-10">
                        <div className="flex flex-col gap-4">
                            {["Google", "Direct", "Social"].map(s => <div key={s} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px]">{s}</div>)}
                        </div>
                        <div className="flex flex-col gap-4">
                            {["Work", "Entertainment", "News"].map(s => <div key={s} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px]">{s}</div>)}
                        </div>
                        <div className="flex flex-col gap-4">
                            {["github.com", "youtube.com", "nyt.com"].map(s => <div key={s} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px]">{s}</div>)}
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

// SECTION E: Correlations
function CorrelationsAnalytics({ data }: { data: SurfingSession[] }) {
    const scatterData = data.slice(0, 100).map(s => ({
        duration: s.duration_seconds,
        bandwidth: s.data_transferred_mb,
        category: s.category,
        domain: s.domain
    }));

    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-cyan" />
                <h3 className="text-caption font-semibold uppercase tracking-wider">Session Correlation (Scatter)</h3>
            </div>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" dataKey="duration" name="Duration" unit="s" axisLine={false} tick={{fill: "var(--color-label-tertiary)", fontSize: 10}} />
                        <YAxis type="number" dataKey="bandwidth" name="Bandwidth" unit="MB" axisLine={false} tick={{fill: "var(--color-label-tertiary)", fontSize: 10}} />
                        <ZAxis type="category" dataKey="category" name="Category" />
                        <Tooltip content={<GlassTooltip />} />
                        <Scatter name="Sessions" data={scatterData} fill="#8884d8">
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PALETTE[Math.abs(entry.category.length) % PALETTE.length]} />
                            ))}
                        </Scatter>
                        <Legend />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}

// SECTION F: Novel Additions (Lollipop & Composed)
function AdditionalAnalytics({ data }: { data: SurfingSession[] }) {
    const lollipopData = useMemo(() => {
        const cats: Record<string, number> = {};
        data.forEach(s => cats[s.category] = (cats[s.category] || 0) + 1);
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [data]);

    const composedData = data.slice(0, 10).map((s, i) => ({
        index: i,
        duration: s.duration_seconds / 10,
        bandwidth: s.data_transferred_mb
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-pink" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Category Depth (Funnel Chart)</h3>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip content={<GlassTooltip />} />
                            <Funnel
                                dataKey="value"
                                data={lollipopData.sort((a, b) => b.value - a.value)}
                                isAnimationActive
                            >
                                {lollipopData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} fillOpacity={0.8} />
                                ))}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-cyan" />
                    <h3 className="text-caption font-semibold uppercase tracking-wider">Volume vs. Effort (Composed Line+Area)</h3>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={composedData}>
                            <XAxis dataKey="index" hide />
                            <YAxis tick={{fill: "var(--color-label-tertiary)", fontSize: 10}} />
                            <Tooltip content={<GlassTooltip />} />
                            <Area type="monotone" dataKey="duration" fill="#22d3ee" stroke="#22d3ee" fillOpacity={0.2} />
                            <Line type="monotone" dataKey="bandwidth" stroke="#a78bfa" strokeWidth={3} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
}

export default function SurfingDashboard({ sessions }: { sessions: SurfingSession[] }) {
    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-1">
                <h1 className="text-headline font-bold">Surfing History Analytics</h1>
                <p className="text-body text-label-secondary">Deep analysis of your digital footprints and browsing habits.</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                <SummaryKPIs data={sessions} />
                <TrendsAnalytics data={sessions} />
                <HierarchyAnalytics data={sessions} />
                <FlowAnalytics data={sessions} />
                <CorrelationsAnalytics data={sessions} />
                <AdditionalAnalytics data={sessions} />
            </div>
        </div>
    );
}
