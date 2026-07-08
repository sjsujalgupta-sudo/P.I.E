/*
 * 🎭 Analogy: This file is the "AI Chat Room" — it's the page
 *   where users can talk to an AI assistant about their data,
 *   ask questions, and get insights in a chat interface.
 * ✅ Safe to change:
 *    1. The placeholder text in the chat input
 *    2. The AI assistant name/branding shown in the header
 *    3. The suggested prompt chips shown to new users
 * ❌ Never touch: The default export function name — Next.js
 *   requires it to match the file's route. Renaming breaks routing.
 */

"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { 
    MessageSquare, 
    Send, 
    Sparkles, 
    Bot, 
    User, 
    Loader2, 
    Trash2,
    Shield,
    ChevronRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Message = {
    role: "user" | "assistant";
    content: string;
    id: string;
    timestamp: Date;
};

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/proxy/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input }),
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.message || data.error);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.answer,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error("Chat error:", err);
            toast.error("Assistant Error", { 
                description: err.message || "Failed to get response from your vault. Is the server running?" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="h-full p-6 md:p-8 flex flex-col relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-headline flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl icon-container icon-container-violet flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        Vault Assistant
                    </h1>
                    <p className="text-body mt-1">Ask questions about your captured browsing history and interests.</p>
                </div>
                <button 
                    onClick={clearChat}
                    className="p-2.5 rounded-xl bg-white/[0.04] text-label-tertiary hover:text-danger hover:bg-danger/10 transition-all duration-200 border border-white/[0.06]"
                    title="Clear chat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Container */}
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden backdrop-blur-2xl">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    <AnimatePresence initial={false}>
                        {messages.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center border border-white/[0.08]">
                                    <Bot className="w-8 h-8 text-label-secondary" />
                                </div>
                                <div>
                                    <h3 className="text-title text-label-secondary">Your AI Vault Assistant</h3>
                                    <p className="text-body max-w-xs mx-auto mt-2">
                                        Ask me anything like &quot;What was I looking at yesterday?&quot; or &quot;Tell me about my recent interests in football.&quot;
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                                    {[
                                        "What are my top topics?",
                                        "Summarize my recent activity",
                                        "Did I search for AI news?",
                                        "Which domains do I visit most?"
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInput(suggestion)}
                                            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-label-secondary hover:bg-white/[0.08] hover:text-label transition-all text-left flex items-center justify-between group"
                                        >
                                            {suggestion}
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            messages.map((m) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn(
                                        "flex gap-4 max-w-[85%]",
                                        m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                        m.role === "user" 
                                            ? "bg-accent-dim border-accent/20 text-accent" 
                                            : "bg-white/[0.05] border-white/10 text-label-secondary"
                                    )}>
                                        {m.role === "user" ? <User className="w-[18px] h-[18px]" /> : <Sparkles className="w-[18px] h-[18px]" />}
                                    </div>
                                    <div className={cn(
                                        "space-y-1",
                                        m.role === "user" ? "text-right" : "text-left"
                                    )}>
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                                            m.role === "user" 
                                                ? "bg-accent text-white" 
                                                : "bg-white/[0.05] border border-white/10 text-label"
                                        )}>
                                            {m.content}
                                        </div>
                                        <p className="text-[10px] text-label-tertiary px-1">
                                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4 mr-auto"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0 text-label-tertiary">
                                    <Sparkles className="w-[18px] h-[18px]" />
                                </div>
                                <div className="bg-white/[0.05] border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                    <span className="text-[13px] text-label-tertiary">Consulting your vault...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-separator bg-white/[0.02]">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask about your data..."
                            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 pr-14 text-[14px] focus:outline-none focus:border-accent/40 focus:bg-white/[0.06] transition-all"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-2.5 rounded-xl bg-accent text-white hover:bg-accent-solid disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] text-label-quaternary">
                                <Shield className="w-3 h-3" />
                                Privacy Protected
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-label-quaternary">
                                <Search className="w-3 h-3" />
                                Local Context Only
                            </div>
                        </div>
                        <span className="text-[10px] text-label-tertiary">Press Enter to send</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
