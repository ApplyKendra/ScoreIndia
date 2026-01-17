'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Maximize2, Clock, Camera, MapPin, Calendar, Sun, Moon, Sunrise, MessageCircle, ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { darshanApi, type DarshanImage, type AartiScheduleItem } from '@/lib/api/darshan';

export default function DarshanPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [selectedImage, setSelectedImage] = useState<DarshanImage | null>(null);
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    // API data
    const [aartiSchedule, setAartiSchedule] = useState<AartiScheduleItem[]>([]);
    const [darshanImages, setDarshanImages] = useState<DarshanImage[]>([]);
    const [youtubeLink, setYoutubeLink] = useState('https://youtube.com');
    const [templeOpen, setTempleOpen] = useState('4:30 AM');
    const [templeClose, setTempleClose] = useState('9:00 PM');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsData, aartiData, imagesData] = await Promise.all([
                    darshanApi.getSettings(),
                    darshanApi.getAartiSchedule(),
                    darshanApi.getDarshanImages(),
                ]);

                // Process settings
                settingsData.forEach((s) => {
                    if (s.key === 'youtube_link') setYoutubeLink(s.value);
                    if (s.key === 'temple_open') setTempleOpen(s.value);
                    if (s.key === 'temple_close') setTempleClose(s.value);
                });

                setAartiSchedule(aartiData);
                setDarshanImages(imagesData);
            } catch (error) {
                console.error('Failed to fetch darshan data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        toast.info(isPlaying ? 'Stream paused' : 'Starting live stream...');
    };

    const getCurrentAarti = () => {
        if (aartiSchedule.length === 0) return null;

        const now = currentTime;
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentMinutes = hours * 60 + minutes;

        for (let i = 0; i < aartiSchedule.length; i++) {
            const [time, period] = aartiSchedule[i].time.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            const aartiMinutes = h * 60 + m;

            if (aartiMinutes > currentMinutes || i === aartiSchedule.length - 1) {
                return aartiSchedule[i];
            }
        }
        return aartiSchedule[0];
    };

    const nextAarti = getCurrentAarti();

    const getTimeIcon = (time: string) => {
        const hour = parseInt(time.split(':')[0]);
        const isPM = time.includes('PM');
        const actualHour = isPM && hour !== 12 ? hour + 12 : hour;

        if (actualHour < 6 || actualHour >= 20) return Moon;
        if (actualHour < 12) return Sunrise;
        return Sun;
    };

    // Temple information
    const templeInfo = [
        { icon: Clock, title: 'Temple Hours', value: `${templeOpen} - ${templeClose}`, sub: 'Daily' },
        { icon: Calendar, title: 'Best Time', value: 'Morning Aarties', sub: '4:30 - 8:30 AM' },
        { icon: MapPin, title: 'Location', value: 'ISKCON Burla', sub: 'Sambalpur, Odisha' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50 text-gray-900">

            {/* === HERO SECTION === */}
            <section className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0" aria-hidden>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImRhcnNoYW4iIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDVMMzUgMTVIMjVMMzAgNXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iNDUiIHI9IjMiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZGFyc2hhbikiLz48L3N2Zz4=')] opacity-60" />
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-yellow-300/20 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4 sm:mb-6">
                                <Camera className="w-4 h-4 text-white" />
                                <span className="text-xs sm:text-sm font-medium text-white">Divine Darshan</span>
                                {isLive && (
                                    <Badge className="bg-red-500 text-white border-0 animate-pulse ml-2">
                                        LIVE
                                    </Badge>
                                )}
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-3 sm:mb-4">
                                Live Darshan
                            </h1>

                            {/* Description */}
                            <p className="text-base sm:text-lg text-white/90 max-w-lg mx-auto lg:mx-0 mb-4">
                                Experience the divine presence of Their Lordships from anywhere in the world
                            </p>

                            {/* CTA */}
                            <Button
                                size="lg"
                                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg"
                                onClick={() => window.open(youtubeLink, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on YouTube
                            </Button>
                        </div>

                        {/* Next Aarti Card */}
                        {nextAarti && (
                            <div className="relative w-full max-w-sm">
                                <div className="bg-white/15 backdrop-blur-md rounded-2xl border border-white/30 p-5 sm:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-sm">Next Aarti</p>
                                            <p className="text-white font-bold text-lg">{nextAarti.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <span className="text-3xl font-bold">{nextAarti.time}</span>
                                        <div className="text-right text-sm text-white/70">
                                            <p>{nextAarti.description}</p>
                                            <p>Today</p>
                                        </div>
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
                        <path d="M0,50 C360,90 540,10 720,50 C900,90 1080,10 1440,50 L1440,60 L0,60 Z" fill="white" className="fill-amber-50/50 dark:fill-gray-900" />
                    </svg>
                </div>
            </section>

            {/* === MAIN CONTENT === */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">

                {/* === LIVE STREAM SECTION === */}
                <section>
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live Stream</h2>
                        {isLive && (
                            <Badge className="bg-red-500 text-white border-0 animate-pulse">
                                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                                LIVE NOW
                            </Badge>
                        )}
                    </div>

                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                        {/* Video Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                                    <Play className="h-10 w-10 sm:h-12 sm:w-12 opacity-70" />
                                </div>
                                <p className="text-lg sm:text-xl font-medium">Live Stream</p>
                                <p className="text-sm text-gray-400 mt-1">Connect to temple's YouTube channel</p>
                            </div>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Controls overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex items-end justify-between">
                            <Button
                                size="lg"
                                variant="ghost"
                                className="text-white hover:bg-white/20 gap-2"
                                onClick={togglePlay}
                            >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                                {isPlaying ? 'Pause' : 'Play'}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-white hover:bg-white/20"
                                >
                                    <Maximize2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === TWO COLUMN LAYOUT === */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* === DAILY DARSHAN GALLERY === */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Darshan</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                                <Camera className="w-3 h-3 mr-1" />
                                {darshanImages.length} Photos
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                            </div>
                        ) : darshanImages.length === 0 ? (
                            <div className="text-center py-20">
                                <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">No darshan images for today yet</p>
                                <p className="text-sm text-gray-400 mt-1">Check back after the next aarti</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {darshanImages.map((item) => {
                                    const isHovered = hoveredImage === item.id;
                                    const TimeIcon = getTimeIcon(new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));

                                    return (
                                        <div
                                            key={item.id}
                                            className="group relative cursor-pointer"
                                            onMouseEnter={() => setHoveredImage(item.id)}
                                            onMouseLeave={() => setHoveredImage(null)}
                                            onClick={() => setSelectedImage(item)}
                                        >
                                            <Card className={`overflow-hidden transition-all duration-300 ${isHovered
                                                ? 'shadow-xl shadow-amber-200/50 -translate-y-2'
                                                : 'shadow-md'
                                                }`}>
                                                <div className="relative aspect-[4/5]">
                                                    <Image
                                                        src={item.url}
                                                        alt={item.title}
                                                        fill
                                                        className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
                                                    />

                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                                    {/* Time badge */}
                                                    <div className="absolute top-3 right-3">
                                                        <Badge className="bg-white/90 text-gray-900 border-0 shadow-md">
                                                            <TimeIcon className="w-3 h-3 mr-1 text-amber-600" />
                                                            {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </Badge>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                        <p className="text-sm font-medium opacity-90">{item.description}</p>
                                                        <h3 className="font-bold text-lg sm:text-xl mt-1">{item.title}</h3>
                                                    </div>

                                                    {/* View icon on hover */}
                                                    <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                            <Eye className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* === SIDEBAR === */}
                    <aside className="space-y-6">

                        {/* Aarti Schedule */}
                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Aarti Schedule
                                </h3>
                            </div>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {aartiSchedule.map((aarti) => {
                                        const TimeIcon = getTimeIcon(aarti.time);
                                        const isNext = nextAarti && aarti.id === nextAarti.id;

                                        return (
                                            <div
                                                key={aarti.id}
                                                className={`p-3 sm:p-4 flex items-center gap-3 transition-colors ${isNext ? 'bg-amber-50' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <TimeIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm truncate ${isNext ? 'text-amber-700' : 'text-gray-900'}`}>
                                                        {aarti.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{aarti.description}</p>
                                                </div>
                                                <span className={`text-sm font-semibold ${isNext ? 'text-amber-600' : 'text-gray-600'}`}>
                                                    {aarti.time}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Temple Info */}
                        <Card className="p-4 sm:p-5">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-amber-600" />
                                Temple Information
                            </h3>
                            <div className="space-y-4">
                                {templeInfo.map((info) => {
                                    const Icon = info.icon;
                                    return (
                                        <div key={info.title} className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{info.value}</p>
                                                <p className="text-sm text-gray-500">{info.title} • {info.sub}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button
                                className="w-full mt-4 bg-amber-600 hover:bg-amber-700"
                                onClick={() => window.open('https://maps.google.com', '_blank')}
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                Get Directions
                            </Button>
                        </Card>

                        {/* WhatsApp Contact */}
                        <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
                            <h3 className="font-bold text-gray-900 mb-1">Have Questions?</h3>
                            <p className="text-sm text-gray-600 mb-3">Contact us on WhatsApp for temple inquiries</p>
                            <a
                                href="https://wa.me/919999999999?text=Hare%20Krishna!%20I%20have%20a%20question%20about%20temple%20darshan."
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Chat on WhatsApp
                                </Button>
                            </a>
                        </Card>
                    </aside>
                </div>
            </div>

            {/* === CTA SECTION === */}
            <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl" />

                        <div className="relative z-10">
                            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white/80 mx-auto mb-4" />
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
                                Subscribe to Daily Darshan
                            </h3>
                            <p className="text-white/80 max-w-lg mx-auto mb-6 sm:mb-8 text-sm sm:text-base">
                                Get beautiful darshan photos and aarti notifications delivered to your WhatsApp every day
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                <a href="https://wa.me/919999999999?text=Hare%20Krishna!%20I%20would%20like%20to%20subscribe%20to%20daily%20darshan%20photos." target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-white text-amber-700 hover:bg-amber-50 rounded-xl shadow-xl">
                                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Subscribe on WhatsApp
                                    </Button>
                                </a>
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
            <section className="py-10 sm:py-12 bg-amber-50/50 border-t border-amber-100">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium italic text-gray-700 leading-relaxed">
                        "The Lord is situated in everyone's heart. One who sees the Supersoul accompanying the individual soul in all bodies understands the true meaning of darshan."
                    </blockquote>
                    <p className="mt-4 text-amber-700 font-semibold">— Bhagavad Gita</p>
                </div>
            </section>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh]">
                        <Image
                            src={selectedImage.url}
                            alt={selectedImage.title}
                            width={1200}
                            height={800}
                            className="object-contain w-full h-full rounded-lg"
                        />
                        <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                            <h3 className="font-bold text-xl">{selectedImage.title}</h3>
                            <p className="text-white/80">{selectedImage.description}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20"
                            onClick={() => setSelectedImage(null)}
                        >
                            ×
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
