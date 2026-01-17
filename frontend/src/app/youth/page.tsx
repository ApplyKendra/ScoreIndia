'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MapPin, Users, ArrowRight, Loader2, Search, Star, Clock, Heart, Sparkles, ChevronRight, CheckCircle2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
import { youthApi, YouthEvent } from '@/lib/api/youth';
import { useAuthStore } from '@/lib/stores/auth-store';

// Community stats highlights
const communityStats = [
    { icon: Users, value: '500+', label: 'Active Members', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { icon: Calendar, value: '50+', label: 'Events/Year', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { icon: Heart, value: '100%', label: 'Pure Veg', color: 'text-rose-600', bg: 'bg-rose-100' },
    { icon: Zap, value: '24/7', label: 'Support', color: 'text-amber-600', bg: 'bg-amber-100' },
];

// Status badge colors
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    UPCOMING: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ONGOING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function YouthPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [events, setEvents] = useState<YouthEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<YouthEvent | null>(null);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [regForm, setRegForm] = useState({
        phone: '',
        emergencyContact: '',
        dietaryReq: '',
    });
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await youthApi.getEvents();
                setEvents(data);
            } catch (error) {
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const featuredEvent = events.find(e => e.isFeatured && e.status === 'UPCOMING') || events.find(e => e.status === 'UPCOMING');

    const handleRegisterClick = (event: YouthEvent) => {
        if (!isAuthenticated) {
            toast.error('Please login to register for events');
            router.push(`/login?redirect=/youth`);
            return;
        }
        setSelectedEvent(event);
        setRegForm({
            phone: user?.phone || '',
            emergencyContact: '',
            dietaryReq: '',
        });
        setRegisterDialogOpen(true);
    };

    const handleRegisterSubmit = async () => {
        if (!selectedEvent) return;

        if (!regForm.phone) {
            toast.error('Phone number is required');
            return;
        }

        setRegistering(true);
        try {
            await youthApi.registerForEvent(selectedEvent.id, regForm);
            toast.success('Successfully registered for event!');
            setRegisterDialogOpen(false);
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

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Users className="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-800 font-medium">Loading youth forum...</p>
                        <p className="text-gray-500 text-sm mt-1">Preparing exciting events</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 text-gray-900">

            {/* === HERO SECTION === */}
            <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0" aria-hidden>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InlvdXRoIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xMikiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjeW91dGgpIi8+PC9zdmc+')] opacity-60" />
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                        {/* Left Side - Content */}
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span className="text-xs sm:text-sm font-medium text-white">Youth Community</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white mb-4 sm:mb-6">
                                ISKCON
                                <span className="block mt-2 text-yellow-300">
                                    Youth Forum
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                                Empowering youth with spiritual wisdom, positive lifestyle, and a vibrant community. Join us for exciting events and grow together!
                            </p>

                            {/* Search Bar */}
                            <div className="relative max-w-md mx-auto lg:mx-0 mb-6 sm:mb-8">
                                <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                                    <Search className="ml-4 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search events..."
                                        className="h-12 sm:h-14 bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => setSearchQuery('')}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Community Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-lg mx-auto lg:mx-0">
                                {communityStats.map((stat) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={stat.label} className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                            <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-[10px] sm:text-xs text-white/70">{stat.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side - Featured Event Card */}
                        {featuredEvent && (
                            <div className="relative flex items-center justify-center">
                                <div className="relative w-full max-w-md">
                                    <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-2xl">
                                        {/* Event Image */}
                                        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-emerald-100 to-teal-100">
                                            {featuredEvent.imageUrl ? (
                                                <Image
                                                    src={featuredEvent.imageUrl}
                                                    alt={featuredEvent.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                                                        <Calendar className="w-10 h-10 text-emerald-600" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-yellow-400 text-yellow-900 border-0 font-semibold">
                                                    <Star className="w-3 h-3 mr-1 fill-yellow-900" />
                                                    Featured
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 sm:p-6">
                                            <Badge className={`${statusColors[featuredEvent.status].bg} ${statusColors[featuredEvent.status].text} ${statusColors[featuredEvent.status].border} mb-3`}>
                                                {featuredEvent.status}
                                            </Badge>

                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{featuredEvent.title}</h3>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                                    <span>{formatDate(featuredEvent.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                    <span>{featuredEvent.location}</span>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{featuredEvent.description}</p>

                                            <div className="flex items-center justify-between">
                                                {featuredEvent.registrationFee === 0 || !featuredEvent.registrationFee ? (
                                                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">Free Entry</Badge>
                                                ) : (
                                                    <span className="font-bold text-lg text-emerald-600">₹{featuredEvent.registrationFee}</span>
                                                )}

                                                <Button
                                                    onClick={() => handleRegisterClick(featuredEvent)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    disabled={featuredEvent.status !== 'UPCOMING'}
                                                >
                                                    Register Now
                                                    <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating decorations */}
                                    <div className="absolute -left-4 top-20 bg-white rounded-xl border border-gray-200 p-3 shadow-lg hidden sm:block">
                                        <Heart className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div className="absolute -right-4 bottom-32 bg-white rounded-xl border border-gray-200 p-3 shadow-lg hidden sm:block">
                                        <Zap className="w-6 h-6 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 sm:h-12">
                        <path d="M0,40 C320,80 420,0 720,40 C1020,80 1120,0 1440,40 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M0,50 C360,90 540,10 720,50 C900,90 1080,10 1440,50 L1440,60 L0,60 Z" fill="white" className="fill-emerald-50/50 dark:fill-gray-900" />
                    </svg>
                </div>
            </section>

            {/* === EVENTS GRID === */}
            <section className="py-10 sm:py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Events</h2>
                            <p className="text-gray-500 mt-1">{filteredEvents.filter(e => e.status === 'UPCOMING').length} events available</p>
                        </div>
                        {isAuthenticated && (
                            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                                <Calendar className="w-4 h-4 mr-2" />
                                My Registrations
                            </Button>
                        )}
                    </div>

                    {/* Events Grid */}
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-16 sm:py-20">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No events found</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto px-4">
                                {searchQuery ? 'Try adjusting your search.' : 'Stay tuned for upcoming events!'}
                            </p>
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery('')} className="border-emerald-300 text-emerald-700">
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredEvents.map((event) => {
                                const isHovered = hoveredEvent === event.id;
                                const status = statusColors[event.status];

                                return (
                                    <div
                                        key={event.id}
                                        className="group"
                                        onMouseEnter={() => setHoveredEvent(event.id)}
                                        onMouseLeave={() => setHoveredEvent(null)}
                                    >
                                        <Card className={`h-full overflow-hidden transition-all duration-300 border-2 ${isHovered
                                                ? 'border-emerald-400 shadow-xl shadow-emerald-100 -translate-y-1 sm:-translate-y-2'
                                                : 'border-gray-100 shadow-sm'
                                            }`}>
                                            {/* Top accent bar */}
                                            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                                            {/* Image */}
                                            <div className="relative h-36 sm:h-44 bg-gradient-to-br from-emerald-100 to-teal-100">
                                                {event.imageUrl ? (
                                                    <Image
                                                        src={event.imageUrl}
                                                        alt={event.title}
                                                        fill
                                                        className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className={`w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
                                                            <Calendar className="w-8 h-8 text-emerald-600" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Status & Free badges */}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <Badge className={`${status.bg} ${status.text} border ${status.border} text-xs`}>
                                                        {event.status}
                                                    </Badge>
                                                </div>

                                                {(event.registrationFee === 0 || !event.registrationFee) && (
                                                    <div className="absolute top-3 right-3">
                                                        <Badge className="bg-emerald-500 text-white border-0 text-xs">Free</Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader className="p-4 pb-2">
                                                <h3 className={`font-bold text-lg line-clamp-1 transition-colors ${isHovered ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                    {event.title}
                                                </h3>
                                            </CardHeader>

                                            <CardContent className="p-4 pt-0 space-y-3">
                                                <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                        <span>{formatDate(event.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                    {event.maxParticipants && (
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                            <span>Limited: {event.maxParticipants} seats</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>

                                            <CardFooter className="p-4 pt-0">
                                                <Button
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleRegisterClick(event)}
                                                    disabled={event.status !== 'UPCOMING'}
                                                >
                                                    {event.status === 'UPCOMING' ? 'Register Now' : 'Event Closed'}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* === CTA SECTION === */}
            <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl" />

                        <div className="relative z-10">
                            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white/80 mx-auto mb-4" />
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
                                Join Our Youth Community
                            </h3>
                            <p className="text-white/80 max-w-lg mx-auto mb-6 sm:mb-8 text-sm sm:text-base">
                                Connect with like-minded youth, participate in exciting events, and grow spiritually together. Be part of something meaningful!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl shadow-xl">
                                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Join Community
                                </Button>
                                <a href="/">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl">
                                        Explore Temple
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === FOOTER QUOTE === */}
            <section className="py-10 sm:py-12 bg-emerald-50/50 border-t border-emerald-100">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium italic text-gray-700 leading-relaxed">
                        "The youth of today are the leaders of tomorrow. By engaging in spiritual activities, they can transform their lives and society."
                    </blockquote>
                    <p className="mt-4 text-emerald-700 font-semibold">— Srila Prabhupada</p>
                </div>
            </section>

            {/* Registration Dialog */}
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Register for Event</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-2 text-sm text-emerald-700">
                                <Calendar className="w-4 h-4" />
                                <span>{selectedEvent && formatDate(selectedEvent.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-emerald-700 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{selectedEvent?.location}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={regForm.phone}
                                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                                placeholder="Required for updates"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergency">Emergency Contact (Optional)</Label>
                            <Input
                                id="emergency"
                                value={regForm.emergencyContact}
                                onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
                                placeholder="Name & Phone"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dietary">Dietary Requirements (Optional)</Label>
                            <Textarea
                                id="dietary"
                                value={regForm.dietaryReq}
                                onChange={(e) => setRegForm({ ...regForm, dietaryReq: e.target.value })}
                                placeholder="Allergies, etc."
                            />
                        </div>

                        {selectedEvent?.registrationFee ? (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
                                <strong>Note:</strong> Registration fee of ₹{selectedEvent.registrationFee} is payable at the venue or via UPI.
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRegisterSubmit} disabled={registering} className="bg-emerald-600 hover:bg-emerald-700">
                            {registering && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Confirm Registration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
