"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { X, ExternalLink, Clock, Calendar, Sparkles, CheckCircle, MapPin, MapPinOff } from "lucide-react";
import type { BrowsingEvent } from "./mock-data";
import { GBR } from "./hierarchy-layout";

interface DetailPanelProps {
  selectedNode: BrowsingEvent | null;
  allNodes: BrowsingEvent[];
  onClose: () => void;
}

export function DetailPanel({ selectedNode, allNodes, onClose }: DetailPanelProps) {
  if (!selectedNode) return null;

  // Determine node type
  const isStartNode = !selectedNode.parentId;
  const hasChildren = allNodes.some(n => n.parentId === selectedNode.id);
  const isEndNode = !hasChildren;

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-24 right-6 bottom-6 w-full max-w-[360px] z-[100]"
        >
          <GlassCard variant="liquid" className="h-full flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-headline font-bold tracking-tight">Page Details</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-label-tertiary hover:text-label"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Node Type Badge */}
              <div className="flex gap-2 flex-wrap">
                {isStartNode && (
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald/20"
                    style={{ background: `${GBR.green}22`, border: `1px solid ${GBR.green}44`, color: GBR.green }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Start Node
                  </div>
                )}
                {!isStartNode && !isEndNode && (
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange/20"
                    style={{ background: `${GBR.papaya}22`, border: `1px solid ${GBR.papaya}44`, color: GBR.papaya }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Intermediate
                  </div>
                )}
                {isEndNode && !isStartNode && (
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red/20"
                    style={{ background: `${GBR.red}22`, border: `1px solid ${GBR.red}44`, color: GBR.red }}
                  >
                    <MapPinOff className="w-3.5 h-3.5" />
                    End Node
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-caption font-semibold uppercase tracking-wider text-label-tertiary">Title</p>
                <h4 className="text-[18px] font-semibold text-label leading-snug">{selectedNode.title}</h4>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-semibold uppercase tracking-wider text-label-tertiary">Full URL</p>
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-accent hover:text-accent-hover transition-colors break-all"
                >
                  <span className="text-body font-medium underline underline-offset-4">{selectedNode.url}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-caption font-semibold uppercase tracking-wider text-label-tertiary">Time Spent</p>
                  <div className="flex items-center gap-2 text-label">
                    <Clock className="w-4 h-4 text-cyan" />
                    <span className="text-body font-medium">
                      {selectedNode.timeSpentSeconds >= 60
                        ? `${Math.floor(selectedNode.timeSpentSeconds / 60)}m ${selectedNode.timeSpentSeconds % 60}s`
                        : `${selectedNode.timeSpentSeconds}s`}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-caption font-semibold uppercase tracking-wider text-label-tertiary">Captured</p>
                  <div className="flex items-center gap-2 text-label">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <span className="text-body font-medium">
                      {new Date(selectedNode.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nuance Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">Navigation</p>
                  <p className="text-[13px] font-medium text-label capitalize">{selectedNode.navigationType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">Source</p>
                  <p className="text-[13px] font-medium text-label capitalize">{selectedNode.discoverySource}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">Scroll Depth</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan transition-all duration-500" 
                        style={{ width: `${selectedNode.scrollDepth}%` }} 
                      />
                    </div>
                    <span className="text-[11px] font-bold">{selectedNode.scrollDepth}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-label-tertiary">Interactions</p>
                  <p className="text-[13px] font-medium text-label">{selectedNode.interactionCount} events</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2 flex flex-wrap gap-2">
                {selectedNode.isInsight && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Key Insight
                  </div>
                )}
                {selectedNode.timeSpentSeconds > 600 ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-[#fbbf24] text-xs font-bold uppercase tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" />
                    Deep Work
                  </div>
                ) : selectedNode.timeSpentSeconds < 10 ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger-dim border border-danger/20 text-danger text-xs font-bold uppercase tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-danger" />
                    Distraction
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/10">
              <button
                onClick={() => window.open(selectedNode.url, '_blank')}
                className="w-full py-3 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                Open Original Page
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
