'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Calendar, MapPin, Users, Clock, ArrowRight, Star, Sparkles,
    ChevronRight, PartyPopper, Filter, Search, Heart, Loader2, X,
    CalendarDays, Timer, Ticket, TrendingUp, User
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { youthApi, type YouthEvent } from '@/lib/api/youth';
import { useAuthStore } from '@/lib/stores/auth-store';

// Event Stats
const eventStats = [
    { icon: Calendar, value: '50+', label: 'Events/Year', color: 'from-[#5750F1] to-purple-600' },
    { icon: Users, value: '500+', label: 'Participants', color: 'from-cyan-500 to-blue-500' },
    { icon: Heart, value: '100%', label: 'Free Entry', color: 'from-rose-500 to-pink-500' },
    { icon: Star, value: '4.9', label: 'Rating', color: 'from-amber-500 to-orange-500' },
];

const statusColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    UPCOMING: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    ONGOING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
};

export default function EventsPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [events, setEvents] = useState<YouthEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<YouthEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<YouthEvent | null>(null);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [regForm, setRegForm] = useState({
        phone: '',
        emergencyContact: '',
        dietaryReq: '',
    });
    const [guestForm, setGuestForm] = useState({
        guestName: '',
        guestEmail: '',
        phone: '',
        emergencyContact: '',
        dietaryReq: '',
    });
    const [registering, setRegistering] = useState(false);
    const [myRegistrations, setMyRegistrations] = useState<string[]>([]); // Array of event IDs user is registered for

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await youthApi.getEvents();
                setEvents(data);
                setFilteredEvents(data);
            } catch (error) {
                console.error('Failed to fetch events:', error);
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Fetch user's registrations when authenticated
    useEffect(() => {
        const fetchMyRegistrations = async () => {
            if (isAuthenticated) {
                try {
                    const regs = await youthApi.getMyRegistrations();
                    setMyRegistrations(regs.map(r => r.eventId));
                } catch (error) {
                    console.error('Failed to fetch user registrations:', error);
                }
            }
        };
        fetchMyRegistrations();
    }, [isAuthenticated]);

    useEffect(() => {
        let filtered = [...events];

        // Apply status filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(e => e.status.toLowerCase() === activeFilter);
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query) ||
                e.location.toLowerCase().includes(query)
            );
        }

        setFilteredEvents(filtered);
    }, [events, activeFilter, searchQuery]);

    // Calculate total joined count (preJoinedCount + actual registrations)
    const getTotalJoined = (event: YouthEvent) => {
        const preJoined = event.preJoinedCount || 0;
        const actualRegistrations = event._count?.registrations || 0;
        return preJoined + actualRegistrations;
    };

    // Show registration options modal
    const handleRegisterClick = (event: YouthEvent) => {
        setSelectedEvent(event);
        setShowGuestForm(false);
        setGuestForm({ guestName: '', guestEmail: '', phone: '', emergencyContact: '', dietaryReq: '' });
        setRegisterDialogOpen(true);
    };

    // Quick self-registration for logged-in users
    const handleSelfRegister = async () => {
        if (!selectedEvent) return;

        if (!isAuthenticated) {
            toast.error('Please login to register for yourself');
            router.push(`/login?redirect=/events`);
            return;
        }

        setRegistering(true);
        try {
            await youthApi.registerForEvent(selectedEvent.id, {
                phone: user?.phone || '',
                emergencyContact: '',
                dietaryReq: ''
            });
            toast.success(`Successfully registered for "${selectedEvent.title}"!`);
            setRegisterDialogOpen(false);
            // Add to user's registrations list
            setMyRegistrations(prev => [...prev, selectedEvent.id]);
            // Refresh events to update counts
            const data = await youthApi.getEvents();
            setEvents(data);
            setFilteredEvents(data.filter((e: YouthEvent) =>
                activeFilter === 'all' || e.status.toLowerCase() === activeFilter
            ));
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.info('You are already registered for this event');
            } else {
                toast.error(error.response?.data?.message || 'Failed to register');
            }
        } finally {
            setRegistering(false);
        }
    };

    // Guest registration (register for someone else)
    const handleGuestRegister = async () => {
        if (!selectedEvent) return;

        if (!guestForm.guestName || !guestForm.guestEmail || !guestForm.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        setRegistering(true);
        try {
            await youthApi.guestRegisterForEvent(selectedEvent.id, guestForm);
            toast.success(`Successfully registered ${guestForm.guestName} for "${selectedEvent.title}"!`);
            setRegisterDialogOpen(false);
            setShowGuestForm(false);
            setGuestForm({ guestName: '', guestEmail: '', phone: '', emergencyContact: '', dietaryReq: '' });
            // Refresh events
            const data = await youthApi.getEvents();
            setEvents(data);
            setFilteredEvents(data.filter((e: YouthEvent) =>
                activeFilter === 'all' || e.status.toLowerCase() === activeFilter
            ));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to register');
        } finally {
            setRegistering(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatShortDate = (date: string) => {
        const d = new Date(date);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('en-IN', { month: 'short' }),
        };
    };

    const getDaysUntil = (date: string) => {
        const eventDate = new Date(date);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Past';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `${diffDays} days`;
    };

    const featuredEvents = events.filter(e => e.isFeatured && e.status === 'UPCOMING');
    const upcomingCount = events.filter(e => e.status === 'UPCOMING').length;

    // Check if user is registered for an event
    const isRegisteredForEvent = (eventId: string) => myRegistrations.includes(eventId);

    // Get event status based on actual date (for display badge)
    const getEventStatusByDate = (event: YouthEvent) => {
        const now = new Date();
        const eventDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : eventDate;

        // Set both dates to midnight for fair comparison
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        if (todayStart > eventEnd) {
            return { status: 'PAST', color: 'bg-gray-500', label: 'Past' };
        } else if (todayStart >= eventStart && todayStart <= eventEnd) {
            return { status: 'ONGOING', color: 'bg-green-500', label: 'Ongoing' };
        } else {
            return { status: 'UPCOMING', color: 'bg-blue-500', label: 'Upcoming' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-[#5750F1]/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-[#5750F1] border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-[#5750F1]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-white font-medium">Loading events...</p>
                        <p className="text-white/60 text-sm mt-1">Preparing exciting experiences</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

            {/* === HERO SECTION === */}
            <section className="relative bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#5750F1]/40 to-purple-600/20 blur-3xl animate-orb-1" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/20 blur-3xl animate-orb-2" />
                    <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/10 blur-2xl animate-orb-3" />

                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px',
                        }}
                    />

                    {/* Floating Particles */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-white/20 animate-particle-float"
                            style={{
                                left: `${10 + i * 12}%`,
                                top: `${20 + (i % 3) * 25}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: `${4 + i * 0.5}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                            <PartyPopper className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-white">{upcomingCount} Upcoming Events</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
                            Temple
                            <span className="block mt-2 relative">
                                <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
                                    Events & Festivals
                                </span>
                                <span
                                    className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-400/50 via-white/30 to-pink-400/50 opacity-70"
                                    aria-hidden="true"
                                />
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
                            Join us for spiritual gatherings, festivals, and community events.
                            Experience the joy of devotion together with the ISKCON community.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-lg mx-auto mb-10">
                            <div className="relative flex items-center">
                                <Search className="absolute left-5 w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Search events, festivals, programs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-14 pr-14 py-6 rounded-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#5750F1] text-base"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-3"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
                            {eventStats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.label}
                                        className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-3 sm:p-4 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color}`} />
                                        <div className="relative z-10">
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/60 mx-auto mb-2" />
                                            <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-[10px] sm:text-xs text-white/60">{stat.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
                        <path
                            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* === MAIN CONTENT === */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

                {/* Featured Events */}
                {featuredEvents.length > 0 && (
                    <section className="mb-12 sm:mb-16">
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center shadow-lg shadow-[#5750F1]/30">
                                <Star className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Featured Events</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Don't miss these special occasions</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {featuredEvents.slice(0, 2).map((event) => {
                                const dateInfo = formatShortDate(event.date);
                                return (
                                    <Card
                                        key={event.id}
                                        className="group overflow-hidden bg-white dark:bg-gray-900 border-2 border-[#5750F1]/20 hover:border-[#5750F1]/50 hover:shadow-2xl hover:shadow-[#5750F1]/20 transition-all duration-500 hover:-translate-y-1"
                                    >
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Image */}
                                            <div className="relative w-full sm:w-56 h-48 sm:h-auto flex-shrink-0">
                                                {event.imageUrl ? (
                                                    <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center">
                                                        <Calendar className="w-16 h-16 text-white/30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                                                        <Star className="w-3 h-3 mr-1 fill-white" />
                                                        Featured
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <CardContent className="flex-1 p-5 sm:p-6">
                                                <div className="flex items-start gap-4">
                                                    {/* Date Box */}
                                                    <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#5750F1] to-purple-600 text-white flex-shrink-0 shadow-lg">
                                                        <span className="text-2xl font-bold">{dateInfo.day}</span>
                                                        <span className="text-xs uppercase">{dateInfo.month}</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-2 group-hover:text-[#5750F1] transition-colors">
                                                            {event.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{event.description}</p>

                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4 text-[#5750F1]" />
                                                                {event.location}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4 text-[#5750F1]" />
                                                                {getDaysUntil(event.date)}
                                                            </div>
                                                            {event._count && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users className="w-4 h-4 text-[#5750F1]" />
                                                                    {getTotalJoined(event)} joined
                                                                </div>
                                                            )}
                                                        </div>

                                                        {isRegisteredForEvent(event.id) ? (
                                                            <Button
                                                                disabled
                                                                className="bg-green-600 hover:bg-green-600 cursor-default"
                                                            >
                                                                ✓ Registered
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleRegisterClick(event)}
                                                                className="bg-[#5750F1] hover:bg-[#4a43d6] shadow-lg shadow-[#5750F1]/30"
                                                            >
                                                                Register Now
                                                                <ArrowRight className="w-4 h-4 ml-2" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Filter Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-[#5750F1]" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((filter) => (
                                <Button
                                    key={filter}
                                    variant={activeFilter === filter ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveFilter(filter)}
                                    className={activeFilter === filter
                                        ? 'bg-[#5750F1] hover:bg-[#4a43d6] shadow-lg shadow-[#5750F1]/30'
                                        : 'hover:border-[#5750F1] hover:text-[#5750F1]'
                                    }
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[#5750F1] border-[#5750F1]/30 bg-[#5750F1]/5">
                        {filteredEvents.length} events found
                    </Badge>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#5750F1]/10 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-[#5750F1]" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Events Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Check back soon for upcoming events'}
                        </p>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                                className="border-[#5750F1] text-[#5750F1] hover:bg-[#5750F1] hover:text-white"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredEvents.map((event) => {
                            const dateInfo = formatShortDate(event.date);
                            const isHovered = hoveredEvent === event.id;
                            const eventStatus = getEventStatusByDate(event);
                            const isUpcoming = eventStatus.status === 'UPCOMING';
                            const userRegistered = isRegisteredForEvent(event.id);

                            return (
                                <div
                                    key={event.id}
                                    className={`group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${isHovered
                                        ? 'shadow-2xl -translate-y-1 scale-[1.02]'
                                        : 'shadow-md hover:shadow-lg'
                                        }`}
                                    onMouseEnter={() => setHoveredEvent(event.id)}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                    onClick={() => isUpcoming && handleRegisterClick(event)}
                                >
                                    {/* Main Card Layout */}
                                    <div className="flex">
                                        {/* Left Date Accent */}
                                        <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-6 ${isUpcoming
                                            ? 'bg-gradient-to-b from-[#5750F1] to-[#7C3AED]'
                                            : event.status === 'ONGOING'
                                                ? 'bg-gradient-to-b from-blue-500 to-blue-600'
                                                : 'bg-gradient-to-b from-gray-400 to-gray-500'
                                            }`}>
                                            <span className="text-3xl font-bold text-white">{dateInfo.day}</span>
                                            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{dateInfo.month}</span>
                                            <div className="mt-2 px-2 py-0.5 bg-white/20 rounded-full">
                                                <span className="text-[10px] text-white font-medium">{getDaysUntil(event.date)}</span>
                                            </div>
                                        </div>

                                        {/* Right Content */}
                                        <div className="flex-1 p-5 flex flex-col">
                                            {/* Top Row - Badges */}
                                            <div className="flex items-center gap-2 mb-3">
                                                {event.isFeatured && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                        <Star className="w-2.5 h-2.5 mr-1 fill-amber-500" />
                                                        Featured
                                                    </span>
                                                )}
                                                {(!event.registrationFee || event.registrationFee === 0) && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                                        Free
                                                    </span>
                                                )}
                                                <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${eventStatus.status === 'UPCOMING'
                                                    ? 'bg-[#5750F1]/10 text-[#5750F1]'
                                                    : eventStatus.status === 'ONGOING'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {eventStatus.label}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className={`font-semibold text-base leading-snug mb-2 line-clamp-2 transition-colors ${isHovered ? 'text-[#5750F1]' : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {event.title}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                {event.description}
                                            </p>

                                            {/* Bottom Info */}
                                            <div className="mt-auto space-y-2">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                        <Clock className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                                        <span>{formatDate(event.date)}</span>
                                                    </div>
                                                    {event.registrationFee && event.registrationFee > 0 && (
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            ₹{event.registrationFee}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Action Bar */}
                                    <div className={`px-5 py-3 border-t transition-colors ${isHovered
                                        ? 'bg-[#5750F1]/5 border-[#5750F1]/20'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            {event.maxParticipants ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5">
                                                        {[...Array(Math.min(3, getTotalJoined(event) || 1))].map((_, i) => (
                                                            <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-[#5750F1] to-purple-600 border-2 border-white dark:border-gray-900" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {getTotalJoined(event)}/{event.maxParticipants} joined
                                                    </span>
                                                </div>
                                            ) : getTotalJoined(event) > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5">
                                                        {[...Array(Math.min(3, getTotalJoined(event)))].map((_, i) => (
                                                            <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-[#5750F1] to-purple-600 border-2 border-white dark:border-gray-900" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {getTotalJoined(event)} joined
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">Open for all</span>
                                            )}

                                            <button
                                                className={`inline-flex items-center text-sm font-medium transition-colors ${userRegistered
                                                    ? 'text-green-600'
                                                    : isUpcoming
                                                        ? 'text-[#5750F1] group-hover:text-[#4a43d6]'
                                                        : 'text-gray-400 cursor-not-allowed'
                                                    }`}
                                                disabled={!isUpcoming || userRegistered}
                                            >
                                                {userRegistered ? '✓ Registered' : isUpcoming ? 'Register' : 'Closed'}
                                                {!userRegistered && <ChevronRight className={`w-4 h-4 ml-0.5 transition-transform ${isHovered && isUpcoming ? 'translate-x-1' : ''}`} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* === CTA SECTION === */}
            <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-8 sm:p-12 lg:p-16">
                        {/* Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#5750F1]/30 blur-3xl animate-orb-1" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-cyan-500/20 blur-3xl animate-orb-2" />
                        </div>

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-white">Stay Connected</span>
                            </div>

                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                Never Miss an Event
                            </h3>
                            <p className="text-white/70 max-w-lg mx-auto mb-8 text-lg">
                                Join our community to receive updates about upcoming festivals, programs, and spiritual gatherings.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register">
                                    <Button size="lg" className="w-full sm:w-auto px-8 py-6 font-semibold bg-white text-[#5750F1] hover:bg-gray-100 rounded-xl shadow-xl">
                                        <Users className="w-5 h-5 mr-2" />
                                        Join Community
                                    </Button>
                                </Link>
                                <Link href="/youth">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl">
                                        <Heart className="w-5 h-5 mr-2" />
                                        Youth Forum
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === QUOTE SECTION === */}
            <section className="py-12 sm:py-16 bg-[#5750F1]/5 border-t border-[#5750F1]/10">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5750F1]/10 mb-6">
                        <Sparkles className="w-6 h-6 text-[#5750F1]" />
                    </div>
                    <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium italic text-gray-700 dark:text-gray-300 leading-relaxed">
                        "When great souls congregate to chant the holy names, the entire atmosphere becomes purified and spiritually nourishing."
                    </blockquote>
                    <p className="mt-6 text-[#5750F1] font-semibold text-lg">— Sri Chaitanya Mahaprabhu</p>
                </div>
            </section>

            {/* Registration Dialog */}
            <Dialog open={registerDialogOpen} onOpenChange={(open) => {
                setRegisterDialogOpen(open);
                if (!open) setShowGuestForm(false);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Register for Event</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Event Info */}
                    <div className="p-4 bg-[#5750F1]/5 rounded-xl border border-[#5750F1]/20">
                        <div className="flex items-center gap-2 text-sm text-[#5750F1]">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{selectedEvent && formatDate(selectedEvent.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <MapPin className="w-4 h-4 text-[#5750F1]" />
                            <span>{selectedEvent?.location}</span>
                        </div>
                    </div>

                    {!showGuestForm ? (
                        /* Option Selection */
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-gray-500 text-center">How would you like to register?</p>

                            {/* Register for yourself */}
                            <Button
                                onClick={handleSelfRegister}
                                disabled={registering}
                                className="w-full h-14 bg-[#5750F1] hover:bg-[#4a43d6] text-white rounded-xl shadow-lg shadow-[#5750F1]/25"
                            >
                                {registering ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <User className="h-5 w-5 mr-2" />
                                )}
                                Register for Yourself
                            </Button>

                            {/* Register for someone else */}
                            <Button
                                variant="outline"
                                onClick={() => setShowGuestForm(true)}
                                disabled={registering}
                                className="w-full h-14 border-2 border-gray-200 dark:border-gray-700 hover:border-[#5750F1] rounded-xl"
                            >
                                <Users className="h-5 w-5 mr-2" />
                                Register for Someone Else
                            </Button>

                            {selectedEvent?.registrationFee ? (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg text-sm border border-amber-200 dark:border-amber-800">
                                    <strong>Note:</strong> Registration fee of ₹{selectedEvent.registrationFee} is payable at the venue.
                                </div>
                            ) : (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800">
                                    <strong>Free Entry!</strong> No registration fee required.
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Guest Registration Form */
                        <div className="space-y-4 py-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowGuestForm(false)}
                                    className="h-8 px-2"
                                >
                                    <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
                                    Back
                                </Button>
                                <span className="text-sm font-medium">Register Someone Else</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guestName">Full Name *</Label>
                                <Input
                                    id="guestName"
                                    value={guestForm.guestName}
                                    onChange={(e) => setGuestForm({ ...guestForm, guestName: e.target.value })}
                                    placeholder="Enter full name"
                                    className="focus-visible:ring-[#5750F1]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestEmail">Email Address *</Label>
                                <Input
                                    id="guestEmail"
                                    type="email"
                                    value={guestForm.guestEmail}
                                    onChange={(e) => setGuestForm({ ...guestForm, guestEmail: e.target.value })}
                                    placeholder="Enter email address"
                                    className="focus-visible:ring-[#5750F1]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestPhone">Phone Number *</Label>
                                <Input
                                    id="guestPhone"
                                    value={guestForm.phone}
                                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                    className="focus-visible:ring-[#5750F1]"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button variant="outline" onClick={() => setShowGuestForm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleGuestRegister}
                                    disabled={registering}
                                    className="bg-[#5750F1] hover:bg-[#4a43d6]"
                                >
                                    {registering && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Register
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
