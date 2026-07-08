"use client";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    Shield, 
    TrendingUp, 
    Brain, 
    Target, 
    RefreshCcw, 
    ShieldCheck, 
    Zap, 
    Activity,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Fingerprint,
    Database
} from "lucide-react";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    Radar 
} from "recharts";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const TRUST_TIMELINE = [
    { date: "Jan", score: 72 },
    { date: "Feb", score: 75 },
    { date: "Mar", score: 74 },
    { date: "Apr", score: 82 },
    { date: "May", score: 88 },
];

const SELLER_METRICS = [
    { subject: 'Reliability', A: 90, fullMark: 100 },
    { subject: 'Freshness', A: 85, fullMark: 100 },
    { subject: 'Fulfillment', A: 95, fullMark: 100 },
    { subject: 'Consistency', A: 70, fullMark: 100 },
    { subject: 'Authenticity', A: 98, fullMark: 100 },
    { subject: 'Privacy', A: 92, fullMark: 100 },
];

const BUYER_METRICS = [
    { subject: 'Payment', A: 95, fullMark: 100 },
    { subject: 'Compliance', A: 88, fullMark: 100 },
    { subject: 'Respect', A: 92, fullMark: 100 },
    { subject: 'Integrity', A: 85, fullMark: 100 },
    { subject: 'Stability', A: 90, fullMark: 100 },
    { subject: 'Usage', A: 80, fullMark: 100 },
];

// --- Sub-components ---

// --- Types ---

interface TrustLayer {
    id: string;
    label: string;
    score: number;
    description: string;
    icon: any;
    color: string;
}

const TRUST_LAYERS: TrustLayer[] = [
    { 
        id: "behavioral", 
        label: "Behavioral Reliability", 
        score: 92, 
        description: "Measures operational consistency, response time, and fulfillment rates.",
        icon: Activity,
        color: "text-blue-400"
    },
    { 
        id: "integrity", 
        label: "Data Integrity", 
        score: 88, 
        description: "ML-verified dataset completeness, recency, and source validation.",
        icon: Database,
        color: "text-emerald"
    },
    { 
        id: "transactional", 
        label: "Transaction Credibility", 
        score: 85, 
        description: "Successful exchanges, payment reliability, and compliance history.",
        icon: Zap,
        color: "text-amber-400"
    }
];

