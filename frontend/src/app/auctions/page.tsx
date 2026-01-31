'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    Trophy,
    ArrowLeft,
    Gavel,
    Shield,
    TrendingUp,
    Eye,
    Crown,
    Flame,
    ArrowUpRight,
    Coffee,
    Globe,
    Activity,
    Youtube,
    History,
    Zap,
    Search,
    Volume2,
    VolumeX,
} from 'lucide-react';
import PlayerListItem from './PlayerListItem';
import { useWebSocket } from '@/hooks/useWebSocket';
import api from '@/lib/api';
import confetti from 'canvas-confetti';
import { getImageUrl } from '@/lib/utils';

// --- Types ---
interface Team {
    id: string;
    name: string;
    short_name: string;
    color: string;
    budget: number;
    spent?: number;
    remaining_budget?: number;
    player_count?: number;
    logo_url?: string;
}

interface Player {
    id: string;
    name: string;
    country: string;
    country_flag?: string;
    role: string;
    base_price: number;
    sold_price?: number;
    status: string;
    category?: string;
    team?: Team;
    team_id?: string;
    image_url?: string;
    badge?: string;
    stats?: {
        matches?: number;
        runs?: number;
        wickets?: number;
        avg?: number;
        economy?: number;
    };
}

interface AuctionState {
    status: string;
    current_player?: Player;
    current_bid?: number;
    current_bidder?: Team;
    bids?: any[];
}

interface Bid {
    id: string;
    amount: number;
    team?: Team;
    created_at: string;
}

const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
};

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    // Match patterns: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID, youtube.com/embed/ID
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};

type TabType = 'live' | 'available' | 'squads';
type RoleFilter = 'All' | 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';

