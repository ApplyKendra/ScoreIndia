'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Twitter, MapPin, Phone, Mail, Heart } from 'lucide-react';

const footerLinks = {
    services: [
        { href: '/prasadam', label: 'Prasadam Ordering' },
        { href: '/store', label: 'Temple Store' },
        { href: '/youth', label: 'Youth Programs' },
        { href: '/darshan', label: 'Live Darshan' },
        { href: '/events', label: 'Events' },
    ],
    explore: [
        { href: '/about-us', label: 'About Us' },
        { href: '/contact-us', label: 'Contact Us' },
        { href: '/donations', label: 'Donate' },
        { href: '/temple-construction', label: 'Temple Construction' },
        { href: '/seva-opportunities', label: 'Seva Opportunities' },
        { href: '/nitya-sevak', label: 'Nitya Sevak Program' },
    ],
    legal: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/refund', label: 'Refund Policy' },
    ],
};

const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', hoverColor: 'hover:bg-blue-600' },
    { icon: Instagram, href: '#', label: 'Instagram', hoverColor: 'hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500' },
    { icon: Youtube, href: '#', label: 'YouTube', hoverColor: 'hover:bg-red-600' },
    { icon: Twitter, href: '#', label: 'Twitter', hoverColor: 'hover:bg-sky-500' },
];

export function Footer() {
    return (
        <footer className="relative overflow-hidden">
            {/* Main Footer with Dark Gradient Background */}
            <div className="relative bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Floating Orbs */}
                    <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#5750F1]/20 to-purple-600/10 blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-600/10 blur-3xl" />
                    <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 blur-2xl" />

                    {/* Diagonal Lines Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                -45deg,
                                rgba(255,255,255,1) 0px,
                                rgba(255,255,255,1) 1px,
                                transparent 1px,
                                transparent 40px
                            )`,
                        }}
                    />

                    {/* Dot Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
                            backgroundSize: '30px 30px',
                        }}
                    />

                    {/* Floating Particles */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-white/20"
                            style={{
                                left: `${10 + i * 12}%`,
                                top: `${20 + (i % 4) * 20}%`,
                                animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
                                animationDelay: `${i * 0.3}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Wave Top Border */}
                <div className="absolute top-0 left-0 right-0 overflow-hidden h-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#5750F1] via-purple-500 to-cyan-500" />
                </div>

                {/* Content */}
                <div className="relative z-10 container px-3 sm:px-4 pt-10 sm:pt-16 pb-6 sm:pb-8">
                    {/* Main Footer Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
                        {/* Brand */}
                        <div className="col-span-2 lg:col-span-2 space-y-4 sm:space-y-5">
                            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                                <div className="relative h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-[#5750F1] to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-[#5750F1]/30 group-hover:scale-105 transition-transform">
                                    <Image
                                        src="/logo-white.svg"
                                        alt="ISKCON Logo"
                                        width={40}
                                        height={40}
                                        className="h-8 w-8 sm:h-10 sm:w-10"
                                    />
                                </div>
                                <div>
                                    <span className="font-bold text-lg sm:text-xl text-white">ISKCON Burla</span>
                                    <p className="text-[10px] sm:text-xs text-white/50">Digital Temple Platform</p>
                                </div>
                            </Link>
                            <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-md">
                                Spreading the teachings of Lord Krishna and making devotion accessible to everyone.
                            </p>

                            {/* Contact Info - Compact for mobile */}
                            <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-3">
                                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm group hover:text-white transition-colors">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="hidden sm:inline">Near VSS University, Burla</span>
                                    <span className="sm:hidden">Burla, Odisha</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm group hover:text-white transition-colors">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                    <span>+91 87630 25178</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm group hover:text-white transition-colors">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="truncate">info@iskconburla.com</span>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex gap-2 sm:gap-3">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:text-white ${social.hoverColor} transition-all duration-300 hover:scale-110`}
                                    >
                                        <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Services */}
                        <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-bold text-white text-sm sm:text-lg relative inline-block">
                                Services
                                <span className="absolute -bottom-1 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-[#5750F1] to-transparent rounded-full" />
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {footerLinks.services.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-xs sm:text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 group"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-[#5750F1] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Explore */}
                        <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-bold text-white text-sm sm:text-lg relative inline-block">
                                Explore
                                <span className="absolute -bottom-1 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {footerLinks.explore.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-xs sm:text-sm text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 group"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="space-y-3 sm:space-y-4 col-span-2 sm:col-span-1">
                            <h4 className="font-bold text-white text-sm sm:text-lg relative inline-block">
                                Legal
                                <span className="absolute -bottom-1 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
                            </h4>
                            <div className="flex sm:block gap-4 flex-wrap">
                                <ul className="flex sm:block gap-3 sm:gap-0 sm:space-y-2 sm:space-y-3">
                                    {footerLinks.legal.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="text-xs sm:text-sm text-white/60 hover:text-white transition-all duration-200 flex items-center gap-1.5 sm:gap-2 group"
                                            >
                                                <span className="w-1 h-1 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {/* Quick Links */}
                                <div className="sm:pt-4 sm:mt-4 sm:border-t sm:border-white/10">
                                    <Link
                                        href="/donations"
                                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-medium rounded-md sm:rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                                    >
                                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                                        Donate
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-white/10 pt-4 sm:pt-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-white/50 text-[10px] sm:text-sm">
                                <span>© {new Date().getFullYear()} ISKCON Burla</span>
                                <span>|</span>
                                <span className="flex items-center gap-1">
                                    Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" /> for Krishna
                                </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                <p className="text-white/40 text-[10px] sm:text-sm italic hidden xs:block">
                                    Hare Krishna Hare Krishna
                                </p>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center">
                                    <Image
                                        src="/logo-white.svg"
                                        alt="ISKCON"
                                        width={32}
                                        height={32}
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
