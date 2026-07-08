"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Users, 
    Zap, 
    ArrowUpRight,
    Activity,
    PieChart,
    Layers,
    Share2
} from "lucide-react";
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    AreaChart, 
    Area 
} from "recharts";
import { cn } from "@/lib/utils";

const PERFORMANCE_DATA = [
    { name: 'Jan', revenue: 2400, growth: 12 },
    { name: 'Feb', revenue: 1398, growth: 18 },
    { name: 'Mar', revenue: 9800, growth: 22 },
    { name: 'Apr', revenue: 3908, growth: 14 },
    { name: 'May', revenue: 4800, growth: 28 },
    { name: 'Jun', revenue: 3800, growth: 24 },
    { name: 'Jul', revenue: 4300, growth: 32 },
];

function AnalyticsStat({ label, value, trend, trendValue, icon: Icon }: { label: string, value: string, trend: "up" | "down", trendValue: string, icon: any }) {
    return (
        <GlassCard className="p-6 space-y-4" metal="silver">
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
                    trend === "up" ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-400"
                )}>
                    {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trendValue}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-[0.2em]">{label}</p>
                <p className="text-2xl font-mono text-white font-bold">{value}</p>
            </div>
        </GlassCard>
    );
}

export function ContractAnalytics() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticsStat label="Total Exchanges" value="142" trend="up" trendValue="+14%" icon={Share2} />
                <AnalyticsStat label="Revenue Generated" value="$12.4k" trend="up" trendValue="+8.2%" icon={DollarSign} />
                <AnalyticsStat label="Trust Growth" value="+24.5%" trend="up" trendValue="+4.1%" icon={TrendingUp} />
                <AnalyticsStat label="Retention Rate" value="98.2%" trend="up" trendValue="+0.4%" icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Yield Chart */}
                <GlassCard className="lg:col-span-8 p-8" metal="platinum">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-emerald" />
                            <h4 className="font-bold text-white">Yield Performance</h4>
                        </div>
                        <div className="flex gap-2">
                            {["Revenue", "Volume"].map(t => (
                                <button key={t} className={cn(
                                    "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                                    t === "Revenue" ? "bg-white/10 text-white" : "text-label-tertiary hover:text-label-secondary"
                                )}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={PERFORMANCE_DATA}>
                                <defs>
                                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#ffffff50', fontSize: 10 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#ffffff50', fontSize: 10 }}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorYield)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Secondary Metrics */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <GlassCard className="p-8 flex-1" metal="titanium">
                        <div className="flex items-center gap-3 mb-8">
                            <PieChart className="w-5 h-5 text-indigo-400" />
                            <h4 className="font-bold text-white">Engagement Mix</h4>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: "Enterprise", value: 65, color: "bg-blue-500" },
                                { label: "Academic", value: 25, color: "bg-indigo-400" },
                                { label: "Private AI", value: 10, color: "bg-purple-500" },
                            ].map(item => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-label-tertiary">{item.label}</span>
                                        <span className="text-white">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={cn("h-full", item.color)} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 relative overflow-hidden" variant="liquid">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-amber-400" />
                            <h4 className="font-bold text-white">Transaction Velocity</h4>
                        </div>
                        <div className="text-center py-6">
                            <p className="text-4xl font-mono text-white font-bold mb-2">4.2</p>
                            <p className="text-[10px] uppercase text-label-tertiary font-bold tracking-widest">Exchanges per day</p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-400/10 blur-3xl rounded-full" />
                    </GlassCard>
                </div>
            </div>

            {/* Contract Retention Table Mockup */}
            <GlassCard className="p-0 overflow-hidden" metal="silver">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-blue-400" />
                        <h4 className="font-bold text-white">Performance Ledger</h4>
                    </div>
                    <button className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        Export Report
                        <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-[10px] uppercase text-label-tertiary tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Dataset</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Avg Yield</th>
                                <th className="px-8 py-5">Uptime</th>
                                <th className="px-8 py-5 text-right">Analytics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: "Consumer Behaviors", status: "Optimal", yield: "$420", uptime: "99.9%", color: "text-emerald" },
                                { name: "Retail Intent", status: "Active", yield: "$180", uptime: "98.4%", color: "text-blue-400" },
                                { name: "BioMetrics Feed", status: "Warning", yield: "$550", uptime: "94.2%", color: "text-amber-400" },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-white font-bold">{row.name}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", row.color === "text-emerald" ? "bg-emerald" : row.color === "text-blue-400" ? "bg-blue-400" : "bg-amber-400")} />
                                            <span className={cn("text-[10px] font-bold uppercase", row.color)}>{row.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-mono text-sm text-white">{row.yield}</td>
                                    <td className="px-8 py-6 font-mono text-sm text-label-secondary">{row.uptime}</td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Activity className="w-3.5 h-3.5 text-blue-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