function RadialTrustScore({ score, confidence }: { score: number, confidence: number }) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-white/5"
                />
                <motion.circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    strokeLinecap="round"
                />
                {/* Confidence Ring */}
                <circle
                    cx="128"
                    cy="128"
                    r={radius - 16}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${(confidence / 100) * (2 * Math.PI * (radius - 16))} 1000`}
                    className="text-white/20"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl font-bold text-white font-mono"
                >
                    {score}
                </motion.span>
                <div className="flex flex-col items-center gap-1 mt-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-label-tertiary font-bold">Trust Index</span>
                    <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-label-tertiary uppercase tracking-tighter">
                        Confidence: {confidence}%
                    </div>
                </div>
            </div>
            
            {/* Liquid Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full -z-10 animate-pulse" />
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: "up" | "down" }) {
    return (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-blue-400" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                        trend === "up" ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-400"
                    )}>
                        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend === "up" ? "+2.4%" : "-1.2%"}
                    </div>
                )}
            </div>
            <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-wider">{label}</p>
            <p className="text-xl font-mono text-white font-bold mt-0.5">{value}</p>
        </div>
    );
}

export function TrustCenter() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Trust Overview */}
                <GlassCard className="lg:col-span-5 flex flex-col items-center justify-center p-12 relative overflow-hidden" metal="platinum" shine>
                    <div className="absolute top-0 right-0 p-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <ShieldCheck className="w-4 h-4" />
                            Verified Exchange Partner
                        </div>
                    </div>
                    
                    <RadialTrustScore score={88} confidence={94} />
                    
                    <div className="mt-8 text-center space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-white tracking-tight">Trusted Entity</h3>
                            <p className="text-sm text-label-tertiary max-w-[280px] mx-auto leading-relaxed">
                                High evidence depth from 1,240+ verified exchanges across Health & Finance domains.
                            </p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <div className="text-center">
                                <p className="text-[10px] uppercase text-label-tertiary font-bold">Trend</p>
                                <div className="flex items-center gap-1 text-emerald">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="text-lg font-mono font-bold">+2.4</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[10px] uppercase text-label-tertiary font-bold">Volatility</p>
                                <div className="flex items-center gap-1 text-blue-400">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-lg font-mono font-bold">Low</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-10" />

                    <div className="w-full space-y-6">
                        <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest mb-4">Architectural Layers</p>
                        {TRUST_LAYERS.map(layer => (
                            <div key={layer.id} className="space-y-2 group cursor-pointer">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-all", layer.color)}>
                                            <layer.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-white/90">{layer.label}</span>
                                    </div>
                                    <span className="text-sm font-mono font-bold text-white">{layer.score}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${layer.score}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className={cn("h-full relative", layer.color.replace("text-", "bg-"))}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Seller & Buyer Intelligence */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GlassCard className="p-8" metal="titanium">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <h4 className="font-bold text-white">Seller Metrics</h4>
                            </div>
                            <Info className="w-4 h-4 text-label-tertiary cursor-help" />
                        </div>
                        
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SELLER_METRICS}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                                    <Radar
                                        name="Seller"
                                        dataKey="A"
                                        stroke="#fbbf24"
                                        fill="#fbbf24"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <MetricCard label="Fulfillment" value="95%" icon={CheckCircle2} trend="up" />
                            <MetricCard label="Authenticity" value="98%" icon={Fingerprint} />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8" metal="titanium">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-white">Buyer Metrics</h4>
                            </div>
                            <Info className="w-4 h-4 text-label-tertiary cursor-help" />
                        </div>
                        
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={BUYER_METRICS}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                                    <Radar
                                        name="Buyer"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        fill="#6366f1"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <MetricCard label="Payment" value="95%" icon={DollarSign} trend="up" />
                            <MetricCard label="Compliance" value="88%" icon={Shield} />
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Trust Timeline & AI Reasoning */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <GlassCard className="lg:col-span-8 p-8" metal="silver">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <h4 className="font-bold text-white">Trust Evolution</h4>
                        </div>
                        <div className="flex gap-2">
                            {["3M", "6M", "1Y", "ALL"].map(t => (
                                <button key={t} className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                    t === "6M" ? "bg-white/10 text-white" : "text-label-tertiary hover:text-label-secondary"
                                )}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TRUST_TIMELINE}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between items-center mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-xs text-label-secondary">Current Trust Score Projected to hit <span className="text-white font-bold">92</span> by next month.</p>
                        </div>
                        <Target className="w-4 h-4 text-blue-400/50" />
                    </div>
                </GlassCard>

                <GlassCard className="lg:col-span-4 p-8 relative overflow-hidden" variant="liquid">
                    <div className="flex items-center gap-3 mb-6">
                        <Brain className="w-6 h-6 text-purple-400" />
                        <h4 className="font-bold text-white text-lg">AI Trust Reasoning</h4>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                            <p className="text-sm text-label-secondary leading-relaxed">
                                "Your trust score increased due to <span className="text-purple-400 font-bold">consistent contract fulfillment</span> and high dataset recency. No disputes recorded in the last 180 days."
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Key Drivers</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-label-secondary">Data Recency</span>
                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald w-[92%]" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-label-secondary">Payment Stability</span>
                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald w-[88%]" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-label-secondary">Dispute History</span>
                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald w-[100%]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <RefreshCcw className="w-3 h-3" />
                            Recalculate Score
                        </button>
                    </div>
                    
                    {/* Background Intelligence Visualization */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
                </GlassCard>
            </div>
        </div>
    );
}

const CheckCircle2 = (props: any) => <ShieldCheck {...props} />;
const DollarSign = (props: any) => <Zap {...props} />;
