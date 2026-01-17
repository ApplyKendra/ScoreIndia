'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Phone,
    Mail,
    MapPin,
    Clock,
    Send,
    Loader2,
    MessageCircle
} from 'lucide-react';

interface ContactUsData {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    address: string;
    phoneNumbers: string[];
    emails: string[];
    mapEmbedUrl: string;
    timings: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ContactUsPage() {
    const [data, setData] = useState<ContactUsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/pages/contact-us`);
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
        setSubmitting(true);
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitted(true);
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative min-h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[40vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white/80">Get in Touch</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        {data?.heroTitle || 'Contact Us'}
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

            {/* Content Section */}
            <section className="py-16 px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Info Cards */}
                        <div className="space-y-6">
                            {/* Address */}
                            <Card className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Address</h3>
                                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                            {data?.address || 'ISKCON Burla, Odisha'}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Phone */}
                            <Card className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Phone className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
                                        <div className="space-y-1">
                                            {(data?.phoneNumbers || ['+91 9876543210']).map((phone, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`tel:${phone}`}
                                                    className="block text-gray-600 dark:text-gray-400 hover:text-[#5750F1] transition-colors"
                                                >
                                                    {phone}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Email */}
                            <Card className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                        <Mail className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
                                        <div className="space-y-1">
                                            {(data?.emails || ['info@iskconburla.org']).map((email, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`mailto:${email}`}
                                                    className="block text-gray-600 dark:text-gray-400 hover:text-[#5750F1] transition-colors"
                                                >
                                                    {email}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Timings */}
                            {data?.timings && (
                                <Card className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Temple Timings</h3>
                                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                                {data.timings}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Contact Form */}
                        <Card className="p-8 border-0 bg-white dark:bg-gray-900 shadow-xl">
                            {submitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                        <Send className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        We have received your message and will get back to you soon.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-[#5750F1]/50 focus:border-[#5750F1] transition-colors"
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-[#5750F1]/50 focus:border-[#5750F1] transition-colors"
                                                    placeholder="+91 9876543210"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-[#5750F1]/50 focus:border-[#5750F1] transition-colors"
                                                placeholder="your@email.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Subject *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-[#5750F1]/50 focus:border-[#5750F1] transition-colors"
                                                placeholder="How can we help?"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Message *</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-[#5750F1]/50 focus:border-[#5750F1] transition-colors resize-none"
                                                placeholder="Your message..."
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-6 text-base font-semibold bg-[#5750F1] hover:bg-[#4a43d6] rounded-xl"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </section>

            {/* Google Maps */}
            {data?.mapEmbedUrl && (
                <section className="py-8 px-4">
                    <div className="mx-auto max-w-7xl">
                        <Card className="overflow-hidden border-0 shadow-xl">
                            <iframe
                                src={data.mapEmbedUrl}
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full"
                            />
                        </Card>
                    </div>
                </section>
            )}
        </div>
    );
}
