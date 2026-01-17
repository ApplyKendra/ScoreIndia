'use client';

import { Heart, Hammer, Construction, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DonationsPage() {
    return (
        <div className="min-h-screen pt-20 pb-16 relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5750F1]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto">

                    {/* Icon Badge */}
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#5750F1] to-[#7C3AED] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                        <div className="relative w-24 h-24 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl">
                            <Heart className="w-10 h-10 text-[#5750F1] fill-[#5750F1]/10 animate-pulse-slow" />
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-full border-4 border-white dark:border-gray-800">
                                <Construction className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5750F1]/10 text-[#5750F1] text-sm font-semibold tracking-wide border border-[#5750F1]/20">
                                <Sparkles className="w-4 h-4" />
                                Coming Soon
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                Donations & Seva
                            </h1>
                        </div>

                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto">
                            We are currently building a secure and seamless platform for your contributions. Your support helps us serve the community better.
                        </p>

                        {/* Placeholder Seva Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full text-left opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Link href="/">
                                <Button variant="outline" className="rounded-xl border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                    Return to Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
