/*
 * 🎭 Analogy: This is the "Filing Cabinet Room" — the /vault page where
 *    users can browse, search, and delete all their captured browsing data.
 * ✅ Safe to change:
 *    1. Change the number of items shown per page
 *    2. Edit the column headers in the data table
 *    3. Change the delete confirmation message text
 * ❌ Never touch: The fetchVaultData() and deleteVaultEntry() calls —
 *    these talk directly to the backend. Changing their arguments breaks
 *    data loading and deletion.
 */
"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSelect } from "@/components/ui/glass-select";
import { use3DTilt, useRipple } from "@/lib/hooks";
import {
    Search,
    Filter,
    FileDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    Package,
    AlertTriangle,
    Trash2,
    Vault,
    X,
    ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, fetchVaultData, deleteVaultEntry, getExportCsvUrl, getExportPdfUrl, type VaultRow } from "@/lib/api";

// Ripple Effect Component
function RippleEffect({ x, y }: { x: number; y: number }) {
    return (
        <motion.div
            className="absolute pointer-events-none rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
                left: x - 20,
                top: y - 20,
                width: 40,
                height: 40,
            }}
        />
    );
}

const ITEMS_PER_PAGE = 10;

const sensitivityColors: Record<string, string> = {
    low: "badge-low",
    medium: "badge-medium",
    high: "badge-high",
};

const filterOptions = [
    { value: "all", label: "All Levels" },
    { value: "low", label: "Low Sensitivity" },
    { value: "medium", label: "Medium Sensitivity" },
    { value: "high", label: "High Sensitivity" },
];

