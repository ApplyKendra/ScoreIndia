"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronUp, HomeIcon, ShoppingBagIcon, CalendarIcon, VideoIcon, YouthIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { X, Sun, Moon, ShoppingCart, User, Settings, LogOut, Heart as HeartIcon } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart-store";

// Navigation item type
type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: "Hot" | "New";
};

// Navigation structure for users
const NAV_DATA: { section: string; items: NavItem[] }[] = [
    {
        section: "Main",
        items: [
            { href: "/", label: "Home", icon: HomeIcon },
            { href: "/auctions", label: "Live Auction", icon: VideoIcon, badge: "Hot" },
        ],
    },
    {
        section: "Account",
        items: [
            { href: "/profile", label: "My Profile", icon: User },
        ],
    },
];

// Section icons mapping
const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "Main": HomeIcon,
    "Account": User,
};

// Search icon component
const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export function Sidebar() {
    const pathname = usePathname();
    const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
    const { user, isAuthenticated, logout } = useAuthStore();
    const itemCount = useCartStore((state) => state.getItemCount());
    const [expandedItems, setExpandedItems] = useState<string[]>(["Main", "Account"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Dark mode detection
    useEffect(() => {
        const isDark = document.documentElement.classList.contains("dark");
        setIsDarkMode(isDark);
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setIsDarkMode(!isDarkMode);
    };

    const toggleExpanded = useCallback((section: string) => {
        setExpandedItems((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section]
        );
    }, []);

    // Filter sections based on search
    const filteredSections = useMemo(() => {
        return NAV_DATA.map(section => ({
            ...section,
            items: section.items.filter(item =>
                !searchQuery ||
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section.section.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(section => section.items.length > 0);
    }, [searchQuery]);

    // Auto-expand sections with active routes
    useEffect(() => {
        const sectionsToEnsure = new Set<string>();
        NAV_DATA.forEach((section) => {
            section.items.forEach((item) => {
                if (item.href === pathname) {
                    sectionsToEnsure.add(section.section);
                }
            });
        });
        if (sectionsToEnsure.size > 0) {
            setExpandedItems((prev) => {
                const merged = new Set(prev);
                sectionsToEnsure.forEach((s) => merged.add(s));
                return Array.from(merged);
            });
        }
    }, [pathname]);

    // Don't render sidebar on desktop - only show on mobile
    if (!isMobile) {
        return null;
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    "fixed bottom-0 top-0 z-50 w-[300px] min-w-[300px] max-w-[300px] overflow-hidden overscroll-y-contain border-r border-gray-200/60 bg-white shadow-lg transition-transform duration-200 ease-out dark:border-gray-700/50 dark:bg-[#0d1117]",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
                style={{
                    willChange: isOpen ? "auto" : "transform",
                    backfaceVisibility: "hidden",
                }}
                aria-label="Main navigation"
                aria-hidden={!isOpen}
            >
                <div className="flex h-full w-[300px] min-w-[300px] flex-col pt-6 pb-2 pl-6 pr-3">
                    {/* Header with Logo and Close Button */}
                    <div className="relative mb-6 flex items-center justify-between">
                        <Link
                            href="/"
                            onClick={() => isMobile && toggleSidebar()}
                            className="flex items-center gap-3 group"
                        >
                            <div className="flex flex-col">
                                <span className="text-2xl font-extrabold logo-gradient-text">
                                    ScoreIndia
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Cricket Auction</span>
                            </div>
                        </Link>

                        {/* Close button for mobile */}
                        {isMobile && (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search navigation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-300/70 bg-gray-100/40 pl-10 pr-4 py-2.5 text-sm focus:border-[#5750F1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-800 dark:focus:border-[#5750F1]"
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav
                        className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600"
                        style={{
                            WebkitOverflowScrolling: "touch",
                            ...(isMobile ? {} : {
                                transform: "translateZ(0)",
                                backfaceVisibility: "hidden",
                            }),
                        }}
                    >
                        <div className="space-y-3">
                            {filteredSections.map((section) => (
                                <div key={section.section} className="space-y-2">
                                    <button
                                        onClick={() => toggleExpanded(section.section)}
                                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 dark:text-gray-300 dark:hover:bg-gray-800/80 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {SECTION_ICONS[section.section] &&
                                                (() => {
                                                    const Icon = SECTION_ICONS[section.section];
                                                    return <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300 transition-colors duration-200" />;
                                                })()
                                            }
                                            <span className="font-bold">{section.section}</span>
                                        </div>
                                        <ChevronUp
                                            className={cn(
                                                "h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400",
                                                expandedItems.includes(section.section) && "rotate-180 text-gray-600 dark:text-gray-300"
                                            )}
                                        />
                                    </button>

                                    {expandedItems.includes(section.section) && (
                                        <div className="ml-6 space-y-1 border-l-2 border-gray-200/60 pl-2 dark:border-gray-700/60">
                                            {section.items.map((item) => (
                                                <MenuItem
                                                    key={item.href}
                                                    href={item.href}
                                                    isActive={pathname === item.href}
                                                >
                                                    {(() => {
                                                        const Icon = item.icon;
                                                        return <Icon className="h-4 w-4" />;
                                                    })()}
                                                    <span className="flex-1">{item.label}</span>
                                                    {item.badge && (
                                                        <Badge variant="default" className="ml-auto text-[8px] font-medium min-w-[28px] text-center bg-[#5750F1]">
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                    {item.href === "/cart" && itemCount > 0 && (
                                                        <Badge className="ml-auto bg-[#5750F1] text-white">
                                                            {itemCount}
                                                        </Badge>
                                                    )}
                                                </MenuItem>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </nav>

                    {/* User Info & Theme Toggle */}
                    <div className="mt-4 border-t border-gray-200/60 pt-4 pb-2 dark:border-gray-700/60 space-y-3">
                        {/* User Info */}
                        {isAuthenticated && user && (
                            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5750F1] to-purple-500 flex items-center justify-center text-white font-medium">
                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <div className="px-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Dark Mode
                            </span>
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {isDarkMode ? (
                                    <Sun className="h-5 w-5 text-yellow-500" />
                                ) : (
                                    <Moon className="h-5 w-5 text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Logout Button */}
                        {isAuthenticated && (
                            <button
                                onClick={() => {
                                    logout();
                                    if (isMobile) toggleSidebar();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        )}

                        {/* Login/Register for guests */}
                        {!isAuthenticated && (
                            <div className="flex flex-col gap-2 px-4">
                                <Link
                                    href="/login"
                                    onClick={() => isMobile && toggleSidebar()}
                                    className="text-sm font-medium p-3 rounded-xl text-center border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => isMobile && toggleSidebar()}
                                    className="text-sm font-medium p-3 rounded-xl bg-[#5750F1] text-white text-center shadow-lg shadow-[#5750F1]/25 hover:bg-[#4a43d6] transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
