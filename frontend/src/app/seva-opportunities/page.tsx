'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Heart,
    Loader2,
    RefreshCw,
    X,
    CheckCircle,
    User,
    Users,
} from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores/auth-store';

interface SevaOpportunity {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    amount: string | null;
    isRecurring: boolean;
    category: string;
    displayOrder: number;
    isActive: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CATEGORIES = ['All', 'Daily', 'Festival', 'Special', 'Monthly', 'Annual'];

export default function SevaOpportunitiesPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [items, setItems] = useState<SevaOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [registering, setRegistering] = useState<string | null>(null);

    // Track user's registered sevas (persisted in localStorage)
    const [registeredSevas, setRegisteredSevas] = useState<Set<string>>(new Set());

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'self' | 'others'>('self');
    const [selectedSeva, setSelectedSeva] = useState<SevaOpportunity | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);

    // Load registered sevas from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('registeredSevas');
        if (saved) {
            try {
                setRegisteredSevas(new Set(JSON.parse(saved)));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save registered sevas to localStorage when changed
    const addRegisteredSeva = (sevaId: string) => {
        const newSet = new Set(registeredSevas);
        newSet.add(sevaId);
        setRegisteredSevas(newSet);
        localStorage.setItem('registeredSevas', JSON.stringify([...newSet]));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/pages/seva`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch (error) {
                console.error('Failed to fetch:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRegisterForSelf = async (seva: SevaOpportunity) => {
        if (!isAuthenticated || !user) {
            // Show form modal for non-logged-in users
            setSelectedSeva(seva);
            setModalType('self');
            setFormData({ name: '', email: '', phone: '' });
            setShowModal(true);
            return;
        }

        // Logged-in user - register automatically
        setRegistering(seva.id);
        try {
            const res = await fetch(`${API_URL}/pages/seva/${seva.id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                }),
            });

            if (res.ok) {
                addRegisteredSeva(seva.id);
            }
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setRegistering(null);
        }
    };

    const handleRegisterForOthers = (seva: SevaOpportunity) => {
        setSelectedSeva(seva);
        setModalType('others');
        setFormData({ name: '', email: '', phone: '' });
        setShowModal(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeva) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/pages/seva/${selectedSeva.id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                // Only mark as registered for self registration
                if (modalType === 'self') {
                    addRegisteredSeva(selectedSeva.id);
                }
            }
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = selectedCategory === 'All'
        ? items
        : items.filter(item => item.category === selectedCategory);

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
            <section className="relative min-h-[50vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 blur-3xl" />
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-medium text-white/80">Serve the Lord</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-4">
                        Seva Opportunities
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl">
                        Participate in various sevas and receive immense spiritual blessings
                    </p>
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

            {/* Category Filter */}
            <section className="py-8 px-4 sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-[#5750F1] text-white shadow-lg shadow-[#5750F1]/30'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Seva Grid */}
            <section className="py-12 px-4">
                <div className="mx-auto max-w-7xl">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-20">
                            <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No seva opportunities available</h3>
                            <p className="text-gray-500 mt-1">Please check back later</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredItems.map((item) => {
                                const isRegistered = registeredSevas.has(item.id);

                                return (
                                    <Card key={item.id} className="group relative overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl">
                                        {/* Image - Larger */}
                                        <div className="relative h-56 bg-gradient-to-br from-orange-500 to-amber-500 overflow-hidden">
                                            {item.imageUrl ? (
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Heart className="w-20 h-20 text-white/30" />
                                                </div>
                                            )}
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                            {/* Category & Recurring Badges */}
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="px-3 py-1.5 bg-white/95 text-gray-800 text-xs font-semibold rounded-full shadow-lg">
                                                    {item.category}
                                                </span>
                                                {item.isRecurring && (
                                                    <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
                                                        <RefreshCw className="w-3 h-3" />
                                                        Recurring
                                                    </span>
                                                )}
                                            </div>

                                            {/* Amount Badge */}
                                            {item.amount && (
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="text-3xl font-bold text-white drop-shadow-lg">
                                                        ₹{Number(item.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#5750F1] transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-5 leading-relaxed">
                                                {item.description}
                                            </p>

                                            {/* Registered State */}
                                            {isRegistered ? (
                                                <div className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Registered
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleRegisterForSelf(item)}
                                                        disabled={registering === item.id}
                                                        className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6] rounded-xl py-5 text-sm font-semibold"
                                                    >
                                                        {registering === item.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <User className="w-4 h-4 mr-1.5" />
                                                                For Yourself
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleRegisterForOthers(item)}
                                                        variant="outline"
                                                        className="flex-1 border-[#5750F1] text-[#5750F1] hover:bg-[#5750F1]/10 rounded-xl py-5 text-sm font-semibold"
                                                    >
                                                        <Users className="w-4 h-4 mr-1.5" />
                                                        For Others
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section className="py-16 px-4 bg-white dark:bg-gray-900">
                <div className="mx-auto max-w-5xl">
                    <Card className="relative overflow-hidden p-10 border-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-bl-full" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Why Participate in Seva?
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Spiritual Benefits</h3>
                                    <p className="text-sm leading-relaxed">
                                        Service to the Lord and His devotees purifies the heart and brings one closer to Krishna consciousness.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Support Temple Activities</h3>
                                    <p className="text-sm leading-relaxed">
                                        Your contributions help maintain daily worship, festivals, prasadam distribution, and outreach programs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Registration Modal */}
            {showModal && selectedSeva && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 bg-gradient-to-r from-[#5750F1] to-[#867EF9]">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {modalType === 'self' ? 'Register for Yourself' : 'Register for Someone Else'}
                                </h2>
                                <p className="text-sm text-white/80">{selectedSeva.title}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowModal(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="text-center mb-4">
                                {modalType === 'self' ? (
                                    <User className="w-12 h-12 mx-auto text-[#5750F1] mb-2" />
                                ) : (
                                    <Users className="w-12 h-12 mx-auto text-[#5750F1] mb-2" />
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {modalType === 'self'
                                        ? 'Enter your details to register for this seva'
                                        : 'Enter the details of the person you are registering'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-[#5750F1] focus:border-transparent transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-[#5750F1] focus:border-transparent transition-all"
                                    placeholder="Enter email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Phone *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-[#5750F1] focus:border-transparent transition-all"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-6 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6] py-6 rounded-xl"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Register'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
