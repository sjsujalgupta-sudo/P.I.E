/*
 * 🎭 Analogy: This is the "Building Directory" — the left-side navigation
 *    panel that lists every room (page) in the app. Click a room name and
 *    you go there. The directory collapses to just icons when space is tight.
 * ✅ Safe to change:
 *    1. Add a new link to NAV_SECTIONS (give it href, label, icon)
 *    2. Change the user name/email in the bottom profile section
 *    3. Reorder items within a NAV_SECTIONS group
 * ❌ Never touch: The layoutId="activeBar" on the motion.div — this is the
 *    shared animation ID for the active-page indicator. Changing it breaks
 *    the sliding highlight animation when navigating between pages.
 */
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Vault,
    Handshake,
    User,
    MessageCircle,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
    Menu,
    X,
    ChevronLeft,
    Map,
    Brain,
    BarChart3,
    Home,
} from "lucide-react";

const NAV_SECTIONS = [
    {
        label: "Main",
        items: [
            { href: "/origin",      label: "Origin",      icon: Home           },
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/atlas",     label: "Atlas",     icon: Map            },
            { href: "/insights",  label: "Insights",  icon: BarChart3      },
            { href: "/synapse",   label: "Synapse",   icon: Brain          },
        ],
    },
    {
        label: "Data",
        items: [
            { href: "/vault", label: "Vault", icon: Vault },
            { href: "/contracts", label: "Contracts", icon: Handshake },
            { href: "/profile", label: "Profile", icon: User },
        ],
    },
    {
        label: "Tools",
        items: [
            { href: "/assistant", label: "Assistant", icon: MessageCircle },
            { href: "/settings", label: "Settings", icon: Settings },
            { href: "#", label: "Sign Out", icon: LogOut, onClick: true },
        ],
    },
];

function NavItem({ href, label, Icon, active, collapsed, onClick }: { href: string; label: string; Icon: any; active: boolean; collapsed: boolean; onClick?: () => void }) {
    const content = (
        <motion.div
            whileHover={{ x: collapsed ? 0 : 2 }}
            whileTap={{ scale: 0.97 }}
            className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-[12px]
                text-[13px] font-medium transition-all duration-200 cursor-pointer
                ${active
                    ? "bg-accent-dim text-accent border border-accent/20"
                    : "text-label-secondary hover:text-label hover:bg-white/[0.05]"
                }
            `}
            onClick={onClick}
        >
            {active && (
                <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-white rounded-r-full shadow-[0_0_8px_white]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            <Icon
                className={`w-[16px] h-[16px] flex-shrink-0 transition-colors ${
                    active ? "text-accent" : "sidebar-icon-default group-hover:text-label-secondary"
                }`}
            />
            {!collapsed && <span className="truncate">{label}</span>}

            {active && !collapsed && (
                <ChevronRight className="w-3 h-3 ml-auto text-accent/50" />
            )}
        </motion.div>
    );

    if (onClick) {
        return content;
    }

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    );
}

export function Sidebar({ collapsed = false, setCollapsed }: { collapsed?: boolean; setCollapsed?: (v: boolean) => void }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);

    const userName = "User";
    const userEmail = "user@pie.io";
    const initials = "PIE";

    const handleCollapse = (value: boolean) => {
        setIsCollapsed(value);
        setCollapsed?.(value);
    };

    const SidebarContent = ({ inMobile = false }: { inMobile?: boolean }) => (
        <div className="flex flex-col h-full relative overflow-hidden rounded-[28px]">
            {/* Inner ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

            <div className="px-4 py-6 relative z-10 flex items-center justify-between border-b border-white/[0.05]">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-[10px] metal-chromium metal-shine flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)] overflow-hidden">
                        <Image 
                            src="/pie-brand-logo.png" 
                            alt="PIE Logo" 
                            width={32} 
                            height={32} 
                            className="object-contain"
                            priority
                        />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <p className="text-[14px] font-bold tracking-tight metal-text-platinum leading-none">PIE</p>
                            <p className="text-[8px] metal-text-silver mt-1 font-bold uppercase tracking-[0.1em]">Personal Intelligence Engine</p>
                        </div>
                    )}
                </div>
                {!inMobile && (
                    <button
                        onClick={() => handleCollapse(!isCollapsed)}
                        className="ml-2 p-1 hover:bg-white/[0.05] rounded-lg transition-colors flex-shrink-0"
                    >
                        <ChevronLeft
                            className={`w-4 h-4 text-label-secondary transition-transform ${
                                isCollapsed ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto relative z-10">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        {!isCollapsed && (
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] metal-text-titanium px-3 mb-3">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(({ href, label, icon: Icon, onClick }) => (
                                <NavItem
                                    key={label}
                                    href={href}
                                    label={label}
                                    Icon={Icon}
                                    active={pathname === href || (href !== "/" && pathname.startsWith(href + "/"))}
                                    collapsed={isCollapsed}
                                    onClick={onClick ? () => signOut() : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="px-3 pb-5 pt-3 relative z-10 space-y-2 border-t border-white/[0.05]">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.07]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/80 to-cyan/80 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold sidebar-text-primary truncate leading-none">{userName}</p>
                            <p className="text-[10px] sidebar-text-tertiary truncate mt-0.5">{userEmail || "Free Plan"}</p>
                        </div>
                        <button 
                            onClick={() => signOut()}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-label-tertiary hover:text-red-400 transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <aside 
                className={`hidden lg:flex flex-shrink-0 sticky top-0 flex-col transition-all duration-300 ml-6 my-6 h-[calc(100vh-3rem)] rounded-[28px] bg-white/[0.04] border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-50 ${
                    isCollapsed ? "w-[80px]" : "w-[240px]"
                }`}
            >
                <SidebarContent />
            </aside>

            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-[10px] bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl"
            >
                <Menu className="w-4 h-4 text-label" />
            </button>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -240 }}
                            animate={{ x: 0 }}
                            exit={{ x: -240 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[220px] sidebar-shell"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/10"
                            >
                                <X className="w-3.5 h-3.5 text-label-secondary" />
                            </button>
                            <SidebarContent inMobile={true} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
