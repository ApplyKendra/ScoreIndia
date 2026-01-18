'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Video,
  Calendar,
  Heart,
  ArrowRight,
  Sparkles,
  Star,
  MessageCircle,
  Play,
  ChevronRight,
  Info,
  Phone,
  Building2,
  Crown
} from 'lucide-react';

// API URL: Get base URL (without /api suffix) for direct fetch calls
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return envUrl.replace(/\/api\/?$/, '');
};
const API_URL = getBaseUrl();

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  gradient?: string;
}

const FALLBACK_SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Sri Sri Radha Madhav',
    subtitle: 'Divine Deities of ISKCON',
    imageUrl: '',
    gradient: 'from-orange-500 via-rose-500 to-pink-500',
  },
  {
    id: '2',
    title: 'Sacred Prasadam',
    subtitle: 'Spiritually nourishing food',
    imageUrl: '',
    buttonText: 'Order Now',
    buttonLink: '/prasadam',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  {
    id: '3',
    title: 'Live Darshan',
    subtitle: 'Connect from anywhere',
    imageUrl: '',
    buttonText: 'Watch Live',
    buttonLink: '/darshan',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
  },
];

function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [loading, setLoading] = useState(true);

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(`${API_URL}/api/hero-slides`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setSlides(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch slides, using fallback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      if (!hoveredCard) {
        setIsAnimating(true);
        setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % slides.length);
          setIsAnimating(false);
        }, 400);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length, hoveredCard]);

  const goToSlide = (index: number) => {
    if (index !== activeIndex && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-white/50"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[600px] perspective-1000">
      {/* Ambient Glow Background */}
      <div
        className="absolute inset-0 opacity-60 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${slides[activeIndex]?.gradient?.includes('orange') ? 'rgba(251,146,60,0.3)' : slides[activeIndex]?.gradient?.includes('violet') ? 'rgba(139,92,246,0.3)' : slides[activeIndex]?.gradient?.includes('cyan') ? 'rgba(6,182,212,0.3)' : 'rgba(244,114,182,0.3)'} 0%, transparent 70%)`,
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30 animate-particle-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* 3D Card Stack */}
      <div className="absolute inset-0 flex items-center justify-center">
        {slides.map((slide, index) => {
          const offset = index - activeIndex;
          const isActive = index === activeIndex;
          const isPrev = offset === -1 || (activeIndex === 0 && index === slides.length - 1);
          const isNext = offset === 1 || (activeIndex === slides.length - 1 && index === 0);
          const isHidden = !isActive && !isPrev && !isNext;

          let zIndex = 10;
          let translateZ = -100;
          let translateX = 0;
          let rotateY = 0;
          let scale = 0.8;
          let opacity = 0;

          if (isActive) {
            zIndex = 30;
            translateZ = 0;
            scale = 1;
            opacity = 1;
            rotateY = 0;
          } else if (isNext) {
            zIndex = 20;
            translateZ = -80;
            translateX = 60;
            rotateY = -15;
            scale = 0.85;
            opacity = 0.7;
          } else if (isPrev) {
            zIndex = 20;
            translateZ = -80;
            translateX = -60;
            rotateY = 15;
            scale = 0.85;
            opacity = 0.7;
          }

          if (isHidden) return null;

          const gradient = slide.gradient || 'from-[#5750F1] via-purple-500 to-fuchsia-500';

          return (
            <div
              key={slide.id || index}
              className={`absolute transition-all duration-700 ease-out cursor-pointer ${isAnimating ? 'pointer-events-none' : ''}`}
              style={{
                zIndex,
                transform: `perspective(1000px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
              }}
              onClick={() => goToSlide(index)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card Container */}
              <div
                className={`relative w-[240px] sm:w-[300px] lg:w-[360px] h-[300px] sm:h-[380px] lg:h-[500px] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 ${isActive ? 'shadow-2xl shadow-black/30' : 'shadow-xl shadow-black/20'
                  } ${hoveredCard === index && isActive ? 'scale-[1.02]' : ''}`}
              >
                {/* Background - Either Image or Gradient */}
                {slide.imageUrl ? (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}

                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Shimmer Effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-shimmer"
                    style={{
                      background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                    }}
                  />
                </div>

                {/* Glowing Border */}
                <div
                  className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2)',
                  }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-end p-4 sm:p-6 lg:p-8 text-white text-center z-10">
                  {/* Title with Glow */}
                  <h3
                    className={`text-lg sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2 transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                    style={{
                      textShadow: '0 0 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    {slide.title}
                  </h3>

                  {/* Subtitle */}
                  {slide.subtitle && (
                    <p
                      className={`text-xs sm:text-base lg:text-lg text-white/90 mb-2 sm:mb-4 transition-all duration-500 delay-100 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                  {/* Button Link */}
                  {isActive && slide.buttonText && slide.buttonLink && (
                    <Link href={slide.buttonLink} className="mt-1 sm:mt-2">
                      <Button
                        className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full shadow-lg transition-all hover:scale-105"
                      >
                        {slide.buttonText}
                        <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-40">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${index === activeIndex
              ? 'w-6 sm:w-8 h-2 sm:h-3 bg-white'
              : 'w-2 sm:w-3 h-2 sm:h-3 bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Side Decorative Elements - Hidden on mobile */}
      <div className="hidden sm:block absolute top-10 right-10 w-20 h-20 border-2 border-white/10 rounded-full animate-ring-pulse" />
      <div className="hidden sm:block absolute bottom-20 left-10 w-16 h-16 border-2 border-white/10 rounded-lg rotate-45 animate-diamond-float" />
    </div>
  );
}

// Service Icon Component
function ServiceIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="text-white">
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Reveal animations
    const els = document.querySelectorAll('.reveal-up');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.18 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const services = [
    {
      title: 'Live Darshan',
      description: 'Watch live ceremonies',
      icon: Video,
      href: '/darshan',
      color: 'from-rose-500 to-pink-500'
    },
    {
      title: 'Upcoming Events',
      description: 'Upcoming festivals',
      icon: Calendar,
      href: '/events',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Youth Forum',
      description: 'Join the community',
      icon: Users,
      href: '/youth',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Order Prasadam',
      description: 'Order sacred food',
      icon: UtensilsCrossed,
      href: '/prasadam',
      color: 'from-orange-500 to-amber-500'
    },
    {
      title: 'Temple Store',
      description: 'Spiritual merchandise',
      icon: ShoppingBag,
      href: '/store',
      color: 'from-[#5750F1] to-purple-600'
    },
    {
      title: 'Donations',
      description: 'Support the temple',
      icon: Heart,
      href: '/donations',
      color: 'from-red-500 to-rose-500'
    },
  ];

  return (
    <div className="text-gray-900 dark:text-gray-100">
      {/* Hero Section - Premium Split Layout */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Gradient Orbs */}
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

          {/* Radial Glow at Top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-radial from-[#5750F1]/20 via-transparent to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center min-h-[auto] lg:min-h-[70vh]">

            {/* Left Side - Text Content - FIRST ON MOBILE */}
            <div className="reveal-up order-1 lg:order-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-4 sm:mb-6">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-white/80">Digital Temple Experience</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-[50px] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight text-white mb-4 sm:mb-6">
                Experience
                <span className="block mt-1 relative">
                  <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
                    Divine Peace
                  </span>
                  {/* Glow Effect */}
                  <span
                    className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-400/50 via-white/30 to-pink-400/50 opacity-70"
                    aria-hidden="true"
                  />
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                Join our spiritual community. Order prasadam, explore devotional items,
                watch live darshan, and connect with devotees worldwide.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start mb-6 sm:mb-10">
                {['Prasadam', 'Temple Store', 'Live Darshan', 'Youth Forum'].map((feature) => (
                  <span
                    key={feature}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/90 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all cursor-pointer"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Slideshow - Show here on mobile only, before CTA buttons */}
              <div className="block lg:hidden mb-6">
                <HeroSlideshow />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/prasadam">
                  <Button
                    size="lg"
                    className="group relative px-5 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold bg-white text-[#5750F1] hover:bg-white/95 shadow-xl shadow-white/20 rounded-lg sm:rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      Order Prasadam
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link href="/darshan">
                  <Button
                    size="lg"
                    variant="outline"
                    className="group px-5 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-lg sm:rounded-xl transition-all duration-300"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      Watch Live
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-12">
                  <div className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-bold text-white">15+</p>
                    <p className="text-xs sm:text-sm text-white/60">Years</p>
                  </div>
                  <div className="w-px h-8 sm:h-12 bg-white/20 hidden sm:block" />
                  <div className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-bold text-white">1000+</p>
                    <p className="text-xs sm:text-sm text-white/60">Members</p>
                  </div>
                  <div className="w-px h-8 sm:h-12 bg-white/20 hidden sm:block" />
                  <div className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-bold text-white">100+</p>
                    <p className="text-xs sm:text-sm text-white/60">Nitya Sevak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Premium Slideshow - Hidden on mobile (shown above instead) */}
            <div className="hidden lg:block order-2 lg:order-2">
              <HeroSlideshow />
            </div>
          </div>
        </div>

        {/* Bottom Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
              className="fill-white dark:fill-gray-950"
            />
          </svg>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="mt-6 sm:mt-8 md:mt-10 px-3 sm:px-4" aria-labelledby="services-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 sm:mb-5 flex items-center justify-between">
            <h2 id="services-title" className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Our Services</h2>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#5750F1]/20 bg-[#5750F1]/5 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#5750F1]">
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Popular
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-white/10 hover:border-[#5750F1]/50 hover:shadow-md"
                >
                  <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                    {/* Icon Container */}
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1] group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#5750F1] transition-colors text-xs sm:text-sm">
                        {service.title}
                      </h3>
                      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-[#5750F1]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore More Section */}
      <section className="mt-10 sm:mt-16 px-3 sm:px-4" aria-labelledby="explore-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 sm:mb-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5750F1]/20 bg-[#5750F1]/5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-[#5750F1] mb-3 sm:mb-4">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Explore
            </span>
            <h2 id="explore-title" className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Discover More
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto px-4">
              Learn about our mission, support temple construction, or become a life patron
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* New Temple Construction Card */}
            <Link href="/temple-construction" className="group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#5750F1] to-[#7C3AED] p-3 sm:p-5 h-28 sm:h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#5750F1]/30">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 rounded-bl-full bg-white/10" />

                {/* Arrow icon - hidden on mobile */}
                <div className="hidden sm:flex absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center group-hover:bg-white/30 transition-all group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>

                <div className="relative z-10 h-full flex flex-col gap-2 sm:gap-3">
                  {/* Icon */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5">New Temple</h3>
                    <p className="text-white/80 text-[10px] sm:text-xs leading-snug">Be a part of divine construction</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Seva Opportunities Card */}
            <Link href="/seva-opportunities" className="group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 p-3 sm:p-5 h-28 sm:h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/30">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 rounded-bl-full bg-white/10" />

                {/* Arrow icon - hidden on mobile */}
                <div className="hidden sm:flex absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center group-hover:bg-white/30 transition-all group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>

                <div className="relative z-10 h-full flex flex-col gap-2 sm:gap-3">
                  {/* Icon */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5">Seva Opportunities</h3>
                    <p className="text-white/80 text-[10px] sm:text-xs leading-snug">Serve to please Lord Sita Ram</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Nitya Sevak Card - Featured */}
            <Link href="/nitya-sevak" className="group col-span-2">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-6 h-32 sm:h-48 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#5750F1]/20">
                <div className="absolute top-[-20%] right-[-10%] w-32 sm:w-64 h-32 sm:h-64 rounded-full bg-[#5750F1]/30 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-24 sm:w-48 h-24 sm:h-48 rounded-full bg-amber-500/20 blur-2xl" />

                {/* Arrow icon */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-0.5 z-20">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-medium rounded-full border border-amber-500/30">
                      Life Patron
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Become a Nitya Sevak</h3>
                    <p className="text-white/70 text-[10px] sm:text-sm">Join our exclusive life patron membership</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Join Our Community - Premium Hero-Style Section */}
      <section className="mt-10 sm:mt-16 px-3 sm:px-4 pb-10 sm:pb-16">
        <div className="mx-auto max-w-7xl">
          {/* Main Community Hero Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-5 sm:p-8 md:p-12 lg:p-16 mb-6 sm:mb-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#5750F1]/40 to-purple-600/20 blur-3xl animate-orb-1" />
              <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/20 blur-3xl animate-orb-2" />
              <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/10 blur-2xl animate-orb-3" />

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
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/20 animate-particle-float"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${4 + i * 0.5}s`,
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white/80">Growing Community</span>
                  </div>

                  {/* Heading */}
                  <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-3 sm:mb-4">
                    Join Our
                    <span className="block mt-1 relative">
                      <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
                        Spiritual Community
                      </span>
                      <span
                        className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-400/50 via-white/30 to-pink-400/50 opacity-50"
                        aria-hidden="true"
                      />
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-8">
                    Connect with devotees, participate in festivals, and deepen your journey with us.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-row gap-3 sm:gap-5 justify-center lg:justify-start">
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="group px-6 sm:px-10 py-4 sm:py-6 text-sm sm:text-base font-semibold bg-white text-[#5750F1] hover:bg-white/95 shadow-xl shadow-white/20 rounded-lg sm:rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          Join Now
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button
                        size="lg"
                        variant="outline"
                        className="group px-6 sm:px-10 py-4 sm:py-6 text-sm sm:text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-lg sm:rounded-xl transition-all"
                      >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">View </span>Events
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right Side - Stats Grid */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:gap-4">
                  {[
                    { value: '15+', label: 'Years', icon: Star, color: 'from-amber-500 to-orange-500' },
                    { value: '1000+', label: 'Members', icon: Users, color: 'from-emerald-500 to-teal-500' },
                    { value: '100+', label: 'Nitya Sevak', icon: Heart, color: 'from-rose-500 to-pink-500' },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-2 sm:p-4 lg:p-5 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color}`} />
                      <div className="relative z-10">
                        <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white/60 mx-auto mb-1 sm:mb-2" />
                        <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-0.5">{stat.value}</p>
                        <p className="text-[8px] sm:text-[10px] md:text-xs text-white/60">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Quote Section */}
      < section className="py-8 sm:py-12 md:py-16 px-4 bg-muted/30" >
        <div className="mx-auto max-w-4xl text-center px-2">
          <blockquote className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium italic text-foreground leading-relaxed">
            &ldquo;We are not this body. We are eternal spirit souls, part and parcel of the Supreme Lord.&rdquo;
          </blockquote>
          <p className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base text-[#5750F1] font-semibold">— Srila Prabhupada</p>
        </div>
      </section >

      {/* Maha Mantra Section */}
      < section className="py-8 sm:py-10 md:py-12 px-4 bg-gradient-to-r from-[#5750F1] to-[#7C3AED] text-white" >
        <div className="mx-auto max-w-4xl text-center px-2">
          <p className="text-sm sm:text-base md:text-lg opacity-80 mb-2 sm:mb-3 md:mb-4">Chant and Be Happy</p>
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed">
            Hare Krishna Hare Krishna<br />
            Krishna Krishna Hare Hare<br />
            Hare Rama Hare Rama<br />
            Rama Rama Hare Hare
          </h2>
        </div>
      </section >
    </div >
  );
}
