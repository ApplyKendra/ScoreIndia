'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Crown,
    Loader2,
    CheckCircle,
    Send,
    Star,
    Heart
} from 'lucide-react';

interface MembershipTier {
    name: string;
    amount: number;
    description: string;
    benefits?: string[];
}

interface NityaSevakPageData {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    description: string;
    benefits: string[];
    membershipTiers: MembershipTier[];
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NityaSevakPage() {
    const [data, setData] = useState<NityaSevakPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
        panNumber: '',
        message: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/pages/nitya-sevak`);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTier) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/pages/nitya-sevak/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    selectedTier: selectedTier.name,
                    amount: selectedTier.amount,
                }),
            });
            if (res.ok) {
                setSubmitted(true);
            }
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    const tiers = data?.membershipTiers || [];
    const benefits = data?.benefits || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative min-h-[50vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl" />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-amber-400/40 animate-pulse"
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + (i % 3) * 20}%`,
                                animationDelay: `${i * 0.3}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm border border-amber-500/30 mb-6">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-200">Life Patron Program</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-4">
                        {data?.heroTitle || 'Become a Nitya Sevak'}
                    </h1>
                    {data?.heroSubtitle && (
                        <p className="text-xl text-white/70 max-w-2xl">
                            {data.heroSubtitle}
                        </p>
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
                        <Crown className="w-12 h-12 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Page Under Construction
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                        Our Nitya Sevak program details are currently being updated. Please check back soon for information on how to become a Life Patron.
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
