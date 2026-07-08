"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    History,
    Sparkles,
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
} from "lucide-react";

const NAV_SECTIONS = [
    {
        label: "Main",
        items: [
            { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
            { href: "/history",    label: "History",     icon: History         },
            { href: "/insights",   label: "Insights",    icon: Sparkles        },
        ],
    },
    {
        label: "Data",
        items: [
            { href: "/vault",      label: "Vault",       icon: Vault           },
            { href: "/contracts",  label: "Contracts",   icon: Handshake       },
            { href: "/profile",    label: "Profile",     icon: User            },
        ],
    },
    {
        label: "Tools",
        items: [
            { href: "/assistant",  label: "Assistant",   icon: MessageCircle   },
            { href: "/settings",   label: "Settings",    icon: Settings        },
        ],
    },
];

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: React.ElementType; active: boolean }) {
    return (
        <Link href={href} className="block">
            <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-[12px]
                    text-[13px] font-medium transition-all duration-200 cursor-pointer
                    ${active
                        ? "bg-accent-dim text-accent border border-accent/20"
                        : "text-label-secondary hover:text-label hover:bg-white/[0.05]"
                    }
                `}
            >
                {/* Active left bar */}
                {active && (
                    <motion.div
                        layoutId="activeBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}

                <Icon
                    className={`w-[16px] h-[16px] flex-shrink-0 transition-colors ${
                        active ? "text-accent" : "sidebar-icon-default group-hover:text-label-secondary"
                    }`}
                />
                <span className="truncate">{label}</span>

                {active && (
                    <ChevronRight className="w-3 h-3 ml-auto text-accent/50" />
                )}
            </motion.div>
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);

    const userName  = session?.user?.name  ?? "User";
    const userEmail = session?.user?.email ?? "";
    const initials  = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    const SidebarContent = () => (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="sidebar-orb sidebar-orb-top" />
            <div className="sidebar-orb sidebar-orb-bottom" />

            {/* Logo */}
            <div className="px-4 py-5 sidebar-divider-bottom relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] sidebar-icon-logo flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-accent" strokeWidth={1.8} />
                    </div>
                    <div>
                        <p className="text-[15px] font-bold tracking-tight sidebar-text-primary leading-none">DataVault</p>
                        <p className="text-[10px] sidebar-text-tertiary mt-0.5 font-medium uppercase tracking-wider">Private Cloud</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto relative z-10">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] sidebar-text-tertiary px-3 mb-2">
                            {section.label}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map(({ href, label, icon: Icon }) => (
                                <NavItem
                                    key={href}
                                    href={href}
                                    label={label}
                                    Icon={Icon}
                                    active={pathname === href || pathname.startsWith(href + "/")}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User footer */}
            <div className="px-3 pb-4 pt-3 sidebar-divider-top relative z-10 space-y-2">
                {/* User card */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.07]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/80 to-cyan/80 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold sidebar-text-primary truncate leading-none">{userName}</p>
                        <p className="text-[10px] sidebar-text-tertiary truncate mt-0.5">{userEmail || "Free Plan"}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald flex-shrink-0" />
                </div>

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-label-secondary hover:text-danger hover:bg-danger/5 hover:border-danger/20 border border-transparent transition-all duration-200 group"
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:text-danger transition-colors" />
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-[220px] flex-shrink-0 h-screen sticky top-0 sidebar-shell flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-[10px] bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl"
            >
                <Menu className="w-4 h-4 text-label" />
            </button>

            {/* Mobile drawer */}
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
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
