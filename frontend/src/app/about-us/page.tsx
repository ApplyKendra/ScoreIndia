'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
    Target,
    Eye,
    BookOpen,
    Heart,
    ChevronRight,
    Loader2,
    Users,
    Calendar
} from 'lucide-react';

interface AboutUsData {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    mission: string;
    missionImage: string;
    vision: string;
    history: string;
    historyImages: string[];
    founderInfo: string;
    founderImage: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AboutUsPage() {
    const [data, setData] = useState<AboutUsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/pages/about-us`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Content not available</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative min-h-[60vh] overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Animated orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-3xl" />
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium text-white/80">Serving Since 1966</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-4">
                        {data.heroTitle}
                    </h1>
                    {data.heroSubtitle && (
                        <p className="text-xl text-white/70 max-w-2xl">
                            {data.heroSubtitle}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="mt-12 grid grid-cols-3 gap-8">
                        {[
                            { value: '50+', label: 'Years', icon: Calendar },
                            { value: '10K+', label: 'Devotees', icon: Users },
                            { value: '108+', label: 'Temples', icon: Heart },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <stat.icon className="w-6 h-6 text-white/60 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-white/60">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wave separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
                        <path
                            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Mission */}
                        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl p-8 hover:-translate-y-1 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5750F1]/10 to-purple-500/5 rounded-bl-full" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                                    <Target className="h-7 w-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {data.mission || 'To systematically propagate spiritual knowledge to society at large and to educate all people in the techniques of spiritual life.'}
                                </p>
                            </div>
                        </Card>

                        {/* Vision */}
                        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl p-8 hover:-translate-y-1 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-bl-full" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg">
                                    <Eye className="h-7 w-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {data.vision || 'A peaceful and prosperous world through spiritual enlightenment and Krishna consciousness.'}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* History */}
            {data.history && (
                <section className="py-16 px-4 bg-white dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our History</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                    {data.history}
                                </p>
                            </div>

                            {data.historyImages && data.historyImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-4">
                                    {data.historyImages.slice(0, 4).map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group">
                                            <Image
                                                src={img}
                                                alt={`History ${idx + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Founder */}
            {data.founderInfo && (
                <section className="py-16 px-4">
                    <div className="mx-auto max-w-5xl">
                        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-8 md:p-12">
                            {/* Decorative orbs */}
                            <div className="absolute top-[-10%] right-[-5%] w-64 h-64 rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl" />
                            <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 blur-2xl" />

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                {data.founderImage && (
                                    <div className="flex justify-center">
                                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                                            <Image
                                                src={data.founderImage}
                                                alt="Srila Prabhupada"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className={data.founderImage ? 'md:col-span-2' : 'md:col-span-3'}>
                                    <h2 className="text-2xl font-bold text-white mb-4">Our Founder Acharya</h2>
                                    <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                        {data.founderInfo}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>
            )}

            {/* ISKCON Principles */}
            <section className="py-16 px-4 bg-gray-100 dark:bg-gray-900/50">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        Seven Purposes of ISKCON
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            'To systematically propagate spiritual knowledge',
                            'To propagate a consciousness of Krishna',
                            'To bring members closer together and closer to Krishna',
                            'To teach and encourage the sankirtana movement',
                            'To erect for the members a holy place of transcendental pastimes',
                            'To bring members closer together for simple living and high thinking',
                            'To publish and distribute periodicals, magazines, and books',
                        ].map((purpose, idx) => (
                            <Card key={idx} className="p-5 border-0 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#5750F1]/10 flex items-center justify-center flex-shrink-0">
                                        <ChevronRight className="w-4 h-4 text-[#5750F1]" />
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {purpose}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
