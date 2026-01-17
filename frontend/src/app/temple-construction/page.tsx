'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Building2,
    Target,
    CheckCircle,
    Clock,
    Circle,
    Heart,
    Loader2,
    ExternalLink
} from 'lucide-react';

interface Phase {
    name: string;
    description: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
}

interface TempleConstructionData {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    projectDescription: string;
    targetAmount: string | null;
    raisedAmount: string | null;
    progressImages: string[];
    phases: Phase[];
    donationLink: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TempleConstructionPage() {
    const [data, setData] = useState<TempleConstructionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/pages/temple-construction`);
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

    const targetAmount = data?.targetAmount ? Number(data.targetAmount) : 0;
    const raisedAmount = data?.raisedAmount ? Number(data.raisedAmount) : 0;
    const progressPercentage = targetAmount > 0 ? Math.min(100, (raisedAmount / targetAmount) * 100) : 0;

    const sortedPhases = data?.phases ? [...data.phases].sort((a, b) => a.order - b.order) : [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative min-h-[60vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl" />
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-white/80">Building for Krishna</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-4">
                        {data?.heroTitle || 'New Temple Construction'}
                    </h1>
                    {data?.heroSubtitle && (
                        <p className="text-xl text-white/70 max-w-2xl mb-8">
                            {data.heroSubtitle}
                        </p>
                    )}

                    {data?.donationLink && (
                        <Link href={data.donationLink} target="_blank">
                            <Button className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                                <Heart className="w-5 h-5 mr-2" />
                                Donate Now
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
                        <path
                            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* Under Construction Message */}
            <section className="py-20 px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Page Under Construction
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                        We are currently updating our Temple Construction details. Please check back soon for updates.
                    </p>
                    <Link href="/">
                        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                            Return to Home
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
