'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  Trophy,
  Timer,
  ArrowRight,
  Sparkles,
  Star,
  Gavel,
  Target,
  Shield,
  Zap,
  Crown,
  ChevronRight,
  Play,
  Clock,
  IndianRupee,
  Activity,
  Award,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from '@/lib/api';

interface AuctionState {
  status: string;
  current_player?: any;
  current_bid?: number;
  current_bidder?: any;
}

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString()}`;
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch auction state
    const fetchAuctionState = async () => {
      try {
        const state = await api.getPublicAuctionState();
        setAuctionState(state);
      } catch (error) {
        console.error('Failed to fetch auction state:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionState();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchAuctionState, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section - Mobile-First Premium Design */}
      <section className="hero-section relative overflow-hidden min-h-[100svh] sm:min-h-[95vh] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]">
        {/* Optimized Background Effects - GPU accelerated, reduced on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Static gradient overlays instead of animated orbs for mobile */}
          <div className="hero-gradient-1 absolute top-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-500/20 blur-2xl sm:blur-3xl" style={{ transform: 'translate3d(20%, -20%, 0)' }} />
          <div className="hero-gradient-2 absolute bottom-0 left-0 w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] lg:w-[500px] lg:h-[500px] rounded-full bg-gradient-to-br from-amber-500/25 to-orange-500/15 blur-2xl sm:blur-3xl" style={{ transform: 'translate3d(-20%, 20%, 0)' }} />

          {/* Subtle top glow - visible on all screens */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[400px] bg-gradient-to-b from-amber-400/15 via-amber-500/5 to-transparent blur-2xl" />

          {/* Desktop-only decorative elements */}
          <div className="hidden lg:block absolute top-[40%] left-[15%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-emerald-500/12 to-teal-500/8 blur-3xl animate-orb-3" />
        </div>

        {/* Content Container - Mobile optimized padding */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-20 sm:py-12 lg:py-20 lg:pb-32 flex flex-col min-h-[100svh] sm:min-h-0">
          {/* Compact Header Row for Mobile */}
          <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            {/* Score India Brand - Compact on mobile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight">
                  Score<span className="text-amber-400">India</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-white/50 font-medium tracking-wider uppercase hidden sm:block">Premium Cricket Auctions</p>
              </div>
            </div>

            {/* Live Status Badge - Compact on mobile */}
            {!loading && (auctionState?.status === 'live' || auctionState?.status === 'active') && (
              <div className="relative">
                <div className="absolute -inset-1 bg-red-500/40 rounded-full blur-md" />
                <div className="relative inline-flex items-center gap-1.5 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-red-500/20 border border-red-500/40">
                  <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-full w-full bg-red-500" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-red-300 uppercase tracking-wider">Live</span>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Stack on mobile, grid on desktop */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center lg:items-start">
            {/* Left Side - Main Branding (centered on mobile) */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              {/* Season Badge - Smaller on mobile */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-semibold text-white/80">Season 2026</span>
                <div className="w-1 h-1 rounded-full bg-white/40 hidden sm:block" />
                <span className="text-xs sm:text-sm text-white/60 hidden sm:inline">Inaugural Edition</span>
              </div>

              {/* SPL Title - Responsive sizing */}
              <div className="relative mb-4 sm:mb-6">
                <h1 className="relative text-7xl sm:text-8xl lg:text-9xl font-black leading-none tracking-tighter">
                  <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    SPL
                  </span>
                </h1>
              </div>

              {/* League Name - Simplified for mobile */}
              <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-amber-400/50" />
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                  <span className="text-amber-400">Sambalpur</span> Premier League
                </h2>
                <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-amber-400/50" />
              </div>

              {/* Tagline - Shorter on mobile */}
              <p className="text-sm sm:text-lg text-white/60 max-w-md lg:max-w-xl mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
                Experience the <span className="text-white font-medium">thrill of live cricket auctions</span>.
                <span className="hidden sm:inline"> Build your dream team, track bids in real-time.</span>
              </p>

              {/* CTA Buttons - Full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-6 sm:mb-10">
                <Link href="/auctions" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 shadow-lg shadow-amber-500/25 rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      Watch Live Auction
                    </span>
                  </Button>
                </Link>
                <Link href="/auctions" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <span className="flex items-center justify-center gap-2">
                      View All Players
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Feature Highlights - Horizontal scroll on mobile */}
              <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
                <div className="flex items-center gap-2 sm:gap-3 sm:flex-wrap sm:justify-center lg:justify-start min-w-max sm:min-w-0">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">150+ Players</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">8 Teams</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">Live Bidding</span>
                  </div>
                  <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white">Real-time Updates</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auction Status Card (below content on mobile) */}
            <div className="lg:col-span-5 relative w-full max-w-md lg:max-w-none lg:-mt-16">
              {/* Card glow - reduced on mobile */}
              <div className="hidden sm:block absolute -inset-4 bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-blue-500/15 rounded-3xl blur-2xl opacity-60" />

              {/* Main Card - Simplified styling for mobile */}
              <Card className="relative bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 overflow-hidden shadow-xl">
                {/* Subtle internal decoration - desktop only */}
                <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3" />

                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3 sm:mb-4">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">Official Auction</span>
                    </div>

                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-2">
                      SPL 2026
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 font-medium">Sambalpur Premier League</p>
                  </div>

                  {/* Status Section */}
                  {loading ? (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-white/50 text-xs sm:text-sm font-medium">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {/* Status Badge */}
                      <div className="flex items-center justify-center mb-4 sm:mb-6">
                        {auctionState?.status === 'live' || auctionState?.status === 'active' ? (
                          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                            <div className="relative">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400" />
                              <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wider">
                              Bidding Open
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                            <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Content */}
                      <div className="text-center space-y-2 sm:space-y-4 mb-4 sm:mb-6">
                        {auctionState?.status === 'live' || auctionState?.status === 'active' ? (
                          <>
                            <div className="flex items-center justify-center gap-2">
                              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                              <h4 className="text-lg sm:text-xl font-bold text-white">
                                Auction is LIVE!
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                              Join now to watch the action!
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl sm:rounded-2xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20 mb-3">
                              <Gavel className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-white">
                              Auction Not Started
                            </h4>
                            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                              Stay tuned for the action!
                            </p>
                          </>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Link href="/auctions" className="block">
                        <Button className="w-full py-4 sm:py-5 text-sm sm:text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform">
                          <Gavel className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Enter Auction Room
                        </Button>
                      </Link>

                      {/* Feature Pills - Hidden on smallest screens */}
                      <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 mt-5 pt-5 border-t border-white/10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-xs text-blue-300 font-medium">
                          <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Real-time
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-xs text-emerald-300 font-medium">
                          <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          8 Teams
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] sm:text-xs text-purple-300 font-medium">
                          <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          150+ Players
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Wave - Simplified SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80L60 73.3C120 67 240 53 360 46.7C480 40 600 40 720 44C840 48 960 56 1080 58.7C1200 61 1320 59 1380 58L1440 57V80H0Z"
              className="fill-slate-50"
            />
          </svg>
        </div>
      </section>



      {/* CTA Banner */}
      {/* CTA Banner - Tournament Hosting Advertisement */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-0 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white/80">Premium Experience</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Want to Host Your Own
                <span className="block mt-2 bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Tournament Auction?
                </span>
              </h2>

              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                Take your local tournament to the next level with our professional auction platform.
                Manage players, teams, and live bidding with a broadcast-quality interface that everyone will love.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                <Button
                  onClick={() => setIsContactModalOpen(true)}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-7 text-lg font-bold bg-white text-blue-900 hover:bg-white/95 rounded-xl shadow-xl shadow-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Us to Host
                </Button>

                <Link href="/auctions" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-7 text-lg font-bold border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    View Current Auction
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="!w-[calc(100vw-2rem)] sm:!w-auto sm:max-w-md !bg-white border-slate-200 text-slate-900 !left-1/2 !-translate-x-1/2 !mx-0 !max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 text-center">Host Your Auction</DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-sm">
              Contact us to set up your premium cricket auction platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 w-full text-center">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Website Creator and Owner</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">Sonu Yadav</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Call / WhatsApp</p>
                <a href="tel:+918956636255" className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  +91 89566 36255
                </a>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Us</p>
                <a href="mailto:admin@scoreIndia.cloud" className="text-sm sm:text-base font-bold text-slate-900 hover:text-purple-600 transition-colors break-all">
                  admin@scoreIndia.cloud
                </a>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
              <h4 className="text-sm sm:text-base font-bold text-blue-900 mb-2 flex items-center justify-start gap-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                Premium Features Include:
              </h4>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-none pl-5">
                <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-slate-600">Professional Auction Dashboard</li>
                <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-slate-600">Live Big Screen Display</li>
                <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-slate-600">Team Management Tools</li>
                <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-slate-600">Real-time Bidding System</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center pt-2 shrink-0 border-t border-slate-200 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsContactModalOpen(false)}
              className="w-full text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
