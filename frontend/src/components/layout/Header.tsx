'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, Search, Bell, Sun, Moon, ChevronDown } from 'lucide-react';
import { useSidebarContext } from './sidebar/sidebar-context';
import { MenuIcon } from './sidebar/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/prasadam', label: 'Prasadam' },
    { href: '/store', label: 'Store' },
    { href: '/events', label: 'Events' },
    { href: '/youth', label: 'Youth' },
    { href: '/darshan', label: 'Darshan' },
];

export function Header() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const itemCount = useCartStore((state) => state.getItemCount());
    const { toggleSidebar } = useSidebarContext();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fix hydration mismatch - only render client-specific content after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Dark mode detection
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        logout();
        router.push('/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-200/80 dark:border-gray-800/80'
                : 'bg-white dark:bg-gray-900 backdrop-blur-md shadow-sm border-b border-gray-200/60 dark:border-gray-800/60'
                }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 lg:h-[68px] items-center justify-between gap-4">

                    {/* Left Section: Mobile Menu + Logo */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <MenuIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 shrink-0">
                            <Image
                                src="/logo.svg"
                                alt="ISKCON Burla"
                                width={40}
                                height={40}
                                className="h-9 w-9 lg:h-10 lg:w-10"
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-base lg:text-lg font-bold leading-tight">
                                    <span className="bg-gradient-to-r from-gray-900 via-[#5750F1] to-gray-900 dark:from-white dark:via-[#5750F1] dark:to-white bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift">
                                        ISKCON Burla
                                    </span>
                                </h1>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] lg:text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Digital Temple
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Center Section: Desktop Navigation */}
                    <nav className="hidden lg:flex items-center justify-center flex-1 max-w-xl">
                        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-[#5750F1] shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Right Section: Actions */}
                    <div className="flex items-center gap-2 lg:gap-3">
                        {/* Theme Toggle - Hidden on small mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            className="hidden sm:flex h-10 w-10 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {isDarkMode ? (
                                <Sun className="h-4 w-4 text-yellow-500" />
                            ) : (
                                <Moon className="h-4 w-4 text-gray-600" />
                            )}
                        </Button>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative flex h-10 w-10 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => {
                                console.log('Dispatching open-notifications event');
                                window.dispatchEvent(new Event('open-notifications'));
                            }}
                        >
                            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                        </Button>

                        {/* Cart */}
                        <Link href="/cart">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-10 w-10 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                {mounted && itemCount > 0 && (
                                    <Badge
                                        className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-[#5750F1] border-2 border-white dark:border-gray-900"
                                    >
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>

                        {/* User Menu */}
                        {isAuthenticated && user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-10 px-2 lg:px-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800 gap-2"
                                    >
                                        <Avatar className="h-7 w-7 rounded-full">
                                            <AvatarFallback className="rounded-full bg-gradient-to-br from-[#5750F1] to-[#7C3AED] text-white text-xs font-medium">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[80px] truncate">
                                            {user.name.split(' ')[0]}
                                        </span>
                                        <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-60 rounded-xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-2"
                                    align="end"
                                    sideOffset={8}
                                >
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-2">
                                        <Avatar className="h-10 w-10 rounded-full">
                                            <AvatarFallback className="rounded-full bg-gradient-to-br from-[#5750F1] to-[#7C3AED] text-white text-sm font-medium">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-semibold text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link href="/orders" className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <span>My Orders</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {(user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN') && (
                                        <>
                                            <DropdownMenuSeparator className="my-2" />
                                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                                <Link href="/admin" className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-[#5750F1]/10 flex items-center justify-center">
                                                        <svg className="h-4 w-4 text-[#5750F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[#5750F1] font-medium">Admin Panel</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                <LogOut className="h-4 w-4 text-red-600" />
                                            </div>
                                            <span>Log out</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    asChild
                                    className="hidden sm:flex h-10 px-4 rounded-xl text-sm font-medium"
                                >
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="h-10 px-4 lg:px-5 rounded-xl bg-[#5750F1] hover:bg-[#4a43d6] shadow-lg shadow-[#5750F1]/25 text-sm font-medium"
                                >
                                    <Link href="/register">
                                        <span className="hidden sm:inline">Get Started</span>
                                        <span className="sm:hidden">Join</span>
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
