"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Calendar,
  ChevronRight,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const PERIODS: Record<string, any> = {
  week: {
    hero: '4.20',
    sub: 'this week · updated just now',
    change: '↑ 18% vs last week',
    today: '$0.61',
    month: '$18.40',
    all: '$91.75',
    score: 87,
    scoreTitle: 'High quality · buyers pay premium',
    scoreDesc: 'Browse more on weekends to maximise earnings. Consistent activity = higher data value.',
    pCurrent: '17.70',
    pLeft: '2.30',
    pPct: 88.5,
    forecast: '$18.40',
    fDesc: 'At current pace · ends May 31',
    spark: [
      { v: 1.2 }, { v: 0.8 }, { v: 1.8 }, { v: 2.4 }, { v: 3.1 }, { v: 3.6 }, { v: 4.2 }
    ],
    categories: [
      { label: "Tech", pct: 78, color: "#7ee8a2" },
      { label: "News", pct: 52, color: "#64a0ff" },
      { label: "Shopping", pct: 38, color: "#ffb950" },
      { label: "Finance", pct: 21, color: "#c084fc" },
    ],
    heatmap: [0.9, 0.6, 0.85, 0.1, 0.75, 0.3, 0.5]
  },
  month: {
    hero: '18.40',
    sub: 'this month · May 2026',
    change: '↑ 23% vs April',
    today: '$0.61',
    month: '$18.40',
    all: '$91.75',
    score: 91,
    scoreTitle: 'Excellent · top 12% of users',
    scoreDesc: 'Your data profile is highly sought this month. Keep it up.',
    pCurrent: '18.40',
    pLeft: '0',
    pPct: 100,
    forecast: '$18.40',
    fDesc: 'Month nearly complete',
    spark: [
      { v: 2 }, { v: 4 }, { v: 6 }, { v: 8 }, { v: 10 }, { v: 14 }, { v: 18.4 }
    ],
    categories: [
      { label: "Tech", pct: 85, color: "#7ee8a2" },
      { label: "News", pct: 60, color: "#64a0ff" },
      { label: "Shopping", pct: 45, color: "#ffb950" },
      { label: "Finance", pct: 30, color: "#c084fc" },
    ],
    heatmap: [0.95, 0.8, 0.9, 0.7, 0.85, 0.9, 0.8]
  },
  all: {
    hero: '91.75',
    sub: 'all time · Jan 2025 – now',
    change: '↑ steady growth',
    today: '$0.61',
    month: '$18.40',
    all: '$91.75',
    score: 89,
    scoreTitle: 'Consistent · reliable data source',
    scoreDesc: 'Long-term activity makes your data more valuable to buyers.',
    pCurrent: '91.75',
    pLeft: '0',
    pPct: 100,
    forecast: '$110+',
    fDesc: 'Projected year-end at current rate',
    spark: [
      { v: 5 }, { v: 14 }, { v: 22 }, { v: 38 }, { v: 55 }, { v: 70 }, { v: 91.75 }
    ],
    categories: [
      { label: "Tech", pct: 72, color: "#7ee8a2" },
      { label: "News", pct: 58, color: "#64a0ff" },
      { label: "Shopping", pct: 42, color: "#ffb950" },
      { label: "Finance", pct: 25, color: "#c084fc" },
    ],
    heatmap: [0.85, 0.75, 0.8, 0.85, 0.9, 0.7, 0.8]
  }
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// --- Components ---

function StatCard({ label, value, sub, badge, badgeType, metal, shine }: { 
  label: string; 
  value: string; 
  sub: string; 
  badge: string; 
  badgeType: 'green' | 'blue' | 'amber';
  metal?: "silver" | "titanium" | "platinum" | "chromium";
  shine?: boolean;
}) {
  const badgeColors = {
    green: "bg-[#7ee8a2]/10 text-[#7ee8a2] border-[#7ee8a2]/20",
    blue: "bg-[#64a0ff]/10 text-[#64a0ff] border-[#64a0ff]/20",
    amber: "bg-[#ffb950]/10 text-[#ffb950] border-[#ffb950]/20",
  };
  
  const textMetalClass = metal ? {
    silver: "metal-text-silver",
    titanium: "metal-text-titanium",
    platinum: "metal-text-platinum",
    chromium: "metal-text-silver" // chromium doesn't have a specific text class yet, silver is close
  }[metal] : "";

  return (
    <GlassCard className="p-6 flex flex-col border-white/10" variant="liquid" hover metal={metal} shine={shine}>
      <div className={cn("text-[10px] uppercase tracking-widest text-label-tertiary font-bold mb-3", textMetalClass)}>{label}</div>
      <div className={cn("text-[24px] font-mono font-light text-label mb-1", textMetalClass)}>{value}</div>
      <div className="text-[11px] text-label-tertiary mb-3">{sub}</div>
      <div className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit", badgeColors[badgeType])}>
        {badge}
      </div>
    </GlassCard>
  );
}

export default function EarningsDashboard() {
  const [activePeriod, setActivePeriod] = useState<string>('week');
  const data = PERIODS[activePeriod];

  return (
    <div className="w-full h-full bg-transparent text-label font-sans selection:bg-[#7ee8a2]/30 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-6 pb-32">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[18px] font-bold tracking-tight text-label">
            Data<span className="text-[#7ee8a2]">Vault</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#7ee8a2]/10 border border-[#7ee8a2]/30 text-[#7ee8a2] text-[11px] font-bold">
            <div className="w-1.5 h-1.5 bg-[#7ee8a2] rounded-full animate-pulse" />
            Live
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-2">
          {['week', 'month', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all border",
                activePeriod === p 
                  ? "bg-white/10 text-white border-white/20 shadow-lg" 
                  : "bg-white/5 text-label-tertiary border-white/10 hover:bg-white/8"
              )}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All time'}
            </button>
          ))}
        </div>

        {/* Hero Card */}
        <GlassCard className="relative overflow-hidden group border-white/10" variant="liquid" metal="platinum" shine>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-radial-gradient from-[#7ee8a2]/10 to-transparent pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          <div className="text-[11px] uppercase tracking-[1.5px] text-label-tertiary font-semibold mb-2">Your data earned</div>
          <div className="text-[52px] font-mono font-light tracking-tighter text-label leading-none mb-2">
            <span className="text-label-tertiary text-[28px] mr-1">$</span>
            {data.hero}
          </div>
          <div className="text-[13px] text-label-tertiary mb-5">{data.sub}</div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7ee8a2]/10 border border-[#7ee8a2]/20 text-[#7ee8a2] text-[12px] font-semibold mb-6">
            {data.change}
          </div>
          
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.spark}>
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7ee8a2" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#7ee8a2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke="#7ee8a2" 
                  strokeWidth={2.5} 
                  fill="url(#sparkGradient)" 
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="Today" 
            value={data.today} 
            sub="7 sessions" 
            badge="+12%" 
            badgeType="green" 
            metal="silver"
            shine
          />
          <StatCard 
            label="Monthly" 
            value={data.month} 
            sub="on track" 
            badge="forecast" 
            badgeType="blue" 
            metal="titanium"
          />
          <StatCard 
            label="All time" 
            value={data.all} 
            sub="since Jan 2025" 
            badge="lifetime" 
            badgeType="amber" 
            metal="chromium"
            shine
          />
        </div>

        {/* Payout Card */}
        <GlassCard className="border-white/10" variant="liquid">
          <div className="text-[11px] uppercase tracking-widest text-label-tertiary font-bold mb-4">Payout progress</div>
          <div className="flex justify-between items-baseline mb-3">
            <div className="text-[13px] text-label-secondary">
              <span className="text-label">${data.pCurrent}</span> of $20.00
            </div>
            <div className="text-[11px] text-[#7ee8a2] font-mono">
              {data.pLeft === '0' ? 'threshold met' : `$${data.pLeft} to go`}
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(data.pPct, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#7ee8a2] to-[#64d68a] rounded-full"
            />
          </div>
          <div className="flex justify-between text-[11px] text-label-tertiary font-mono mb-4">
            <span>$0</span>
            <span>$10</span>
            <span>$20</span>
          </div>
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-[12px] text-label-tertiary max-w-[200px]">
              {data.pPct >= 100 
                ? "Withdrawal unlocked. Transfer to your vault wallet now." 
                : "Browse ~3 more sessions to unlock withdrawal"}
            </div>
            <button className={cn(
              "px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
              data.pPct >= 100
                ? "bg-[#7ee8a2]/20 text-[#7ee8a2] border-[#7ee8a2]/30 hover:bg-[#7ee8a2]/30 cursor-pointer"
                : "bg-white/5 text-label-tertiary border-white/10 cursor-not-allowed shadow-none"
            )}>
              Withdraw
            </button>
          </div>
        </GlassCard>

        {/* Data Quality Card */}
        <GlassCard className="border-white/10" variant="liquid" metal="silver" brushed>
          <div className="flex justify-between items-start mb-6">
            <div className="text-[11px] uppercase tracking-widest text-label-tertiary font-bold">Data quality</div>
            <div className="text-[28px] font-mono font-light text-[#7ee8a2]">{data.score}</div>
          </div>
          <div className="space-y-1 mb-6">
            <div className="text-[13px] font-medium text-label">{data.scoreTitle}</div>
            <div className="text-[11px] text-label-tertiary leading-relaxed">{data.scoreDesc}</div>
          </div>
          <div className="space-y-3">
            {data.categories.map((cat: any) => (
              <div key={cat.label} className="flex items-center gap-3">
                <div className="text-[11px] text-label-tertiary w-14 shrink-0">{cat.label}</div>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
                <div className="text-[11px] text-label-tertiary font-mono w-8 text-right">{cat.pct}%</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Activity Heatmap */}
        <GlassCard className="border-white/10" variant="liquid">
          <div className="text-[11px] uppercase tracking-widest text-label-tertiary font-bold mb-4">Activity · this week</div>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => {
              const activity = data.heatmap[i];
              const isMissed = i === 3; // Mocking Thursday as a missed day
              return (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all border",
                    isMissed 
                      ? "bg-danger/5 border-danger/20 text-danger/40" 
                      : "border-white/5"
                  )}
                  style={!isMissed ? { 
                    backgroundColor: `rgba(126, 232, 162, ${0.04 + activity * 0.55})`,
                    borderColor: `rgba(126, 232, 162, ${activity * 0.15})`,
                    color: `rgba(255, 255, 255, ${0.2 + activity * 0.5})`
                  } : {}}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-label-tertiary/40 mt-4 italic">
            Darker = more active · missed days lose potential earnings
          </div>
        </GlassCard>

        {/* Forecast Card */}
        <GlassCard className="flex items-center justify-between gap-4 border-white/10" variant="liquid">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-widest text-label-tertiary font-bold mb-1.5">Monthly forecast</div>
            <div className="text-[28px] font-mono font-light text-label tracking-tighter">{data.forecast}</div>
            <div className="text-[11px] text-label-tertiary mt-1">{data.fDesc}</div>
          </div>
          <div className="w-24 h-12 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.spark}>
                <Line 
                  type="monotone" 
                  dataKey="v" 
                  stroke="#64a0ff" 
                  strokeWidth={2.5} 
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>


      </div>
    </div>
  );
}