export default function AuctionsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('live');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
    const [activeStatsTab, setActiveStatsTab] = useState<'recent' | 'top'>('recent');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [activeAvailableSubTab, setActiveAvailableSubTab] = useState<'available' | 'unsold'>('available');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Data from API
    const [teams, setTeams] = useState<Team[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
    const [recentSales, setRecentSales] = useState<Player[]>([]);
    const [topBuys, setTopBuys] = useState<Player[]>([]);
    const [teamSquad, setTeamSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    // Track last sold/unsold player for display
    const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
    const [lastUnsoldPlayer, setLastUnsoldPlayer] = useState<Player | null>(null);
    const [previousPlayerId, setPreviousPlayerId] = useState<string | null>(null);
    const [previousPlayer, setPreviousPlayer] = useState<Player | null>(null);
    const [shouldTriggerConfetti, setShouldTriggerConfetti] = useState(false);
    const [soldPlayerBidHistory, setSoldPlayerBidHistory] = useState<Bid[]>([]);
    // Use ref to track current bids so we can capture them before they're cleared
    const currentBidsRef = useRef<Bid[]>([]);
    // Track when a player was skipped (to prevent showing "unsold" message)
    const wasSkippedRef = useRef(false);

    // YouTube live stream URL
    const [liveStreamUrl, setLiveStreamUrl] = useState<string>('');
    // YouTube stream mute state
    const [isMuted, setIsMuted] = useState<boolean>(false);

    const [isVisible, setIsVisible] = useState(true);

    // WebSocket event handler for public connection
    const handleWebSocketMessage = useCallback((event: string, data: any) => {
        switch (event) {
            case 'auction:state':
                // Update state and sync bid ref
                setAuctionState(prev => {
                    const newState = data;
                    // CRITICAL: If auction is completed (either from newState or prev), ALWAYS clear current_player
                    const isCompleted = newState.status === 'completed' || prev?.status === 'completed';
                    if (isCompleted) {
                        console.log('[Auction State] Status is completed, clearing current_player. newState.status:', newState.status, 'prev?.status:', prev?.status);
                        const clearedState = {
                            ...newState,
                            status: 'completed' as const, // Force status to completed
                            current_player: undefined,
                            current_bid: undefined,
                            current_bidder: undefined,
                            bids: [],
                        };
                        console.log('[Auction State] Setting cleared state:', clearedState);
                        return clearedState;
                    }
                    // Sync bid ref with new state bids
                    if (newState.bids && newState.bids.length > 0) {
                        currentBidsRef.current = newState.bids as Bid[];
                    }
                    return newState;
                });
                break;
            case 'auction:bid':
                // Update auction state with new bid
                setAuctionState(prev => {
                    const newBids = [data, ...(prev?.bids || [])];
                    // Update ref to track current bids
                    currentBidsRef.current = newBids as Bid[];
                    return prev ? {
                        ...prev,
                        current_bid: data.amount,
                        current_bidder: data.team,
                        bids: newBids,
                    } : null;
                });
                break;
            case 'auction:sold':
                // Update recent sales and teams
                if (data.player) {
                    // Attach team data to player if available
                    const playerWithTeam = data.team ? { ...data.player, team: data.team } : data.player;
                    setRecentSales(prev => [playerWithTeam, ...prev.slice(0, 149)]);
                    // Set last sold player with team data - this must happen BEFORE auction:state
                    setLastSoldPlayer(playerWithTeam);
                    setLastUnsoldPlayer(null);
                    // Trigger confetti via state change to ensure it runs in proper React context
                    setShouldTriggerConfetti(true);
                    // Save bid history from ref (which has the latest bids) before clearing
                    const bidsToSave = currentBidsRef.current.length > 0
                        ? [...currentBidsRef.current]
                        : null;

                    // Clear current player state
                    setAuctionState(prev => {
                        // If we don't have bids in ref, try to get from state
                        if (!bidsToSave && prev?.bids && prev.bids.length > 0) {
                            setSoldPlayerBidHistory(prev.bids as Bid[]);
                        } else if (bidsToSave) {
                            setSoldPlayerBidHistory(bidsToSave);
                        }
                        // Clear current player state
                        return prev ? {
                            ...prev,
                            current_player: undefined,
                            current_bid: undefined,
                            current_bidder: undefined,
                            bids: [],
                        } : null;
                    });
                    // Clear the ref after saving
                    currentBidsRef.current = [];
                }
                api.getPublicTeams().then(t => setTeams(t || []));
                api.getPublicTopBuys(150).then(t => setTopBuys(t || []));
                api.getPublicPlayers({ limit: 200 }).then(p => setAllPlayers(p?.data || []));
                break;
            case 'auction:unsold':
                // Update players list 
                api.getPublicPlayers({ limit: 200 }).then(p => setAllPlayers(p?.data || []));
                break;
            case 'auction:skipped':
                // Player was skipped - they're back in queue as available
                // Mark as skipped so we don't show "unsold" message
                wasSkippedRef.current = true;
                // Just refresh the players list
                api.getPublicPlayers({ limit: 200 }).then(p => setAllPlayers(p?.data || []));
                // Clear current player display and unsold player
                setLastUnsoldPlayer(null);
                setAuctionState(prev => prev ? {
                    ...prev,
                    current_player: undefined,
                    current_bid: undefined,
                    current_bidder: undefined,
                    bids: [],
                } : null);
                break;
            case 'auction:player-changed':
                // Clear bid ref when new player is selected
                currentBidsRef.current = [];
                setAuctionState(prev => ({
                    status: prev?.status || 'active',
                    ...prev,
                    current_player: data,
                    current_bid: data.base_price,
                    current_bidder: undefined,
                    bids: [],
                }));
                break;
            case 'auction:live':
                // Auction is now live - show that we're waiting for first player
                setAuctionState(prev => ({
                    ...prev,
                    status: 'live',
                }));
                break;
            case 'auction:ended':
                // Auction has ended - FORCE update state to show completed status
                // This MUST clear everything and set status to completed, no matter what
                console.log('[Auction Ended] Received auction:ended event, forcing status to completed');
                setAuctionState(prev => {
                    // Preserve all other state properties but force status to completed and clear player
                    const newState = {
                        ...prev,
                        status: 'completed' as const, // Force type to 'completed'
                        current_player: undefined,
                        current_bid: undefined,
                        current_bidder: undefined,
                        bids: [],
                    };
                    console.log('[Auction Ended] Setting state to:', newState);
                    return newState;
                });
                // Clear bid ref
                currentBidsRef.current = [];
                // Hide live stream when auction ends
                setLiveStreamUrl('');
                break;
            case 'auction:reset':
                // Auction was reset - refresh everything
                api.getPublicAuctionState().then(state => setAuctionState(state));
                api.getPublicTeams().then(t => setTeams(t || []));
                api.getPublicPlayers({ limit: 200 }).then(p => setAllPlayers(p?.data || []));
                api.getPublicRecentSales(150).then(r => setRecentSales(r || []));
                api.getPublicTopBuys(150).then(t => setTopBuys(t || []));
                break;
            case 'auction:stream-url':
                // Host has set/updated the YouTube live stream URL
                if (data?.url !== undefined) {
                    setLiveStreamUrl(data.url || '');
                }
                break;
        }
    }, []);

    // Public WebSocket connection (no auth required) with reconnection state sync
    const { isConnected } = useWebSocket({
        isPublic: true,
        onMessage: handleWebSocketMessage,
        onOpen: useCallback(() => {
            // Sync state on WebSocket connection/reconnection
            Promise.all([
                api.getPublicAuctionState().catch(() => null),
                api.getPublicTeams().catch(() => []),
                api.getPublicRecentSales(150).catch(() => []),
                api.getPublicTopBuys(150).catch(() => []),
            ]).then(([stateData, teamsData, recentData, topData]) => {
                if (stateData) setAuctionState(stateData);
                if (teamsData) setTeams(teamsData);
                if (recentData) setRecentSales(recentData);
                if (topData) setTopBuys(topData);
            }).catch(() => { });
        }, []),
    });

    // Fetch initial data (only once on mount)
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);

            // Fail-safe timeout to ensure we don't buffer forever
            const timeoutId = setTimeout(() => {
                if (isMounted && loading) {
                    setLoading(false);
                }
            }, 5000); // 5 second max loading screen

            try {
                const [teamsData, playersData, stateData, recentData, topData] = await Promise.all([
                    api.getPublicTeams().catch(() => []),
                    api.getPublicPlayers({ limit: 200 }).catch(() => ({ data: [] })),
                    api.getPublicAuctionState().catch(() => null),
                    api.getPublicRecentSales(150).catch(() => []),
                    api.getPublicTopBuys(150).catch(() => []),
                ]);

                if (isMounted) {
                    setTeams(teamsData || []);
                    setAllPlayers(playersData?.data || []);
                    setAuctionState(stateData);
                    setRecentSales(recentData || []);
                    setTopBuys(topData || []);
                }
            } catch (error) {
                // Silent fail in production
                if (process.env.NODE_ENV === 'development') console.error('Failed to fetch data:', error);
            } finally {
                clearTimeout(timeoutId);
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, []);

    // Load YouTube URL from backend on mount
    useEffect(() => {
        api.getPublicStreamUrl()
            .then(data => {
                if (process.env.NODE_ENV === 'development') console.log('[Stream URL] Loaded from API:', data);
                if (data?.url) {
                    setLiveStreamUrl(data.url);
                }
            })
            .catch((err) => {
                if (process.env.NODE_ENV === 'development') console.log('[Stream URL] Error loading:', err);
                // Ignore errors - URL may not be set
            });
    }, []);

    // Periodic state sync for robustness (every 30 seconds)
    // Only sync if WebSocket is disconnected to reduce memory usage
    useEffect(() => {
        if (isConnected) return; // Skip polling if WebSocket is connected

        const interval = setInterval(async () => {
            try {
                // Only fetch essential data, not full player list to reduce memory
                const [stateData, teamsData] = await Promise.all([
                    api.getPublicAuctionState().catch(() => null),
                    api.getPublicTeams().catch(() => []),
                ]);
                if (stateData) setAuctionState(stateData);
                if (teamsData) setTeams(teamsData);
                // Don't fetch full player list in periodic sync - only on mount or WebSocket events
            } catch (e) {
                // Silent fail - WebSocket will provide updates
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected]);



    // Trigger party popper confetti when player is sold
    useEffect(() => {
        if (shouldTriggerConfetti && typeof window !== 'undefined') {
            // Reset flag immediately
            setShouldTriggerConfetti(false);

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                try {
                    const colors = ['#10b981', '#fbbf24', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                    const duration = 5000;
                    const end = Date.now() + duration;

                    const frame = () => {
                        // Left side burst
                        confetti({
                            particleCount: 50,
                            angle: 60,
                            spread: 70,
                            origin: { x: 0, y: 0.6 },
                            colors: colors,
                            startVelocity: 45,
                            gravity: 0.8,
                            ticks: 200,
                        });
                        // Right side burst
                        confetti({
                            particleCount: 50,
                            angle: 120,
                            spread: 70,
                            origin: { x: 1, y: 0.6 },
                            colors: colors,
                            startVelocity: 45,
                            gravity: 0.8,
                            ticks: 200,
                        });
                        // Center burst
                        confetti({
                            particleCount: 100,
                            angle: 90,
                            spread: 60,
                            origin: { x: 0.5, y: 0.5 },
                            colors: colors,
                            startVelocity: 50,
                            gravity: 0.9,
                            ticks: 200,
                        });
                        // Top center burst
                        confetti({
                            particleCount: 30,
                            angle: 90,
                            spread: 45,
                            origin: { x: 0.5, y: 0.2 },
                            colors: colors,
                            startVelocity: 40,
                            gravity: 0.7,
                            ticks: 200,
                        });

                        if (Date.now() < end) {
                            requestAnimationFrame(frame);
                        }
                    };
                    frame();
                } catch (error) {
                    if (process.env.NODE_ENV === 'development') console.error('Error triggering confetti:', error);
                }
            }, 100);
        }
    }, [shouldTriggerConfetti]);

    // Track when current player changes to capture "sold" or "unsold" player
    useEffect(() => {
        const currentPlayer = auctionState?.current_player;
        const currentId = currentPlayer?.id || null;

        // If we have a new player (different from previous), clear both displays
        if (currentId && currentId !== previousPlayerId) {
            setLastSoldPlayer(null);
            setLastUnsoldPlayer(null);
            setSoldPlayerBidHistory([]);
        }

        // If we had a player and now we don't, they were sold/unsold/skipped
        // Only check if we don't already have a lastSoldPlayer set (to avoid overwriting from auction:sold event)
        if (previousPlayerId && !currentId && previousPlayer) {
            // If player was skipped, don't show unsold message
            if (wasSkippedRef.current) {
                wasSkippedRef.current = false; // Reset the flag
                // Don't set lastUnsoldPlayer
            } else if (!lastSoldPlayer) {
                // Check if player was sold (appears in recent sales)
                const soldPlayer = recentSales.find(p => p.id === previousPlayerId);
                if (soldPlayer && soldPlayer.team) {
                    setLastSoldPlayer(soldPlayer);
                    setLastUnsoldPlayer(null);
                } else {
                    // Player was unsold - use the previous player info
                    setLastUnsoldPlayer(previousPlayer);
                    setLastSoldPlayer(null);
                }
            }
        }

        // Store current player info for next comparison
        if (currentPlayer) {
            setPreviousPlayer(currentPlayer);
        }
        setPreviousPlayerId(currentId);
    }, [auctionState?.current_player?.id, recentSales, previousPlayerId, previousPlayer]);

    // Scroll visibility
    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY < 20) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlNavbar);
            return () => {
                window.removeEventListener('scroll', controlNavbar);
            };
        }
    }, []);

    // Fetch team squad when modal opens
    useEffect(() => {
        if (selectedTeam) {
            api.getPublicTeamSquad(selectedTeam.id)
                .then(data => setTeamSquad(data || []))
                .catch(() => setTeamSquad([]));
        } else {
            setTeamSquad([]);
        }
    }, [selectedTeam]);

    // Player counts
    const playerCounts = useMemo(() => ({
        available: allPlayers.filter(p => p.status === 'available').length,
        sold: allPlayers.filter(p => p.status === 'sold').length,
        unsold: allPlayers.filter(p => p.status === 'unsold').length,
    }), [allPlayers]);

    // Filtered players
    const { availablePlayers, unsoldPlayers } = useMemo(() => {
        const filtered = allPlayers.filter((player) => {
            // Role filter
            const matchesRole = roleFilter === 'All' || player.role === roleFilter;
            
            // Search filter (case-insensitive search on name, country, and role)
            const matchesSearch = searchQuery.trim() === '' || 
                player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.role.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesRole && matchesSearch;
        });
        return {
            availablePlayers: filtered.filter(p => p.status === 'available'),
            unsoldPlayers: filtered.filter(p => p.status === 'unsold')
        };
    }, [allPlayers, roleFilter, searchQuery]);

    const tabs = useMemo(() => [
        { id: 'live' as TabType, label: 'Recents', icon: Gavel, count: null },
        { id: 'available' as TabType, label: 'Available', icon: Users, count: playerCounts.available + playerCounts.unsold },
        { id: 'squads' as TabType, label: 'Squads', icon: Trophy, count: null },
    ], [playerCounts]);

    const handleTabChange = useCallback((tabId: TabType) => {
        setActiveTab(tabId);
        setRoleFilter('All');
    }, []);

    const handleRoleChange = useCallback((role: RoleFilter) => {
        setRoleFilter(role);
    }, []);

    // CRITICAL: If auction is completed, currentPlayer must be undefined regardless of state
    const currentPlayer = auctionState?.status === 'completed' ? undefined : auctionState?.current_player;
    const currentBid = auctionState?.current_bid || currentPlayer?.base_price || 0;
    const currentBidder = auctionState?.current_bidder;
    const bidHistory = auctionState?.bids || [];

    // Debug: Log state changes for auction status
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Auction State Debug] Current state:', {
                status: auctionState?.status,
                hasCurrentPlayer: !!auctionState?.current_player,
                currentPlayerName: auctionState?.current_player?.name,
            });
        }
    }, [auctionState?.status, auctionState?.current_player]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading Auction Room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100">
            {/* Premium Header */}
            <header className={`sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="gap-2 rounded-xl hover:bg-slate-100">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm sm:text-base font-bold bg-linear-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                                        Auction Room
                                    </h1>
                                    {(auctionState?.status === 'active' || auctionState?.status === 'live') && (
                                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-r from-red-100 to-orange-100 border border-red-200">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-bold text-red-600">LIVE</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Season 2026</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {auctionState?.status === 'active' && (
                                <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-linear-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <span className="text-sm font-bold text-white">LIVE</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 border border-slate-200">
                                <Eye className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-semibold text-slate-700">{teams.length} Teams</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation - Desktop: Top, Mobile: Below on-the-block card */}
            <div className={`hidden lg:block sticky z-40 bg-white border-b border-slate-200/60 transition-all duration-300 ${isVisible ? 'top-[49px] sm:top-[49px]' : 'top-0'}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 sm:py-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white scale-[1.02]'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span className={`px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Live Tab Content - Show on all screens, but only when activeTab is 'live' on lg screens */}
                <div className={`grid grid-cols-1 ${activeTab === 'live' ? 'lg:grid-cols-3' : 'lg:hidden'} gap-6 lg:gap-8`}>
                    {/* Current Player - On The Block Card */}
                    <div className="lg:col-span-2 space-y-6">
                                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-0 rounded-3xl p-3 sm:p-8 shadow-2xl shadow-blue-900/30">
                                    {/* Background Effects */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        <div className="absolute top-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-linear-to-br from-blue-500/30 to-cyan-500/20 blur-3xl animate-pulse" />
                                        <div className="absolute bottom-[-30%] left-[-15%] w-[400px] h-[400px] rounded-full bg-linear-to-br from-purple-500/25 to-pink-500/15 blur-3xl" />
                                    </div>

                                    {/* YouTube Live Stream - VISIBLE ON ALL SCREEN SIZES */}
                                    {liveStreamUrl && getYouTubeVideoId(liveStreamUrl) && auctionState?.status !== 'completed' && (
                                        <div className="-mx-3 -mt-3 sm:-mx-8 sm:-mt-8 -mb-5 relative z-10">
                                            {/* Live Stream Strip Header */}
                                            <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-white animate-ping" />
                                                    </div>
                                                    <Youtube className="w-4 h-4 text-white" />
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Stream</span>
                                                </div>
                                                {/* Sound Toggle Button */}
                                                <button
                                                    onClick={() => setIsMuted(!isMuted)}
                                                    className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                                >
                                                    {isMuted ? (
                                                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                    )}
                                                </button>
                                            </div>
                                            {/* YouTube Player */}
                                            <div className="px-2 py-2 bg-slate-800/30">
                                                <div className="relative w-full border-2 border-blue-500/50 rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                                                    <iframe
                                                        key={`stream-${isMuted}`}
                                                        className="absolute inset-0 w-full h-full"
                                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(liveStreamUrl)}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&playsinline=1`}
                                                        title="Live Stream"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>

                                            </div>

                                        </div>
                                    )}

                                    {/* CRITICAL: Check status === 'completed' FIRST - no matter what, if completed, show ended message */}
                                    {(() => {
                                        // Force check - if status is 'completed', ALWAYS show ended message
                                        const status = auctionState?.status;
                                        const isCompleted = status === 'completed';
                                        if (process.env.NODE_ENV === 'development') {
                                            console.log('[Render] Checking status. auctionState?.status:', status, 'isCompleted:', isCompleted, 'auctionState:', auctionState);
                                        }
                                        return isCompleted;
                                    })() ? (
                                        <div className="relative z-10 py-12 text-center">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                                <Trophy className="w-12 h-12 text-white" />
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Auction Ended</h2>
                                            <p className="text-lg text-indigo-200 mb-8 max-w-lg mx-auto">
                                                The auction session has officially concluded. Please review the final summaries below.
                                            </p>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                                <div className="bg-white/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                                                    <p className="text-xs text-indigo-300 font-bold uppercase mb-1">Total Sold</p>
                                                    <p className="text-2xl font-black text-white">{playerCounts.sold}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                                                    <p className="text-xs text-indigo-300 font-bold uppercase mb-1">Total Unsold</p>
                                                    <p className="text-2xl font-black text-white">{playerCounts.unsold}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm col-span-2 sm:col-span-1">
                                                    <p className="text-xs text-indigo-300 font-bold uppercase mb-1">Top Bid</p>
                                                    <p className="text-xl font-black text-white">{topBuys[0] ? formatCurrency(topBuys[0].sold_price || 0) : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : currentPlayer ? (
                                        <div className="relative z-10">
                                            {/* 2. Player Image (big) + Name/Info (row layout) */}
                                            <div className="flex flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
                                                {/* Player Image - Big */}
                                                <div className="flex-shrink-0">
                                                    <div className="relative w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/30">
                                                        {currentPlayer.image_url ? (
                                                            <img
                                                                src={getImageUrl(currentPlayer.image_url)}
                                                                alt={currentPlayer.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-white/30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Player Name & Info - Right side */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    {/* Player Name */}
                                                    <div className="mb-2">
                                                        <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-white tracking-tight truncate">
                                                            {currentPlayer.name}
                                                        </h2>
                                                    </div>
                                                    {/* Role Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-wide w-fit">
                                                        {currentPlayer.role === 'Batsman' && '🏏 '}
                                                        {currentPlayer.role === 'Bowler' && '🎯 '}
                                                        {currentPlayer.role === 'All-Rounder' && '⭐ '}
                                                        {currentPlayer.role === 'Wicket Keeper' && '🧤 '}
                                                        {currentPlayer.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 3. Base Price + Current Bid (grid below player) */}
                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                                                {/* Base Price */}
                                                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-white/5 border border-white/10">
                                                    <p className="text-[10px] sm:text-xs text-white/50 font-medium mb-1 uppercase tracking-wide">Base Price</p>
                                                    <p className="text-lg sm:text-3xl font-black text-white">{formatCurrency(currentPlayer.base_price)}</p>
                                                </div>
                                                {/* Current Bid */}
                                                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30">
                                                    <p className="text-[10px] sm:text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Current Bid</p>
                                                    <p className="text-lg sm:text-3xl font-black text-white">{formatCurrency(currentBid)}</p>
                                                </div>
                                            </div>

                                            {/* 4. Leading Bid (below base/current) */}
                                            {currentBidder && (
                                                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-transparent border border-amber-400/30 flex items-center justify-center">
                                                                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                                                            </div>
                                                            <div
                                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold border border-white/10 overflow-hidden"
                                                                style={{ backgroundColor: currentBidder.logo_url ? 'white' : currentBidder.color }}
                                                            >
                                                                {currentBidder.logo_url ? (
                                                                    <img src={getImageUrl(currentBidder.logo_url)} alt={currentBidder.name} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <span className="text-white">{currentBidder.short_name}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] sm:text-xs text-white/60 font-semibold uppercase tracking-wide">Leading</p>
                                                                <p className="text-sm sm:text-lg font-bold text-white">{currentBidder.name}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-xl sm:text-2xl font-black text-white/90">
                                                            {formatCurrency(currentBid)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 5. Bid History (at bottom) */}
                                            <div className="pt-4 border-t border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <History className="w-4 h-4 text-white/40" />
                                                        <p className="text-sm text-white/60 font-semibold">Bid History</p>
                                                    </div>
                                                    {bidHistory.length > 0 && (
                                                        <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">{bidHistory.length} bids</span>
                                                    )}
                                                </div>
                                                {bidHistory.length > 0 ? (
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {bidHistory.map((bid: Bid, index) => (
                                                            <div
                                                                key={bid.id}
                                                                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/2 border border-white/5"
                                                            >
                                                                <div className="flex items-center gap-2 sm:gap-3">
                                                                    {index === 0 && <Crown className="w-4 h-4 text-amber-400 bg-transparent" />}
                                                                    <div
                                                                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[9px] font-bold overflow-hidden"
                                                                        style={{ backgroundColor: bid.team?.logo_url ? 'white' : (bid.team?.color || '#666') }}
                                                                    >
                                                                        {bid.team?.logo_url ? (
                                                                            <img src={getImageUrl(bid.team.logo_url)} alt={bid.team.name} className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <span className="text-white">{bid.team?.short_name?.slice(0, 2) || 'T'}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs sm:text-sm text-white/70">{bid.team?.name || 'Team'}</span>
                                                                </div>
                                                                <span className="text-xs sm:text-sm font-bold text-white/80">
                                                                    {formatCurrency(bid.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                                                        <p className="text-sm text-white/40">Waiting for bids</p>
                                                        <p className="text-xs text-white/25 mt-1">Starting at {formatCurrency(currentPlayer.base_price)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : auctionState?.status === 'paused' ? (
                                        <div className="relative z-10 py-12 text-center">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-900/10 backdrop-blur-sm">
                                                <Coffee className="w-10 h-10 text-amber-400" />
                                            </div>
                                            <h2 className="text-3xl font-black text-white mb-3">Session Paused</h2>
                                            <p className="text-lg text-indigo-200/80 max-w-md mx-auto leading-relaxed">
                                                The auctioneer has called a Short Break. Bidding will resume shortly.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative z-10 py-8 sm:py-12">
                                            {lastSoldPlayer ? (
                                                // Show sold player and team images in On The Block section
                                                <div className="relative z-10 py-3 sm:py-6 px-2 sm:px-4 w-full">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3 sm:mb-6 animate-bounce">
                                                            <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                                                            <span className="text-xs sm:text-lg font-bold text-emerald-400 uppercase tracking-widest">Player Sold!</span>
                                                        </div>

                                                        {/* Player and Team Images - Side by Side */}
                                                        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-3 sm:mb-6 w-full">
                                                            {/* Player Image */}
                                                            <div className="flex flex-col items-center flex-1 max-w-[200px] sm:max-w-none">
                                                                <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-2 sm:border-4 border-emerald-400/50 shadow-xl sm:shadow-2xl bg-slate-100 relative">
                                                                    {lastSoldPlayer.image_url ? (
                                                                        <img
                                                                            src={getImageUrl(lastSoldPlayer.image_url)}
                                                                            alt={lastSoldPlayer.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                                            <Users className="w-16 h-16 sm:w-24 sm:h-24 text-slate-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-1.5 sm:mt-3 text-center">
                                                                    <h3 className="text-xs sm:text-base md:text-xl lg:text-2xl font-black text-white mb-0.5 sm:mb-1 shadow-black/50 drop-shadow-md line-clamp-2">{lastSoldPlayer.name}</h3>
                                                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-[9px] sm:text-[10px] font-semibold">{lastSoldPlayer.role}</span>
                                                                </div>
                                                            </div>

                                                            {/* Team Image - Show on right side */}
                                                            {lastSoldPlayer.team && (
                                                                <div className="flex flex-col items-center flex-1 max-w-[200px] sm:max-w-none">
                                                                    <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-2 sm:border-4 border-emerald-400/50 shadow-xl sm:shadow-2xl bg-white relative">
                                                                        {lastSoldPlayer.team.logo_url ? (
                                                                            <img
                                                                                src={getImageUrl(lastSoldPlayer.team.logo_url)}
                                                                                alt={lastSoldPlayer.team.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: lastSoldPlayer.team.color }}>
                                                                                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{lastSoldPlayer.team.short_name}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1.5 sm:mt-3 text-center">
                                                                        <p className="text-[9px] sm:text-[10px] text-amber-400 font-bold uppercase mb-0.5">New Team</p>
                                                                        <h3 className="text-xs sm:text-base md:text-xl lg:text-2xl font-bold text-white shadow-black/50 drop-shadow-md line-clamp-2">{lastSoldPlayer.team.name}</h3>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Sold Price Info */}
                                                        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-4 border border-white/20 shadow-xl text-center mb-3 sm:mb-6 w-full">
                                                            <p className="text-[10px] sm:text-xs text-indigo-200 uppercase font-bold mb-1">Sold For</p>
                                                            <p className="text-xl sm:text-3xl md:text-4xl font-black text-emerald-400 drop-shadow-lg">
                                                                {formatCurrency(lastSoldPlayer.sold_price || lastSoldPlayer.base_price)}
                                                            </p>
                                                        </div>

                                                        {/* Toss/Tie-Breaker Indicator - Show when sold at max bid with competing teams */}
                                                        {lastSoldPlayer.sold_price === 50000 && soldPlayerBidHistory.filter(b => b.amount === 50000).length > 1 && (
                                                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-xl px-4 py-3 border border-amber-400/30 shadow-xl text-center mb-3 sm:mb-6 w-full animate-fadeIn">
                                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                                    <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                                                        <span className="text-xs">🎲</span>
                                                                    </div>
                                                                    <p className="text-xs sm:text-sm text-amber-300 font-bold uppercase tracking-wide">
                                                                        Awarded via Toss
                                                                    </p>
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs text-white/70">
                                                                    Tie-breaker between{' '}
                                                                    {(() => {
                                                                        const maxBidTeams = soldPlayerBidHistory
                                                                            .filter(b => b.amount === 50000)
                                                                            .reduce((acc: { id: string; name: string }[], bid) => {
                                                                                if (bid.team && !acc.find(t => t.id === bid.team?.id)) {
                                                                                    acc.push({ id: bid.team.id, name: bid.team.name });
                                                                                }
                                                                                return acc;
                                                                            }, []);
                                                                        return maxBidTeams.map((t, i) => (
                                                                            <span key={t.id}>
                                                                                <span className="font-semibold text-amber-300">{t.name}</span>
                                                                                {i < maxBidTeams.length - 1 && (i === maxBidTeams.length - 2 ? ' & ' : ', ')}
                                                                            </span>
                                                                        ));
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Bid History - Hidden on very small screens, shown on sm+ */}
                                                        {soldPlayerBidHistory.length > 0 && (
                                                            <div className="w-full max-w-2xl mt-3 sm:mt-6 hidden sm:block">
                                                                <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                                                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                                                        <p className="text-[10px] sm:text-xs text-white/50 font-semibold uppercase tracking-wide">Bid History</p>
                                                                        <span className="text-[10px] sm:text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{soldPlayerBidHistory.length} bids</span>
                                                                    </div>
                                                                    <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto pr-1">
                                                                        {soldPlayerBidHistory.map((bid: Bid, index) => (
                                                                            <div key={bid.id} className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg transition-all bg-white/2 border border-white/5 hover:bg-white/3">
                                                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                    {index === 0 && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 bg-transparent" />}
                                                                                    <div
                                                                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white overflow-hidden bg-white"
                                                                                        style={{ backgroundColor: bid.team?.logo_url ? 'white' : (bid.team?.color || '#666') }}
                                                                                    >
                                                                                        {bid.team?.logo_url ? (
                                                                                            <img src={getImageUrl(bid.team.logo_url)} alt={bid.team.name} className="w-full h-full object-contain" />
                                                                                        ) : (
                                                                                            bid.team?.short_name?.slice(0, 2) || 'T'
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xs sm:text-sm text-white/80 truncate max-w-[100px] sm:max-w-none">{bid.team?.name || 'Team'}</span>
                                                                                </div>
                                                                                <span className="text-xs sm:text-sm font-bold text-white">{formatCurrency(bid.amount)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-center gap-3 text-white/60 animate-pulse mt-6">
                                                        <Coffee className="w-5 h-5" />
                                                        <p className="text-base font-medium">Waiting for host to select next player...</p>
                                                    </div>
                                                </div>
                                            ) : lastUnsoldPlayer ? (
                                                // Show unsold player info
                                                <div className="relative z-10 py-8 px-4 w-full">
                                                    <div className="flex flex-col items-center justify-center mb-8">
                                                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-500/20 border border-slate-500/30 mb-8">
                                                            <Gavel className="w-6 h-6 text-slate-400" />
                                                            <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">Player Unsold</span>
                                                        </div>

                                                        {/* Player Image Only */}
                                                        <div className="relative mb-6">
                                                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-slate-400/50 shadow-2xl bg-slate-200 grayscale relative">
                                                                {lastUnsoldPlayer.image_url ? (
                                                                    <img
                                                                        src={getImageUrl(lastUnsoldPlayer.image_url)}
                                                                        alt={lastUnsoldPlayer.name}
                                                                        className="w-full h-full object-cover opacity-80"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                                        <Users className="w-24 h-24 text-slate-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-4 py-1 rounded-full text-sm font-bold border border-slate-600">
                                                                UNSOLD
                                                            </div>
                                                        </div>

                                                        <h3 className="text-3xl md:text-4xl font-black text-white mb-2 opacity-80">{lastUnsoldPlayer.name}</h3>
                                                        <p className="text-slate-400 text-lg mb-6 max-w-md text-center">
                                                            No bids received at base price <span className="text-white font-bold">{formatCurrency(lastUnsoldPlayer.base_price)}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-center gap-3 text-white/50 animate-pulse">
                                                        <Coffee className="w-5 h-5" />
                                                        <p className="text-base font-medium">Waiting for host to select next player...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Default waiting state / Live announcement
                                                <div className="text-center py-4">
                                                    {auctionState?.status === 'live' ? (
                                                        // LIVE ANNOUNCEMENT - Make it very prominent
                                                        <>
                                                            <div className="mb-10 relative">
                                                                {/* Decorative background elements */}
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <div className="w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl animate-pulse" />
                                                                </div>

                                                                {/* Main banner container */}
                                                                <div className="relative z-10 backdrop-blur-sm bg-white/5 rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl">
                                                                    {/* Gradient text effect */}
                                                                    <div className="relative inline-block">
                                                                        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-4 tracking-tight relative">
                                                                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                                                                                SPL
                                                                            </span>
                                                                            {/* Glow effect */}
                                                                            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent blur-xl opacity-50 animate-pulse">
                                                                                SPL
                                                                            </span>
                                                                        </h1>
                                                                    </div>

                                                                    {/* Subtitle with modern styling */}
                                                                    <div className="flex items-center justify-center gap-3 mt-2">
                                                                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                                                                        <p className="text-sm sm:text-base lg:text-lg text-indigo-200/90 font-semibold tracking-[0.2em] uppercase letter-spacing-wider">
                                                                            Sambalpur Premier League
                                                                        </p>
                                                                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                                                                    </div>

                                                                    {/* Decorative dots */}
                                                                    <div className="flex items-center justify-center gap-2 mt-4">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-400/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                                                                        <div className="w-2 h-2 rounded-full bg-purple-400/60 animate-pulse" style={{ animationDelay: '200ms' }} />
                                                                        <div className="w-2 h-2 rounded-full bg-pink-400/60 animate-pulse" style={{ animationDelay: '400ms' }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 mb-4">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                                <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Live Now</span>
                                                            </div>
                                                            <h3 className="text-3xl sm:text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
                                                                <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 animate-pulse" />
                                                                <span className="animate-pulse">Auction is LIVE!</span>
                                                            </h3>
                                                            <p className="text-lg text-indigo-200 max-w-md mx-auto mb-6">
                                                                Owners are preparing their strategies.
                                                                <br />
                                                                <span className="text-white font-semibold">Waiting for the first player to appear on the block...</span>
                                                            </p>
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        // Not started yet
                                                        <>
                                                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                                <Gavel className="w-10 h-10 text-white/50" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white mb-3">
                                                                Waiting for Auction to Start
                                                            </h3>
                                                            <p className="text-white/50">The host will begin the auction shortly.</p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Credit */}
                                    <div className="relative z-10 mt-2 pt-2 border-t border-white/10">
                                        <p className="text-[9px] sm:text-[10px] text-white/30 text-center">
                                            Website Created and Hosted by Sonu Yadav (Cadax Ventures Private Limited) . contact: 8956636255
                                        </p>
                                    </div>
                                </Card>

                                {/* Tab Navigation - Mobile: Below on-the-block card */}
                                <div className="lg:hidden bg-white border-b border-slate-200/60 -mx-2 sm:-mx-6 px-2 sm:px-6">
                                    <div className="flex justify-center gap-1.5 overflow-x-auto no-scrollbar py-2 sm:py-3">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => handleTabChange(tab.id)}
                                                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white scale-[1.02]'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    {tab.label}
                                                    {tab.count !== null && (
                                                        <span className={`px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                            {tab.count}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recents/Top Purchases and Teams Budget - Mobile only, shown in Recents tab */}
                                {activeTab === 'live' && (
                                    <div className="lg:hidden space-y-6 mt-6 -mx-2 sm:-mx-6 px-2 sm:px-6">
                                        {/* Stats Card */}
                                        <Card className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-xl">
                                                    <button
                                                        onClick={() => setActiveStatsTab('recent')}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatsTab === 'recent'
                                                            ? 'bg-white text-emerald-600 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                        Recent Sales
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveStatsTab('top')}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatsTab === 'top'
                                                            ? 'bg-white text-purple-600 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        <Crown className="w-3.5 h-3.5" />
                                                        Top Buys
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="max-h-[340px] overflow-y-auto">
                                                {activeStatsTab === 'recent' ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {recentSales.length > 0 ? recentSales.map((player, index) => (
                                                            <div key={player.id || index} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="font-bold text-slate-900">{player.name}</span>
                                                                    <span className="font-bold text-emerald-600">{formatCurrency(player.sold_price || 0)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <span className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden bg-slate-100">
                                                                            {player.team?.logo_url ? (
                                                                                <img src={getImageUrl(player.team.logo_url)} alt={player.team.name} className="w-full h-full object-contain" />
                                                                            ) : (
                                                                                <span className="w-full h-full" style={{ backgroundColor: player.team?.color || '#666' }} />
                                                                            )}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">{player.team?.name || 'Team'}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <p className="text-center text-slate-400 py-8">No recent sales</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100">
                                                        {topBuys.length > 0 ? topBuys.map((player, index) => (
                                                            <div key={player.id || index} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                            index === 1 ? 'bg-slate-100 text-slate-700' :
                                                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                                    'bg-slate-50 text-slate-500'
                                                                            }`}>
                                                                            {index + 1}
                                                                        </span>
                                                                        <span className="font-bold text-slate-900">{player.name}</span>
                                                                    </div>
                                                                    <span className="font-bold text-purple-600">{formatCurrency(player.sold_price || 0)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between pl-7">
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <span className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden bg-slate-100">
                                                                            {player.team?.logo_url ? (
                                                                                <img src={getImageUrl(player.team.logo_url)} alt={player.team.name} className="w-full h-full object-contain" />
                                                                            ) : (
                                                                                <span className="w-full h-full" style={{ backgroundColor: player.team?.color || '#666' }} />
                                                                            )}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">{player.team?.name || 'Team'}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <p className="text-center text-slate-400 py-8">No top buys yet</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>

                                        {/* Team Budgets */}
                                        <Card className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-3 sm:p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                                                        <Shield className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">Team Budgets</h3>
                                                        <p className="text-xs text-slate-500">Remaining purse</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 sm:p-4">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {teams.map((team) => (
                                                        <div
                                                            key={team.id}
                                                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-4"
                                                        >
                                                            {/* Left: Logo & Name */}
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div
                                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-white overflow-hidden border border-slate-100 shadow-sm shrink-0"
                                                                    style={{ backgroundColor: team.logo_url ? 'white' : team.color }}
                                                                >
                                                                    {team.logo_url ? (
                                                                        <img src={getImageUrl(team.logo_url)} alt={team.name} className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        team.short_name
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-slate-900 text-base truncate">{team.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                                        <span>{team.player_count || 0} Players</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        <span>{formatCurrency(team.budget)} Total</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right: Remaining Purse & Progress */}
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Purse Left</p>
                                                                <p className="text-lg font-black text-emerald-600">{formatCurrency(team.remaining_budget || team.budget)}</p>

                                                                {/* Small Progress Bar */}
                                                                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1 ml-auto" title="Budget used">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${((team.spent || 0) / team.budget) * 100}%`,
                                                                            backgroundColor: team.color
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar - Desktop only */}
                            <div className="hidden lg:block space-y-6">

                                {/* Stats Card */}
                                <Card className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-xl">
                                            <button
                                                onClick={() => setActiveStatsTab('recent')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatsTab === 'recent'
                                                    ? 'bg-white text-emerald-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                Recent Sales
                                            </button>
                                            <button
                                                onClick={() => setActiveStatsTab('top')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${activeStatsTab === 'top'
                                                    ? 'bg-white text-purple-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                <Crown className="w-3.5 h-3.5" />
                                                Top Buys
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-h-[340px] overflow-y-auto">
                                        {activeStatsTab === 'recent' ? (
                                            <div className="divide-y divide-slate-100">
                                                {recentSales.length > 0 ? recentSales.map((player, index) => (
                                                    <div key={player.id || index} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="font-bold text-slate-900">{player.name}</span>
                                                            <span className="font-bold text-emerald-600">{formatCurrency(player.sold_price || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden bg-slate-100">
                                                                    {player.team?.logo_url ? (
                                                                        <img src={getImageUrl(player.team.logo_url)} alt={player.team.name} className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <span className="w-full h-full" style={{ backgroundColor: player.team?.color || '#666' }} />
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-slate-500">{player.team?.name || 'Team'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-center text-slate-400 py-8">No recent sales</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {topBuys.length > 0 ? topBuys.map((player, index) => (
                                                    <div key={player.id || index} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    index === 1 ? 'bg-slate-100 text-slate-700' :
                                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-slate-50 text-slate-500'
                                                                    }`}>
                                                                    {index + 1}
                                                                </span>
                                                                <span className="font-bold text-slate-900">{player.name}</span>
                                                            </div>
                                                            <span className="font-bold text-purple-600">{formatCurrency(player.sold_price || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between pl-7">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden bg-slate-100">
                                                                    {player.team?.logo_url ? (
                                                                        <img src={getImageUrl(player.team.logo_url)} alt={player.team.name} className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <span className="w-full h-full" style={{ backgroundColor: player.team?.color || '#666' }} />
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-slate-500">{player.team?.name || 'Team'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-center text-slate-400 py-8">No top buys yet</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Team Budgets */}
                                <Card className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="p-3 sm:p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                                                <Shield className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Team Budgets</h3>
                                                <p className="text-xs text-slate-500">Remaining purse</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 sm:p-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            {teams.map((team) => (
                                                <div
                                                    key={team.id}
                                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-4"
                                                >
                                                    {/* Left: Logo & Name */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-white overflow-hidden border border-slate-100 shadow-sm shrink-0"
                                                            style={{ backgroundColor: team.logo_url ? 'white' : team.color }}
                                                        >
                                                            {team.logo_url ? (
                                                                <img src={getImageUrl(team.logo_url)} alt={team.name} className="w-full h-full object-contain" />
                                                            ) : (
                                                                team.short_name
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 text-base truncate">{team.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                                <span>{team.player_count || 0} Players</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                <span>{formatCurrency(team.budget)} Total</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Remaining Purse & Progress */}
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Purse Left</p>
                                                        <p className="text-lg font-black text-emerald-600">{formatCurrency(team.remaining_budget || team.budget)}</p>

                                                        {/* Small Progress Bar */}
                                                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1 ml-auto" title="Budget used">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${((team.spent || 0) / team.budget) * 100}%`,
                                                                    backgroundColor: team.color
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                {/* Available Players Tab */}
                {
                    activeTab === 'available' && (
                        <div className={`space-y-6 ${activeTab === 'available' ? 'lg:block' : 'lg:hidden'}`}>
                            {/* Sub Tabs & Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="p-1 bg-slate-100 rounded-xl inline-flex">
                                    <button
                                        onClick={() => setActiveAvailableSubTab('available')}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeAvailableSubTab === 'available'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Available
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeAvailableSubTab === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {availablePlayers.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveAvailableSubTab('unsold')}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeAvailableSubTab === 'unsold'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Unsold
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeAvailableSubTab === 'unsold' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {unsoldPlayers.length}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                                    {(['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'] as RoleFilter[]).map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => handleRoleChange(role)}
                                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${roleFilter === role
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search players by name or role..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                                />
                            </div>

                            {/* Player List */}
                            <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="max-h-[600px] overflow-y-auto">
                                    {activeAvailableSubTab === 'available' ? (
                                        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex flex-col gap-2 p-4">
                                                {availablePlayers.length > 0 ? (
                                                    availablePlayers.map((player) => (
                                                        <PlayerListItem key={player.id} player={player} />
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-50 flex items-center justify-center">
                                                            <Users className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-slate-900 font-medium">No available players found</p>
                                                        <p className="text-sm text-slate-500">Try changing the role filter</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    ) : (
                                        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex flex-col gap-3 p-4">
                                                {unsoldPlayers.length > 0 ? (
                                                    unsoldPlayers.map((player) => (
                                                        <PlayerListItem key={player.id} player={player} />
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-50 flex items-center justify-center">
                                                            <Users className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-slate-900 font-medium">No unsold players</p>
                                                        <p className="text-sm text-slate-500">All players have been sold!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )
                }

                {/* Squads Tab */}
                {
                    activeTab === 'squads' && (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${activeTab === 'squads' ? 'lg:block' : 'lg:hidden'}`}>
                            {teams.map((team) => (
                                <Card key={team.id} className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 bg-white">
                                    <div className="p-4 flex flex-row gap-4">
                                        {/* Image on the left - bigger */}
                                        <div className="flex-shrink-0">
                                            {team.logo_url ? (
                                                <img
                                                    src={getImageUrl(team.logo_url)}
                                                    alt={team.name}
                                                    className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-contain shadow-inner bg-white border border-slate-200"
                                                />
                                            ) : (
                                                <div
                                                    className="w-32 h-32 md:w-40 md:h-40 rounded-xl flex items-center justify-center shadow-inner text-white font-bold text-2xl md:text-3xl"
                                                    style={{ backgroundColor: team.color }}
                                                >
                                                    {team.short_name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content on the right */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 leading-tight mb-1 truncate">{team.name}</h3>
                                                <p className="text-xs text-slate-500 font-medium mb-3">{team.player_count || 0} Players</p>
                                                
                                                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-3">
                                                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Purse Remaining</p>
                                                    <p className="text-base font-black text-emerald-600">{formatCurrency(team.remaining_budget || team.budget)}</p>
                                                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${((team.spent || 0) / team.budget) * 100}%`,
                                                                backgroundColor: team.color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => setSelectedTeam(team)}
                                                variant="outline"
                                                className="w-full h-8 text-xs font-semibold border-slate-200 hover:bg-slate-900 hover:text-white"
                                            >
                                                View Squad
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                }

                {/* Team Squad Modal */}
                <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl !bg-white dark:!bg-white !text-slate-900 dark:!text-slate-900 !backdrop-blur-none" style={{ filter: 'none', backdropFilter: 'none' }}>
                        {selectedTeam && (
                            <>
                                <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50" style={{ backdropFilter: 'none', filter: 'none' }}>
                                    <div className="flex items-center gap-4">
                                        {selectedTeam.logo_url ? (
                                            <img
                                                src={getImageUrl(selectedTeam.logo_url)}
                                                alt={selectedTeam.name}
                                                className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200"
                                            />
                                        ) : (
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: selectedTeam.color }}
                                            >
                                                {selectedTeam.short_name}
                                            </div>
                                        )}
                                        <div>
                                            <DialogTitle className="text-xl font-bold !text-slate-900 dark:!text-slate-900">{selectedTeam.name}</DialogTitle>
                                            <DialogDescription className="!text-slate-500 dark:!text-slate-500">
                                                Squad List • {teamSquad.length} Players
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="p-6 overflow-y-auto">
                                    <div className="flex flex-col gap-3">
                                        {teamSquad.length > 0 ? (
                                            teamSquad.map((player) => (
                                                <PlayerListItem key={player.id} player={player} />
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Users className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">No players purchased yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm" style={{ backdropFilter: 'none', filter: 'none' }}>
                                    <span className="text-slate-500 font-medium">Total Spent</span>
                                    <span className="font-bold text-slate-900 text-lg">{formatCurrency(selectedTeam.spent || 0)}</span>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </main >
        </div >
    );
}



