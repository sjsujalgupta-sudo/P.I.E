/*
 * 🎭 Analogy: This file is the "Security Camera Log" — it shows
 *   a chronological list of every action taken in the app:
 *   pages captured, sessions started, contracts accepted, etc.
 * ✅ Safe to change:
 *    1. The log entry icon colors per event type
 *    2. The timestamp format (relative vs absolute)
 *    3. The filter options shown in the toolbar
 * ❌ Never touch: The default export function name — Next.js
 *   requires it to match the file's route. Renaming breaks routing.
 */

"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSelect } from "@/components/ui/glass-select";
import { FileText, Filter, Globe, AlertTriangle, ScrollText } from "lucide-react";
import { ApiError, fetchVaultData, type VaultRow } from "@/lib/api";

type LogEntry = {
    id: string;
    type: "Page Captured";
    url: string;
    title: string;
    timestamp: string;
};

export default function LogsPage() {
    const [rows, setRows] = useState<VaultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [domainFilter, setDomainFilter] = useState("all");

    useEffect(() => {
        let mounted = true;
        async function loadLogs() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchVaultData();
                if (!mounted) return;
                setRows(data);
            } catch (err) {
                if (!mounted) return;
                const message =
                    err instanceof ApiError && err.offline
                        ? "Server offline"
                        : "Failed to load logs";
                setError(message);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadLogs();
        return () => { mounted = false; };
    }, []);

    const allDomains = useMemo(() => {
        return Array.from(new Set(rows.map((row) => row.domain))).sort();
    }, [rows]);

    const domainOptions = useMemo(() => [
        { value: "all", label: "All Domains" },
        ...allDomains.map((d) => ({ value: d, label: d })),
    ], [allDomains]);

    const logs = useMemo<LogEntry[]>(() => {
        return rows
            .map((row) => ({
                id: String(row.id),
                type: "Page Captured" as const,
                url: row.url,
                title: row.title,
                timestamp: row.created_at,
            }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [rows]);

    const filteredLogs = useMemo(() => {
        if (domainFilter === "all") return logs;
        return logs.filter((log) => log.url.includes(domainFilter));
    }, [logs, domainFilter]);

    const todayCount = logs.filter((l) => {
        const d = new Date(l.timestamp);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    }).length;

    return (
        <div className="space-y-6 relative z-10">
            {/* Logs Header — cyan audit-trail identity */}
            <div className="relative overflow-hidden rounded-[18px] border border-cyan/10 page-hero-card p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-cyan-dim flex items-center justify-center border border-cyan/20 flex-shrink-0">
                        <ScrollText className="w-6 h-6 text-cyan" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-headline">Activity Logs</h1>
                        <p className="text-body mt-1">Chronological record of captured pages from your vault.</p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="px-3 py-1.5 rounded-full bg-cyan-dim border border-cyan/15 text-cyan text-[12px] font-semibold">
                                {logs.length} Total Events
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-surface-elevated border border-separator text-label-secondary text-[12px] font-medium">
                                {todayCount} Today
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

            <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-label-tertiary" />
                <span className="text-body">Filter Domain:</span>
                <GlassSelect
                    value={domainFilter}
                    onChange={setDomainFilter}
                    options={domainOptions}
                    className="w-56"
                />
            </div>

            {loading ? (
                <GlassCard>
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3">
                                <div className="skeleton w-9 h-9 rounded-[8px]" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3.5 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            ) : filteredLogs.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-16">
                    <div className="w-14 h-14 rounded-[12px] bg-surface-elevated flex items-center justify-center mb-3 border border-separator">
                        <FileText className="w-7 h-7 text-label-quaternary" />
                    </div>
                    <p className="text-title">No logs found</p>
                    <p className="text-body mt-1">Try changing the filter.</p>
                </GlassCard>
            ) : (
                <div className="relative">
                    <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-cyan/30 via-cyan/10 to-transparent hidden sm:block" />
                    <div className="space-y-0.5">
                        {filteredLogs.map((log, index) => (
                            <motion.div
                                key={`${log.id}-${log.timestamp}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02, ease: [0.32, 0.72, 0, 1] as const }}
                                className="flex items-start gap-3 p-3 rounded-[12px] hover:bg-surface-hover transition-colors"
                            >
                                <div className="w-9 h-9 rounded-[10px] bg-cyan-dim flex items-center justify-center flex-shrink-0 z-10 text-cyan border border-cyan/15">
                                    <Globe className="w-[16px] h-[16px]" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-[11px] px-2 py-[2px] rounded-full bg-cyan-dim text-cyan border border-cyan/20 font-medium">
                                            {log.type}
                                        </span>
                                        <span className="text-footnote">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[13px] text-label-secondary">{log.title}</p>
                                    <p className="text-footnote mt-0.5 break-all">{log.url}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