function VaultPageInner() {
    const [rows, setRows] = useState<VaultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sensitivityFilter, setSensitivityFilter] = useState("all");
    const [page, setPage] = useState(1);
    const searchParams = useSearchParams();

    // Sync with Dynamic Island Nav
    useEffect(() => {
        const m = searchParams.get("mode");
        if (m === "low" || m === "medium" || m === "high") {
            setSensitivityFilter(m);
            setPage(1);
        } else if (m === "all") {
            setSensitivityFilter("all");
            setPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        let mounted = true;
        async function loadVault() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchVaultData();
                if (!mounted) return;
                setRows(
                    [...data].sort(
                        (a, b) =>
                            new Date(b.created_at || b.timestamp).getTime() -
                            new Date(a.created_at || a.timestamp).getTime()
                    )
                );
            } catch (err) {
                if (!mounted) return;
                const message =
                    err instanceof ApiError && err.offline
                        ? "Server offline"
                        : "Failed to load vault data";
                setError(message);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadVault();
        return () => { mounted = false; };
    }, []);

    const filtered = useMemo(() => {
        const searchLower = search.toLowerCase().trim();
        return rows.filter((row) => {
            const matchesSearch =
                !searchLower ||
                row.title.toLowerCase().includes(searchLower) ||
                row.domain.toLowerCase().includes(searchLower) ||
                row.keywords.some((k) => k.toLowerCase().includes(searchLower)) ||
                row.topics.some((t) => t.toLowerCase().includes(searchLower));
            const rowLevel = (row.sensitivity_level || "").toString().toLowerCase().trim();
            const matchesSensitivity =
                sensitivityFilter === "all" || rowLevel === sensitivityFilter.toLowerCase().trim();
            return matchesSearch && matchesSensitivity;
        });
    }, [rows, search, sensitivityFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const openExport = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteVaultEntry(id);
            setRows((current) => current.filter((r) => r.id !== id));
            toast.success("Entry deleted.");
        } catch {
            toast.error("Failed to delete entry.");
        }
    };

    const lowCount = rows.filter((r) => (r.sensitivity_level || "").toString().toLowerCase().trim() === "low").length;
    const mediumCount = rows.filter((r) => (r.sensitivity_level || "").toString().toLowerCase().trim() === "medium").length;
    const highCount = rows.filter((r) => (r.sensitivity_level || "").toString().toLowerCase().trim() === "high").length;

    // 3D Tilt for header card
    const headerCardRef = useRef<HTMLDivElement>(null);
    const headerTilt = use3DTilt(headerCardRef, 3);

    return (
        <div className="w-full h-full overflow-y-auto p-6 md:p-8 lg:p-10 space-y-6 relative z-10">
            {/* Vault Header — distinct cyan identity with 3D tilt */}
            <motion.div
                ref={headerCardRef}
                className="relative overflow-hidden rounded-[18px] border border-cyan/10 page-hero-card p-6 md:p-8 cursor-pointer"
                style={{
                    transform: `rotateX(${headerTilt.rotateX}deg) rotateY(${headerTilt.rotateY}deg)`,
                    transition: "transform 0.1s ease-out",
                    perspective: "1000px",
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-cyan-dim flex items-center justify-center border border-cyan/20 flex-shrink-0">
                        <Vault className="w-6 h-6 text-cyan" />
                    </div>
                    <div>
                        <h1 className="text-headline">Your PIE Vault</h1>
                        <p className="text-body mt-1">Browse, search, and export your captured browsing data.</p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald" />
                                <span className="text-footnote">{lowCount} Low</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-warning" />
                                <span className="text-footnote">{mediumCount} Medium</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-danger" />
                                <span className="text-footnote">{highCount} High</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {error && (
                <GlassCard className="border border-danger/20 bg-danger/5">
                    <p className="text-body text-danger flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </p>
                </GlassCard>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary" />
                    <input
                        type="text"
                        placeholder="Search by title, domain, keyword, or topic..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input-glass pl-10"
                        aria-label="Search vault data"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-label-tertiary flex-shrink-0" />
                    <GlassSelect
                        value={sensitivityFilter}
                        onChange={(v) => { setSensitivityFilter(v); setPage(1); }}
                        options={filterOptions}
                        className="w-full md:w-48"
                    />
                </div>
            </div>

            {/* Active filter chips */}
            {(search || sensitivityFilter !== "all") && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-footnote text-label-tertiary">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </span>
                    {(search || sensitivityFilter !== "all") && (
                        <button
                            onClick={() => { setSearch(""); setSensitivityFilter("all"); setPage(1); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-separator text-footnote text-label-secondary transition-all"
                        >
                            <X className="w-3 h-3" />
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <GlassCard>
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3">
                                <div className="skeleton w-8 h-8 rounded-[8px]" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3.5 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                                <div className="skeleton h-7 w-20 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            ) : rows.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-[16px] bg-cyan-dim flex items-center justify-center mb-4 border border-cyan/15">
                        <Package className="w-8 h-8 text-cyan/50" />
                    </div>
                    <h3 className="text-title mb-1">No data captured yet</h3>
                    <p className="text-body text-center max-w-md">
                        Start a session in your extension and refresh this page to see captures.
                    </p>
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-[16px] bg-white/[0.03] flex items-center justify-center mb-4 border border-separator">
                        <Search className="w-8 h-8 text-label-quaternary" />
                    </div>
                    <h3 className="text-title mb-1">No matching results</h3>
                    <p className="text-body text-center max-w-md">
                        Try adjusting your search or filter to find what you are looking for.
                    </p>
                    <button
                        onClick={() => { setSearch(""); setSensitivityFilter("all"); setPage(1); }}
                        className="btn-secondary mt-4 text-[12px] py-2"
                    >
                        Clear all filters
                    </button>
                </GlassCard>
            ) : (
                <GlassCard className="p-0 overflow-hidden">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-separator text-footnote uppercase tracking-wider font-semibold">
                        <div className="col-span-3 text-label-secondary">Title</div>
                        <div className="col-span-2 text-label-secondary">Domain</div>
                        <div className="col-span-2 text-label-secondary">Keywords</div>
                        <div className="col-span-1 text-label-secondary">Topics</div>
                        <div className="col-span-1 text-label-secondary">Level</div>
                        <div className="col-span-1 text-label-secondary">Date</div>
                        <div className="col-span-2 text-right text-label-secondary">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-separator">
                        {paginated.map((row, index) => (
                            <motion.div
                                key={`${row.id}-${row.created_at}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors items-center"
                            >
                                <div className="col-span-3 flex items-center gap-2.5">
                                    <Globe className="w-4 h-4 text-cyan flex-shrink-0 hidden md:block" />
                                    <span className="text-[13px] text-label truncate font-medium">{row.title}</span>
                                </div>
                                <div className="col-span-2 text-[13px] text-label-secondary truncate">{row.domain}</div>
                                <div className="col-span-2 hidden md:flex flex-wrap gap-1">
                                    {row.keywords.slice(0, 2).map((k) => (
                                        <span key={k} className="text-[11px] px-2 py-[2px] rounded-full bg-cyan-dim text-cyan border border-cyan/10 font-medium">
                                            {k}
                                        </span>
                                    ))}
                                    {row.keywords.length > 2 && (
                                        <span className="text-footnote">+{row.keywords.length - 2}</span>
                                    )}
                                </div>
                                <div className="col-span-1 hidden md:block text-footnote text-label-secondary">
                                    {row.topics.length}
                                </div>
                                <div className="col-span-1">
                                    <span className={`${sensitivityColors[row.sensitivity_level] || "badge-low"}`}>
                                        {row.sensitivity_level}
                                    </span>
                                </div>
                                <div className="col-span-1 text-footnote text-label-tertiary hidden md:block">
                                    {new Date(row.created_at || row.timestamp).toLocaleDateString()}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-0.5">
                                    <button
                                        onClick={() => openExport(getExportCsvUrl(row.session_id))}
                                        className="p-2 rounded-[8px] text-label-tertiary hover:text-cyan hover:bg-cyan-dim transition-all"
                                        aria-label={`Export ${row.title} as CSV`}
                                    >
                                        <FileDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => openExport(getExportPdfUrl(row.session_id))}
                                        className="p-2 rounded-[8px] text-label-tertiary hover:text-accent hover:bg-accent-dim transition-all"
                                        aria-label={`Export ${row.title} as PDF`}
                                    >
                                        <FileDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(row.id)}
                                        className="p-2 rounded-[8px] text-label-tertiary hover:text-danger hover:bg-danger/10 transition-all"
                                        aria-label={`Delete ${row.title}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-separator">
                            <p className="text-footnote">
                                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((c) => Math.max(1, c - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-[8px] text-label-secondary hover:text-label hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[13px] text-label-secondary font-medium min-w-[48px] text-center">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-[8px] text-label-secondary hover:text-label hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}
        </div>
    );
}

export default function VaultPage() {
    return (
        <Suspense fallback={null}>
            <VaultPageInner />
        </Suspense>
    );
}
