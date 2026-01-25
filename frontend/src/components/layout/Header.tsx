'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Gavel, Users, Shield, Trophy, Clock, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/auctions', label: 'Auctions' },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Floating Show Header Button - Appears when header is hidden */}
            {!isHeaderVisible && !isHomePage && (
                <Button
                    onClick={() => setIsHeaderVisible(true)}
                    className="fixed top-4 right-4 z-50 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-white"
                    size="sm"
                    title="Show header"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Show Header</span>
                </Button>
            )}

            {isHeaderVisible && (
                <header
                    className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                        ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-slate-200/80'
                        : 'bg-white backdrop-blur-md shadow-sm border-b border-slate-200/60'
                        }`}
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 lg:h-[68px] items-center justify-between gap-4">

                            {/* Left Section: Logo */}
                            <div className="flex items-center gap-3">
                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200/60 hover:bg-slate-100 transition-colors"
                                    aria-label="Toggle menu"
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-5 w-5 text-slate-600" />
                                    ) : (
                                        <Menu className="h-5 w-5 text-slate-600" />
                                    )}
                                </button>

                                {/* Logo */}
                                <Link href="/" className="flex items-center shrink-0">
                                    {/* ScoreIndia Logo Image - positive margin pushes logo down to center visually */}
                                    <img
                                        src="/ScoreIndia-Logo.png"
                                        alt="ScoreIndia Logo"
                                        className="h-36 sm:h-44 lg:h-48 xl:h-56 w-auto object-contain mt-4 sm:mt-5 lg:mt-6"
                                    />
                                </Link>
                            </div>

                            {/* Center Section: Desktop Navigation */}
                            <nav className="hidden lg:flex items-center justify-center flex-1 max-w-xl">
                                <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/60 border border-slate-200/50">
                                    {navLinks.map((link) => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={`px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>

                            {/* Right Section: Actions */}
                            {!isHomePage && (
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsHeaderVisible(false)}
                                        className="gap-2 rounded-xl hover:bg-slate-100 text-slate-600"
                                        title="Hide header"
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        <span className="hidden sm:inline text-sm">Hide</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-slate-200 bg-white">
                            <div className="px-4 py-4 space-y-2">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </header>
            )}
        </>
    );
}

export default Header;
