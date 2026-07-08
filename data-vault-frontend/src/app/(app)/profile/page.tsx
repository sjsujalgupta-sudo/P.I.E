/*
 * 🎭 Analogy: This file is the "ID Card" — it shows the user's
 *   anonymized data profile: their top interests, most visited
 *   domains, and a radar chart of their browsing personality.
 * ✅ Safe to change:
 *    1. The profile card layout and section order
 *    2. The radar chart axis labels
 *    3. The "Export Profile" button styling
 * ❌ Never touch: The default export function name — Next.js
 *   requires it to match the file's route. Renaming breaks routing.
 */

"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Eye, BarChart3, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { ApiError, fetchAnalytics, fetchAnalyticsRaw, type AnalyticsItem, type AnalyticsResponse } from "@/lib/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function ProfilePage() {
    const [interests, setInterests] = useState<AnalyticsItem[]>([]);
    const [topics, setTopics] = useState<AnalyticsItem[]>([]);
    const [rawAnalytics, setRawAnalytics] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            setLoading(true);
            setError(null);
            try {
                const [viewData, rawData] = await Promise.all([fetchAnalytics(), fetchAnalyticsRaw()]);
                if (!mounted) return;
                setInterests(viewData.interests);
                setTopics(viewData.topics);
                setRawAnalytics(rawData);
            } catch (err) {
                if (!mounted) return;
                const message =
                    err instanceof ApiError && err.offline
                        ? "Server offline"
                        : "Failed to load profile analytics";
                setError(message);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadProfile();
        return () => { mounted = false; };
    }, []);

    const totalInterestSignals = interests.reduce((sum, i) => sum + i.count, 0);
    const totalTopicSignals = topics.reduce((sum, t) => sum + t.count, 0);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="w-full h-full overflow-y-auto px-4 py-6 md:px-8 lg:px-10 space-y-6 relative z-10">
            {/* Profile Header — rose personal identity */}
            <div className="relative overflow-hidden rounded-[18px] border border-rose-400/10 page-hero-card p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[18px] bg-rose-400/15 flex items-center justify-center border border-rose-400/20 flex-shrink-0">
                        <User className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-headline">Your Profile</h1>
                        <p className="text-body mt-1">Aggregated interest profile across all your sessions.</p>
                        <div className="flex items-center gap-4 mt-3">
                            <div className="px-3 py-1.5 rounded-full bg-rose-400/15 border border-rose-400/20 text-rose-400 text-[12px] font-semibold">
                                {interests.length} Interests
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-cyan-dim border border-cyan/15 text-cyan text-[12px] font-semibold">
                                {topics.length} Topics
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <GlassCard className="border border-danger/20 bg-danger/5">
                    <p className="text-body text-danger flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </p>
                </GlassCard>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-rose-400/15 flex items-center justify-center border border-rose-400/20">
                        <BarChart3 className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-[22px] font-semibold text-label tracking-tight">{totalInterestSignals.toLocaleString()}</p>
                        <p className="text-caption">Total Interest Signals</p>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-cyan-dim flex items-center justify-center border border-cyan/15">
                        <User className="w-5 h-5 text-cyan" />
                    </div>
                    <div>
                        <p className="text-[22px] font-semibold text-label tracking-tight">{totalTopicSignals.toLocaleString()}</p>
                        <p className="text-caption">Total Topic Signals</p>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div variants={item}>
                    <GlassCard className="h-full">
                        <h2 className="text-title flex items-center gap-2.5 mb-4">
                            <div className="icon-container bg-rose-400/15 text-rose-400 border border-rose-400/20">
                                <BarChart3 className="w-[14px] h-[14px]" />
                            </div>
                            Top Interests
                        </h2>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="skeleton h-5 rounded-lg" style={{ width: `${100 - i * 12}%` }} />
                                ))}
                            </div>
                        ) : interests.length === 0 ? (
                            <p className="text-body text-center py-8">No interest data available.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={interests.slice(0, 10)} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="name" tick={{ fill: "#6c6c70", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} dy={10} />
                                    <YAxis tick={{ fill: "#6c6c70", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "rgba(28, 28, 30, 0.95)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "12px",
                                            color: "#fff",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {interests.slice(0, 10).map((_, i) => (
                                            <Cell key={`interest-${i}`} fill={i % 2 === 0 ? "#fb7185" : "#22d3ee"} fillOpacity={0.65} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                    <GlassCard className="h-full">
                        <h2 className="text-title flex items-center gap-2.5 mb-4">
                            <div className="icon-container icon-container-cyan">
                                <User className="w-[14px] h-[14px]" />
                            </div>
                            Top Topics
                        </h2>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="skeleton h-5 rounded-lg" />
                                ))}
                            </div>
                        ) : topics.length === 0 ? (
                            <p className="text-body text-center py-8">No topic data available.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {topics.map((topic, i) => (
                                    <span
                                        key={topic.name}
                                        className={`rounded-full border font-medium text-[13px] px-3 py-[5px] ${
                                            i % 3 === 0
                                                ? "bg-rose-400/15 text-rose-400 border-rose-400/15"
                                                : i % 3 === 1
                                                    ? "bg-cyan-dim text-cyan border-cyan/15"
                                                    : "bg-white/[0.04] text-label-secondary border-separator"
                                        }`}
                                    >
                                        {topic.name} ({topic.count})
                                    </span>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </div>

            <motion.div variants={item}>
                <GlassCard>
                    <h2 className="text-title flex items-center gap-2.5 mb-3">
                        <div className="icon-container bg-rose-400/15 text-rose-400 border border-rose-400/20">
                            <Eye className="w-[14px] h-[14px]" />
                        </div>
                        This is What Companies See
                    </h2>
                    <p className="text-body mb-4">Aggregated analytics JSON from the backend.</p>
                    <div className="bg-elevated rounded-[14px] p-4 overflow-x-auto border border-separator">
                        <pre className="text-[11px] text-cyan font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(rawAnalytics ?? {}, null, 2)}
                        </pre>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
