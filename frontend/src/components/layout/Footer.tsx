'use client';

import Link from 'next/link';
import { Gavel, Mail, Heart } from 'lucide-react';

const footerLinks = {
    quickLinks: [
        { href: '/', label: 'Home' },
        { href: '/auctions', label: 'Live Auction' },
        { href: '/login', label: 'Team Owners Log-in' },
    ],
    features: [
        { label: 'Player Pool' },
        { label: 'Team Management' },
        { label: 'Bid History' },
        { label: 'Budget Tracking' },
    ],
};

export function Footer() {
    return (
        <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            {/* Top Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />

            {/* Content */}
            <div className="relative z-10 container px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1 space-y-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="text-3xl font-extrabold logo-gradient-text-static">
                                ScoreIndia
                            </span>
                        </Link>
                        <p className="text-white/60 text-sm leading-relaxed max-w-md">
                            Want to host your own auction? Contact us and we'll handle everything and host a professional cricket auction for your tournament.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-sm relative inline-block">
                            Features
                            <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
                        </h4>
                        <ul className="space-y-3">
                            {footerLinks.features.map((item) => (
                                <li key={item.label}>
                                    <span className="text-sm text-white/60 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-cyan-500" />
                                        {item.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4 col-span-2 lg:col-span-1">
                        <h4 className="font-bold text-white text-sm relative inline-block">
                            Contact
                            <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
                        </h4>
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span>admin@scoreIndia.cloud</span>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/auctions"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                            >
                                <Gavel className="w-4 h-4" />
                                Join Auction
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-2">
                            <div className="flex flex-col sm:flex-row items-center gap-2 text-white/50 text-xs sm:text-sm">
                                <span>© {new Date().getFullYear()} ScoreIndia</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                    Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" /> for Cricket
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                                <span className="text-white/40 text-xs sm:text-sm text-center sm:text-left">Premium Player Auction Platform</span>
                                <span className="text-sm sm:text-base font-bold logo-gradient-text-static">
                                    ScoreIndia
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
