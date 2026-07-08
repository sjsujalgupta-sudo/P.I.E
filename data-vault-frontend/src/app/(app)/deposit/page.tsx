/*
 * 🎭 Analogy: This file is the "Deposit Window" — it's the page
 *   where users can upload or import data into their vault,
 *   like depositing documents into a safe.
 * ✅ Safe to change:
 *    1. The upload area styling and drag-and-drop text
 *    2. The supported file type list shown to users
 *    3. The success/error message text after upload
 * ❌ Never touch: The default export function name — Next.js
 *   requires it to match the file's route. Renaming breaks routing.
 */

"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Shield,
    Globe,
    Search,
    Tag,
    BarChart3,
    AlertTriangle,
    Download,
} from "lucide-react";
import { ApiError, fetchPreview, type PreviewResponse } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DepositPage() {
    const [loading, setLoading] = useState(true);
    const [approved, setApproved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [consent, setConsent] = useState({ store: false, share: false, sensitive: false });

    const allConsented = consent.store && consent.share && consent.sensitive;
    const step = approved ? 3 : allConsented ? 2 : 1;

    useEffect(() => {
        const storedSessionId = localStorage.getItem("sessionId");
        if (!storedSessionId) {
            setSessionId(null);
            setLoading(false);
            return;
        }
        const activeSessionId = storedSessionId;
        setSessionId(activeSessionId);
        setSessionId(storedSessionId);

        let mounted = true;
        async function loadPreview() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPreview(activeSessionId);
                if (mounted) setPreview(data);
            } catch (err) {
                if (!mounted) return;
                const message =
                    err instanceof ApiError && err.offline
                        ? "Server offline"
                        : "Failed to load session preview";
                setError(message);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadPreview();
        return () => { mounted = false; };
    }, []);

    const handleApprove = () => {
        setApproved(true);
        toast.success("Approved", { description: "This session is marked as approved in the UI." });
    };

    const handleDiscard = () => {
        localStorage.removeItem("sessionId");
        setSessionId(null);
        setPreview(null);
        setApproved(false);
        toast("Session discarded");
    };

    if (loading) {
        return (
            <div className="space-y-6 relative z-10">
                <div className="skeleton h-8 w-56 mb-2" />
                <div className="skeleton h-4 w-80" />
                <div className="skeleton h-72 rounded-[18px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative z-10">
            {/* Deposit Header — emerald workflow identity */}
            <div className="relative overflow-hidden rounded-[18px] border border-emerald/10 page-hero-card p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-emerald-dim flex items-center justify-center border border-emerald/20 flex-shrink-0">
                        <Download className="w-6 h-6 text-emerald" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-headline">Deposit to Vault</h1>
                        <p className="text-body mt-1">Review your current session data before storing it securely.</p>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 mt-5">
                            {[
                                { num: 1, label: "Review" },
                                { num: 2, label: "Consent" },
                                { num: 3, label: "Approve" },
                            ].map((s, i) => (
                                <div key={s.num} className="flex items-center gap-2">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 border",
                                        step >= s.num
                                            ? "bg-emerald-dim text-emerald border-emerald/20"
                                            : "bg-surface-elevated text-label-tertiary border-separator"
                                    )}>
                                        <span className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                            step >= s.num ? "bg-emerald text-background" : "bg-surface-elevated text-label-tertiary"
                                        )}>
                                            {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : s.num}
                                        </span>
                                        {s.label}
                                    </div>
                                    {i < 2 && (
                                        <div className={cn("w-6 h-px transition-colors duration-300", step > s.num ? "bg-emerald/30" : "bg-separator")} />
                                    )}
                                </div>
                            ))}
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

            {!sessionId || !preview ? (
                <GlassCard className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-[16px] bg-emerald-dim flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-emerald/50" />
                    </div>
                    <h3 className="text-title mb-1">No active session</h3>
                    <p className="text-body text-center max-w-md">Save a `sessionId` in localStorage to load preview data.</p>
                </GlassCard>
            ) : (
                <AnimatePresence mode="wait">
                    {approved ? (
                        <motion.div
                            key="approved"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-dim flex items-center justify-center mb-5 border border-emerald/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald" />
                            </div>
                            <h2 className="text-[22px] font-semibold text-label mb-1 tracking-tight">Approved & Stored</h2>
                            <p className="text-body text-center max-w-md">Session `{preview.session_id}` is approved in UI for MVP.</p>
                        </motion.div>
                    ) : (
                        <motion.div key="preview" className="space-y-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Score */}
                                <GlassCard className="flex flex-col items-center justify-center py-10">
                                    <div className="w-24 h-24 rounded-full bg-emerald-dim flex items-center justify-center mb-3 border border-emerald/20">
                                        <span className="text-[36px] font-semibold text-emerald tracking-tight">
                                            {preview.profile.data_quality_score}
                                        </span>
                                    </div>
                                    <p className="text-body">Data Quality Score</p>
                                </GlassCard>

                                {/* Preview */}
                                <GlassCard className="lg:col-span-2 space-y-6">
                                    <h3 className="text-title flex items-center gap-2.5">
                                        <div className="icon-container icon-container-emerald">
                                            <BarChart3 className="w-[14px] h-[14px]" />
                                        </div>
                                        Session Preview
                                    </h3>

                                    <div>
                                        <label className="text-footnote uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2.5 text-label-secondary">
                                            <Tag className="w-3 h-3" /> Top Interests
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {preview.profile.top_interests.map((interest) => (
                                                <span key={interest.name} className="text-[12px] px-2.5 py-[5px] rounded-full bg-emerald-dim text-emerald border border-emerald/15 font-medium">
                                                    {interest.name} ({interest.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-footnote uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2.5 text-label-secondary">
                                            <Globe className="w-3 h-3" /> Top Topics
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {preview.profile.top_topics.map((topic) => (
                                                <span key={topic.name} className="text-[12px] px-2.5 py-[5px] rounded-full bg-cyan-dim text-cyan border border-cyan/15 font-medium">
                                                    {topic.name} ({topic.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-footnote uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2.5 text-label-secondary">
                                            <Search className="w-3 h-3" /> Search Queries
                                        </label>
                                        <div className="space-y-1.5">
                                            {preview.profile.search_queries.map((query) => (
                                                <div key={query} className="text-[13px] text-label-secondary bg-surface-elevated px-3 py-2 rounded-[10px] border border-separator">
                                                    &quot;{query}&quot;
                                                </div>
                                            ))}
                                            {preview.profile.search_queries.length === 0 && (
                                                <p className="text-body text-label-tertiary">No search queries.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-footnote uppercase tracking-wider font-semibold mb-2 block text-label-secondary">Domains Visited</label>
                                        <p className="text-body">{preview.profile.domains_visited.join(", ") || "No domains available"}</p>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Consent */}
                            <GlassCard className="space-y-4">
                                <h3 className="text-title flex items-center gap-2.5">
                                    <div className="icon-container icon-container-emerald">
                                        <Shield className="w-[14px] h-[14px]" />
                                    </div>
                                    Consent Verification
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { key: "store" as const, label: "I understand this data will be stored in my vault" },
                                        { key: "share" as const, label: "I consent to sharing aggregated profile data" },
                                        { key: "sensitive" as const, label: "I verified sensitivity considerations for this data" },
                                    ].map((consentItem) => (
                                        <label key={consentItem.key} className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-200 ${
                                                    consent[consentItem.key]
                                                        ? "bg-emerald border-emerald"
                                                        : "border-label-quaternary group-hover:border-emerald/50"
                                                }`}
                                                onClick={() =>
                                                    setConsent((p) => ({ ...p, [consentItem.key]: !p[consentItem.key] }))
                                                }
                                                role="checkbox"
                                                aria-checked={consent[consentItem.key]}
                                                tabIndex={0}
                                            >
                                                {consent[consentItem.key] && (
                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-body group-hover:text-label transition-colors">
                                                {consentItem.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={!allConsented}
                                    className="btn-success flex items-center justify-center gap-2 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve & Store
                                </button>
                                <button onClick={handleDiscard} className="btn-danger flex items-center justify-center gap-2 flex-1">
                                    <XCircle className="w-4 h-4" />
                                    Discard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
