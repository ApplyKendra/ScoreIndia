"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

interface MenuItemProps {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    href: string;
}

export function MenuItem({ className, children, isActive, href }: MenuItemProps) {
    const { toggleSidebar, isMobile } = useSidebarContext();

    return (
        <Link
            href={href}
            onClick={() => isMobile && toggleSidebar()}
            className={cn(
                "relative block py-2.5 pl-3 pr-4 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                isActive
                    ? "bg-gradient-to-r from-[#5750F1]/10 to-purple-500/10 text-[#5750F1] shadow-sm dark:from-[#5750F1]/20 dark:to-purple-500/20"
                    : "text-gray-600 hover:bg-gray-50/60 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/40 dark:hover:text-white",
                className
            )}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-[#5750F1] to-purple-500 rounded-r-full" />
            )}

            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg dark:from-gray-800/30" />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
                {children}
            </div>
        </Link>
    );
}
