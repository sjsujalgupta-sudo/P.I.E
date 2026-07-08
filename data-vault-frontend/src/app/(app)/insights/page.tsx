"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { 
    BarChart3, 
    ShieldCheck, 
    Clock, 
    Target, 
    Layers, 
    Cpu,
    BrainCircuit,
    Activity
} from "lucide-react";

import { fetchVaultData, type VaultRow } from "@/lib/api";
import { SignalsView } from "@/components/insights/SignalsView";
import { ReasoningView } from "@/components/insights/ReasoningView";

const calculateInsights = (rows: VaultRow[]) => {
    if (rows.length === 0) return null;

    const total = rows.length;
    
    // Core Metrics
    const hasKeywords = rows.filter(r => r.keywords && r.keywords.length > 0).length;
    const completenessScore = (hasKeywords/total) * 100;

    const now = new Date();
    const recentRows = rows.filter(r => {
        const date = new Date(r.timestamp || r.created_at);
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
    }).length;
    const recencyScore = (recentRows / total) * 100;

    const uniqueDomains = new Set(rows.map(r => r.domain)).size;
    const relevanceScore = Math.min((uniqueDomains / 15) * 100, 100);

    const actionableRows = rows.filter(r => (r.keywords?.length || 0) + (r.topics?.length || 0) > 2).length;
    const actionabilityScore = (actionableRows / total) * 100;

    const finalScore = (relevanceScore * 0.4 + recencyScore * 0.25 + completenessScore * 0.15 + actionabilityScore * 0.1 + 10);

    // Top Categories
    const getTopN = (arr: string[], n = 8) => {
        const counts: Record<string, number> = {};
        arr.forEach(item => { if(item) counts[item] = (counts[item] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, n);
    };

    const topKeywords = getTopN(rows.flatMap(r => r.keywords || []));
    const topTopics = getTopN(rows.flatMap(r => r.topics || []));
    const topDomains = getTopN(rows.map(r => r.domain));

    // Time distribution
    const hourCounts = new Array(24).fill(0);
    rows.forEach(r => {
        const hour = new Date(r.timestamp || r.created_at).getHours();
        hourCounts[hour]++;
    });
    const hourlyData = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = new Array(7).fill(0);
    rows.forEach(r => {
        const day = new Date(r.timestamp || r.created_at).getDay();
        dayCounts[day]++;
    });
    const weeklyData = dayCounts.map((count, idx) => ({ day: dayNames[idx], count }));

    const reasoning = {
        what: `The user is searching for specific technical content. Keywords: ${topKeywords.slice(0, 5).map(k => k.name).join(", ")}.`,
        where: `The activity is concentrated on domains like ${topDomains.slice(0, 3).map(d => d.name).join(", ")}.`,
        why: `Motivation: The topics '${topTopics.slice(0, 3).map(t => t.name).join(", ")}' suggest a strong learning and development focus in AI and Software Engineering.`,
        how: `The user utilizes ${uniqueDomains > 10 ? "broad-spectrum exploration" : "targeted domain-specific search"} patterns, ${hourCounts.slice(20).reduce((a,b)=>a+b,0) > 5 ? "often during intensive late-night sessions" : "during standard active hours"}.`,
        recommendations: "1. Massive Data Acquisition: Expand interactions by orders of magnitude. 2. Improve Data Completeness: Stricter metadata population. 3. Diversity: Collect from broader content types. 4. Feature Engineering: Extract entities and sentiment.",
        deepInsight: `The dataset provides valuable foundational insights into the types of information useful for a recommendation engine, particularly the explicit interest and topic data. While core signals like domain and title are complete, the practical value for building a deployable ML model is currently limited by the small scale (${total} rows) and missing metadata (${(100-completenessScore).toFixed(1)}% incomplete keywords). The strong focus on ${topKeywords[0]?.name || "technical"} related topics makes it an excellent starting point for a niche behavioral engine, but it requires a broader acquisition strategy to reach market-ready sellability. The temporal density indicates highly engaged sessions, providing a strong anchor for personalized content delivery if the diversity of source domains is increased beyond the current ${uniqueDomains} nodes.`
    };

    return {
        score: finalScore,
        components: [
            { name: "Relevance", score: relevanceScore, icon: Target, color: "#a78bfa" },
            { name: "Recency", score: recencyScore, icon: Clock, color: "#22d3ee" },
            { name: "Completeness", score: completenessScore, icon: Layers, color: "#34d399" },
            { name: "Actionability", score: actionabilityScore, icon: Cpu, color: "#f59e0b" },
        ],
        charts: { hourlyData, weeklyData },
        stats: { total, uniqueDomains },
        reasoning
    };
};

function InsightsPageInner() {
    const [data, setData] = useState<VaultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<"signals" | "reasoning">("signals");
    const searchParams = useSearchParams();

    // Sync mode with URL search params (For Dynamic Island Nav)
    useEffect(() => {
        const m = searchParams.get("mode");
        if (m === "signals" || m === "reasoning") {
            setMode(m);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchVaultData().then(res => { setData(res); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const insights = useMemo(() => calculateInsights(data), [data]);

    if (loading) return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-[12px] font-bold text-label-tertiary uppercase tracking-widest">Synthesizing Signals...</p>
            </div>
        </div>
    );

    if (!insights) return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black">
            <div className="w-20 h-20 rounded-[24px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-8">
                <BarChart3 className="w-10 h-10 text-label-tertiary opacity-20" />
            </div>
            <h2 className="text-2xl font-bold text-label tracking-tight mb-3">No Signals Found</h2>
            <p className="text-label-secondary text-[15px] max-w-md">Start browsing to collect data and generate valuation insights.</p>
        </div>
    );

    return (
        <div className="w-full h-full overflow-y-auto bg-[var(--color-background)]">
            <div className="py-8 px-6 md:px-12 max-w-[1400px] mx-auto space-y-12 pb-20">
                
                {/* ─── Header ────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                                <BrainCircuit className="w-3 h-3" />
                                Insights ML Fork
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-label tracking-tighter">Insights Engine</h1>
                        <p className="text-label-tertiary text-sm mt-1 max-w-lg">
                            User data is structured by our ML model and forked into visual signals or deep AI reasoning.
                        </p>
                    </div>

                    <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                        <button onClick={() => setMode("signals")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-black transition-all ${mode === "signals" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-label-tertiary hover:text-label hover:bg-white/5"}`}><Activity className="w-3.5 h-3.5" /> SIGNALS</button>
                        <button onClick={() => setMode("reasoning")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-black transition-all ${mode === "reasoning" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-label-tertiary hover:text-label hover:bg-white/5"}`}><BrainCircuit className="w-3.5 h-3.5" /> REASONING</button>
                    </div>
                </div>

                {/* ─── Global Score ───────────────────────────────────────────── */}
                <div className="flex items-center gap-8 bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-xl">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-label-tertiary uppercase tracking-widest mb-1">Valuation Score</p>
                        <div className="text-5xl font-black text-white tracking-tighter">{insights.score.toFixed(1)}<span className="text-lg text-label-tertiary font-medium ml-1">/100</span></div>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-[13px] font-bold text-label">ML Structured Data</span>
                        </div>
                        <p className="text-[11px] text-label-tertiary font-medium">Model processing {insights.stats.total} raw signals</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {mode === "signals" ? (
                        <SignalsView key="signals" insights={insights} />
                    ) : (
                        <ReasoningView key="reasoning" insights={insights} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function InsightsPage() {
    return (
        <Suspense fallback={null}>
            <InsightsPageInner />
        </Suspense>
    );
}
