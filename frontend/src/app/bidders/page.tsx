'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy,
    Wallet,
    Users,
    Gavel,
    Clock,
    TrendingUp,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    MoreVertical,
    ChevronRight,
    Play,
    Pause,
    SkipForward,
    LogOut,
    Coffee,
    Eye,
    EyeOff,
    Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import api from '@/lib/api';
import { toast } from 'sonner';
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
    foreign_count?: number;
    max_players?: number;
    max_foreign?: number;
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
    image_url?: string;
    team_id?: string;
    team?: Team;
    badge?: string;
    stats?: {
        matches?: number;
        runs?: number;
        wickets?: number;
        sr?: number;
    };
}

interface Bid {
    id: string;
    amount: number;
    team_id: string;
    team?: Team;
    created_at: string;
    status?: string;
}

interface AuctionState {
    status: string;
    current_player?: Player;
    current_bid?: number;
    current_bidder?: Team;
    timer_remaining?: number;
    bids?: Bid[];
    bid_frozen?: boolean;
}

// --- Helpers ---
const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
    return `₹ ${value.toLocaleString()}`;
};

export default function BidderDashboard() {
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [mySquad, setMySquad] = useState<Player[]>([]);
    const [upcomingQueue, setUpcomingQueue] = useState<Player[]>([]);
    const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
    const [bidHistory, setBidHistory] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBidding, setIsBidding] = useState(false);
    const [notifications, setNotifications] = useState<string[]>([]);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Auth and role check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!authLoading && user && !['super_admin', 'admin', 'bidder'].includes(user.role)) {
            if (user.role === 'host') {
                router.push('/host');
            } else {
                router.push('/auctions');
            }
        }
    }, [isAuthenticated, authLoading, user, router]);

    // WebSocket event handler
    const handleWebSocketMessage = useCallback((event: string, data: any) => {
        switch (event) {
            case 'auction:state':
                setAuctionState(data);
                if (data?.bids) {
                    setBidHistory(data.bids);
                }
                break;
            case 'auction:bid':
                // Update bid history with new bid
                setBidHistory(prev => [data, ...prev]);
                setAuctionState(prev => prev ? {
                    ...prev,
                    current_bid: data.amount,
                    current_bidder: data.team,
                    bid_frozen: true, // Freeze for everyone on new bid
                } : null);
                // Notify if outbid
                if (myTeam && data.team_id !== myTeam.id && auctionState?.current_bidder?.id === myTeam.id) {
                    toast.warning(`Outbid by ${data.team?.name}!`);
                }
                break;
            case 'auction:sold':
                // Refresh team data if we bought the player
                if (user?.team_id && data.team?.id === user.team_id) {
                    toast.success(`You won ${data.player?.name}!`);
                    api.getTeam(user.team_id).then(t => setMyTeam(t));
                    api.getTeamSquad(user.team_id).then(s => setMySquad(s || []));
                }
                // Refresh upcoming queue after player is sold
                api.getPlayerQueue(10).then(queue => setUpcomingQueue(queue || [])).catch(() => { });
                break;
            case 'auction:player-changed':
                setAuctionState(prev => ({
                    status: prev?.status || 'active',
                    ...prev,
                    current_player: data,
                    current_bid: data.base_price,
                    current_bidder: undefined,
                    bids: [],
                }));
                setBidHistory([]);
                // Refresh upcoming queue when player changes
                api.getPlayerQueue(10).then(queue => setUpcomingQueue(queue || [])).catch(() => { });
                break;
            case 'auction:unsold':
                // Refresh upcoming queue after player is marked unsold
                api.getPlayerQueue(10).then(queue => setUpcomingQueue(queue || [])).catch(() => { });
                break;
            case 'auction:live':
                // Auction is now live - show notification and update state
                toast.success('🔴 Auction is now LIVE!');
                setAuctionState(prev => prev ? { ...prev, status: 'live' } : { status: 'live' });
                break;
            case 'auction:reset':
                // Auction was reset - refresh everything
                toast.info('Auction has been reset');
                Promise.all([
                    api.getAuctionState().catch(() => null),
                    api.getPlayerQueue(10).catch(() => [])
                ]).then(([state, queue]) => {
                    if (state) {
                        setAuctionState(state);
                        if (state.bids) setBidHistory(state.bids);
                    }
                    if (queue) setUpcomingQueue(queue);
                });
                if (user?.team_id) {
                    api.getTeam(user.team_id).then(t => setMyTeam(t));
                    api.getTeamSquad(user.team_id).then(s => setMySquad(s || []));
                }
                break;
        }
    }, [myTeam, user?.team_id, auctionState?.current_bidder?.id]);

    // WebSocket connection with reconnection state sync
    const { isConnected, reconnect } = useWebSocket({
        token: api.getToken(),
        enabled: isAuthenticated,
        onMessage: handleWebSocketMessage,
        onOpen: useCallback(() => {
            // Sync state on WebSocket connection/reconnection
            Promise.all([
                api.getAuctionState().catch(() => null),
                api.getPlayerQueue(10).catch(() => [])
            ]).then(([state, queue]) => {
                if (state) {
                    setAuctionState(state);
                    if (state.bids) setBidHistory(state.bids);
                }
                if (queue) setUpcomingQueue(queue);
            }).catch(() => { });
        }, []),
    });

    // Fetch initial data
    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        setLoading(true);
        try {
            // Fetch auction state and queue
            const [stateData, queueData] = await Promise.all([
                api.getAuctionState().catch(() => null),
                api.getPlayerQueue(10).catch(() => []),
            ]);

            setAuctionState(stateData);
            setUpcomingQueue(queueData || []);

            if (stateData?.bids) {
                setBidHistory(stateData.bids);
            }

            // Fetch team data if user has a team
            if (user.team_id) {
                const [teamData, squadData] = await Promise.all([
                    api.getTeam(user.team_id).catch(() => null),
                    api.getTeamSquad(user.team_id).catch(() => []),
                ]);
                setMyTeam(teamData);
                setMySquad(squadData || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Periodic state sync for robustness (every 30 seconds)
    useEffect(() => {
        if (!isConnected || !isAuthenticated) return;

        const interval = setInterval(async () => {
            try {
                const [stateData, queueData] = await Promise.all([
                    api.getAuctionState().catch(() => null),
                    api.getPlayerQueue(10).catch(() => [])
                ]);
                if (stateData) {
                    setAuctionState(stateData);
                    if (stateData.bids) setBidHistory(stateData.bids);
                }
                if (queueData) setUpcomingQueue(queueData);
                // Also refresh team data
                if (user?.team_id) {
                    const teamData = await api.getTeam(user.team_id).catch(() => null);
                    if (teamData) setMyTeam(teamData);
                }
            } catch (e) {
                // Silent fail - WebSocket will provide updates
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected, isAuthenticated, user?.team_id]);

    // Auto-clear frozen state
    useEffect(() => {
        if (auctionState?.bid_frozen) {
            const timer = setTimeout(() => {
                setAuctionState(prev => prev ? { ...prev, bid_frozen: false } : null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [auctionState?.bid_frozen]);

    // Bid ladder - same as backend
    const BID_LADDER = [
        2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
        12000, 14000, 16000, 18000, 20000,
        24000, 28000, 32000, 36000, 40000, 45000, 50000,
    ];
    const MAX_BID = 50000;

    // Get next valid bid amount from the ladder
    const getNextBidAmount = () => {
        const currentBid = auctionState?.current_bid || 0;
        const basePrice = auctionState?.current_player?.base_price || 2000;
        const hasBidder = !!auctionState?.current_bidder;

        // If no bids yet (no current bidder), first bid should be at base_price
        if (!hasBidder) {
            // Find base price in ladder or return base price
            for (const amount of BID_LADDER) {
                if (amount >= basePrice) return amount;
            }
            return basePrice;
        }

        // Find the next bid in the ladder (must be > current bid)
        for (const amount of BID_LADDER) {
            if (amount > currentBid) return amount;
        }
        // At max bid, can still bid 50000 (tie allowed)
        return MAX_BID;
    };

    // Get upcoming bid options (next 3 valid amounts)
    const getUpcomingBids = () => {
        const currentBid = auctionState?.current_bid || 0;
        const hasBidder = !!auctionState?.current_bidder;
        const upcoming: number[] = [];

        for (const amount of BID_LADDER) {
            // If no bidder yet, include amounts >= current_bid (which is base_price)
            // If there is a bidder, only include amounts > current_bid
            if ((!hasBidder && amount >= currentBid) || (hasBidder && amount > currentBid)) {
                upcoming.push(amount);
                if (upcoming.length >= 3) break;
            }
        }

        // If at or near max, show 50000 option
        if (upcoming.length === 0 || (currentBid >= MAX_BID - 5000 && !upcoming.includes(MAX_BID))) {
            upcoming.push(MAX_BID);
        }

        return upcoming.slice(0, 3);
    };

    // Handle placing a bid
    const handlePlaceBid = async (amount?: number) => {
        if (!myTeam) {
            toast.error('You must be assigned to a team to bid');
            return;
        }

        const bidAmount = amount || getNextBidAmount();

        // Check budget
        if (bidAmount > (myTeam.remaining_budget || myTeam.budget)) {
            toast.error('Insufficient budget for this bid');
            return;
        }

        setIsBidding(true);
        try {
            await api.placeBid(bidAmount);
            toast.success(`Bid placed: ${formatCurrency(bidAmount)}`);
            setNotifications(prev => [`Bid placed for ${formatCurrency(bidAmount)}`, ...prev.slice(0, 4)]);

            // Refresh auction state
            const stateData = await api.getAuctionState();
            setAuctionState(stateData);
            if (stateData?.bids) {
                setBidHistory(stateData.bids);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to place bid');
        } finally {
            setIsBidding(false);
        }
    };

    // Handle quick bid from ladder
    const handleQuickBid = (amount: number) => {
        handlePlaceBid(amount);
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading Bidder Dashboard...</p>
                </div>
            </div>
        );
    }

    const currentPlayer = auctionState?.current_player;
    const currentBid = auctionState?.current_bid || currentPlayer?.base_price || 0;
    const currentBidder = auctionState?.current_bidder;
    const isMyBid = currentBidder?.id === myTeam?.id;
    const isFrozen = auctionState?.bid_frozen || false;

    // Team profile data (from API or defaults)
    const teamProfile = myTeam || {
        name: user?.name || 'Your Team',
        short_name: 'YT',
        color: '#3B82F6',
        budget: 100000000,
        remaining_budget: 100000000,
        player_count: 0,
        max_players: 25,
        foreign_count: 0,
        max_foreign: 8,
        logo_url: '',
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col h-screen">

            {/* --- Top Navigation / Header --- */}
            {isHeaderVisible && (
                <header className="h-auto py-2 lg:py-0 lg:h-16 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between px-3 lg:px-6 sticky top-0 z-50 shrink-0 gap-2">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div
                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg text-white font-bold bg-white"
                            style={{ backgroundColor: teamProfile.logo_url ? 'white' : (teamProfile.color || '#3B82F6') }}
                        >
                            {teamProfile.logo_url ? (
                                <img src={getImageUrl(teamProfile.logo_url)} alt={teamProfile.name} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                teamProfile.short_name || 'BT'
                            )}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm lg:text-base text-slate-800 leading-tight">{teamProfile.name}</h1>
                            <p className="text-[10px] lg:text-xs text-slate-500 font-medium tracking-wide uppercase">Bidder Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6 ml-auto">
                        {/* Live Connection Status */}
                        <div className={`flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            <span className="relative flex h-2 w-2 lg:h-2.5 lg:w-2.5">
                                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 lg:h-2.5 lg:w-2.5 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            </span>
                            <span className="text-[10px] lg:text-xs font-bold">{isConnected ? 'Live' : '...'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsHeaderVisible(false)}
                                title="Hide header"
                                className="h-8 w-8 lg:h-9 lg:w-9"
                            >
                                <EyeOff className="w-3 h-3 lg:w-4 lg:h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="h-8 w-8 lg:h-9 lg:w-9">
                                <LogOut className="w-3 h-3 lg:w-4 lg:h-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </header>
            )}

            {/* Subheader with Show Header Button when header is hidden */}
            {!isHeaderVisible && (
                <div className="sticky top-0 z-50 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-6 py-2 h-12">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg text-white font-bold"
                            style={{ backgroundColor: teamProfile.color || '#3B82F6' }}
                        >
                            {teamProfile.short_name || 'BT'}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-slate-800 leading-tight">{teamProfile.name}</h1>
                            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Bidder Dashboard</p>
                        </div>
                        {auctionState?.status === 'active' || auctionState?.status === 'live' ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 border border-red-200">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-red-600">Live</span>
                            </div>
                        ) : null}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHeaderVisible(true)}
                        className="gap-2 rounded-xl hover:bg-slate-100 text-slate-600"
                        title="Show header"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Show Header</span>
                    </Button>
                </div>
            )}

            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden h-full">

                {/* --- Left Sidebar: Squad & Stats --- */}
                <aside className="w-full lg:w-80 order-2 lg:order-1 bg-white border-t lg:border-t-0 lg:border-r border-slate-200 flex flex-col shrink-0 h-auto lg:h-full">
                    <div className="p-4 lg:p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-2 lg:mb-4">
                            <h2 className="font-bold text-slate-800 text-sm lg:text-base">Budget Overview</h2>
                            <Wallet className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3 lg:gap-4">
                                <div>
                                    <p className="text-[10px] lg:text-xs text-slate-500 mb-1">Total Spent</p>
                                    <p className="text-xl lg:text-2xl font-black text-slate-900">
                                        {formatCurrency(teamProfile.budget - (teamProfile.remaining_budget || teamProfile.budget))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] lg:text-xs text-slate-500 mb-1">Remaining in Purse</p>
                                    <p className="text-xl lg:text-2xl font-black text-slate-900">
                                        {formatCurrency(teamProfile.remaining_budget || teamProfile.budget)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Progress
                                    value={((teamProfile.budget - (teamProfile.remaining_budget || teamProfile.budget)) / teamProfile.budget) * 100}
                                    className="h-1.5 lg:h-2"
                                />
                                <div className="flex justify-between text-[10px] lg:text-xs mt-1 text-slate-400">
                                    <span>
                                        {(((teamProfile.budget - (teamProfile.remaining_budget || teamProfile.budget)) / teamProfile.budget) * 100).toFixed(0)}% Spent
                                    </span>
                                    <span>Total: {formatCurrency(teamProfile.budget)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 lg:gap-3">
                                <div className="p-2 lg:p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Squad Size</p>
                                    <p className="text-base lg:text-lg font-bold text-slate-800">
                                        {teamProfile.player_count || mySquad.length}
                                        <span className="text-slate-400 text-xs font-normal">/ {teamProfile.max_players || 25}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="squad" className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
                        <div className="px-4 lg:px-6 pt-2 lg:pt-4">
                            <TabsList className="w-full grid grid-cols-2 h-8 lg:h-10">
                                <TabsTrigger value="squad" className="text-xs lg:text-sm">My Squad</TabsTrigger>
                                <TabsTrigger value="upcoming" className="text-xs lg:text-sm">Upcoming</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="squad" className="flex-1 overflow-y-auto min-h-0 p-3 lg:p-4 space-y-2">
                            {mySquad.map((player) => {
                                const isRetained = player.status === 'retained';
                                return (
                                    <div key={player.id} className={`flex items-center justify-between p-2 lg:p-3 bg-white hover:bg-slate-50 rounded-xl border transition-colors ${isRetained ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                                        <div className="flex items-center gap-2 lg:gap-3">
                                            <div className={`relative w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold ${isRetained ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300' : 'bg-slate-100 text-slate-500'}`}>
                                                {player.name.charAt(0)}
                                                {isRetained && (
                                                    <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs lg:text-sm font-semibold text-slate-800">{player.name}</p>
                                                    {isRetained && player.badge && (
                                                        <span className="text-[8px] lg:text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                            {player.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] lg:text-xs text-slate-500">{player.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[10px] lg:text-xs font-bold ${isRetained ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {formatCurrency(player.sold_price || player.base_price)}
                                            </p>
                                            <Badge variant="secondary" className={`text-[8px] lg:text-[10px] h-3 lg:h-4 px-1 ${isRetained ? 'bg-amber-100 text-amber-700' : ''}`}>
                                                {isRetained ? 'Retained' : player.country === 'India' ? 'Indian' : 'Overseas'}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                            {mySquad.length === 0 && (
                                <p className="text-center text-xs lg:text-sm text-slate-400 py-8">No players purchased yet</p>
                            )}
                        </TabsContent>

                        <TabsContent value="upcoming" className="flex-1 overflow-y-auto min-h-0 p-3 lg:p-4 space-y-2">
                            {upcomingQueue.map((player, index) => (
                                <div key={player.id} className="flex items-center justify-between p-2 lg:p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors opacity-75 hover:opacity-100">
                                    <div className="flex items-center gap-2 lg:gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-orange-50 flex items-center justify-center text-[10px] lg:text-xs font-bold text-orange-500">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-semibold text-slate-800">{player.name}</p>
                                            <p className="text-[10px] lg:text-xs text-slate-500">{player.role}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{formatCurrency(player.base_price)}</Badge>
                                </div>
                            ))}
                            {upcomingQueue.length === 0 && (
                                <p className="text-center text-xs lg:text-sm text-slate-400 py-8">No players in queue</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </aside>

                {/* --- Main Content Area: The Auction Floor --- */}
                <div className="w-full lg:flex-1 flex flex-col order-1 lg:order-2 p-2 md:p-4 lg:p-8 overflow-visible lg:overflow-y-auto custom-scrollbar h-auto lg:h-full shrink-0">

                    <div className="max-w-5xl mx-auto w-full space-y-3 lg:space-y-6">
                        {/* Live Status Bar */}
                        <div className="flex items-center justify-between mb-1 lg:mb-2 px-1">
                            <div>
                                <h2 className="text-lg lg:text-2xl font-bold text-slate-900">Current Auction</h2>
                                <p className="text-xs lg:text-base text-slate-500">
                                    {currentPlayer ? `${currentPlayer.category || 'Set'} • ${currentPlayer.role}` : 'Waiting for auction to start'}
                                </p>
                            </div>
                            {isMyBid && (
                                <Badge className="bg-green-500 text-white animate-pulse text-[10px] lg:text-xs">You're Leading!</Badge>
                            )}
                        </div>

                        {/* No current player */}
                        {/* No current player */}
                        {!currentPlayer && (
                            <Card className="bg-white border-0 shadow-2xl shadow-slate-200/50 rounded-3xl p-6 lg:p-12 text-center overflow-hidden relative">
                                {auctionState?.status === 'live' ? (
                                    <div className="relative z-10 py-4 lg:py-8">
                                        {/* Live Animation */}
                                        <div className="relative inline-block mb-6 lg:mb-8">
                                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30" />
                                            <div className="relative w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/50">
                                                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl lg:text-4xl font-black text-slate-800 mb-3 lg:mb-4">
                                            Auction is LIVE!
                                        </h3>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100 mb-6">
                                            <span className="relative flex h-1 w-1">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1 w-1 bg-red-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Broadcast Active</span>
                                        </div>
                                        <p className="text-slate-500 max-w-md mx-auto text-sm lg:text-lg mb-8">
                                            Be prepared! Auction is started and first player will be displayed very shortly.
                                        </p>
                                        <div className="flex justify-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                ) : auctionState?.status === 'paused' ? (
                                    <div className="relative z-10 py-6 lg:py-12">
                                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                                            <Coffee className="w-8 h-8 lg:w-10 lg:h-10 text-amber-600" />
                                        </div>
                                        <h3 className="text-xl lg:text-3xl font-black text-slate-800 mb-2">Short Break</h3>
                                        <p className="text-slate-500 max-w-md mx-auto text-sm lg:text-lg mb-6 leading-relaxed">
                                            The auction is currently paused. Please wait for the host to resume the session.
                                        </p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-xs font-semibold text-amber-700">Paused</span>
                                        </div>
                                    </div>
                                ) : auctionState?.status === 'completed' ? (
                                    <div className="relative z-10 py-6 lg:py-12">
                                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                            <Trophy className="w-8 h-8 lg:w-12 lg:h-12 text-white" />
                                        </div>
                                        <h3 className="text-xl lg:text-3xl font-black text-slate-800 mb-2">Auction Concluded</h3>
                                        <p className="text-slate-500 max-w-md mx-auto text-sm lg:text-lg mb-6">
                                            The auction session has finished. Thank you for your participation.
                                        </p>
                                    </div>
                                ) : (
                                    // Default waiting
                                    <>
                                        <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 lg:mb-6">
                                            <Gavel className="w-8 h-8 lg:w-12 lg:h-12 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-1 lg:mb-2">Waiting for Auction Session</h3>
                                        <p className="text-sm lg:text-base text-slate-500 max-w-sm mx-auto">
                                            The host will begin the auction shortly. Please stay connected.
                                        </p>
                                    </>
                                )}
                            </Card>
                        )}

                        {/* --- The Action Card --- */}
                        {currentPlayer && (
                            <Card className="bg-white border-0 shadow-lg lg:shadow-2xl shadow-slate-200/50 rounded-2xl lg:rounded-3xl overflow-hidden relative">
                                {/* Decorative Background Elements */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 relative z-10">

                                    {/* Player Image & Key Stats */}
                                    <div className="md:col-span-5 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 lg:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                                        {/* Decorative gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />

                                        <Badge className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 text-[10px] lg:text-xs z-10">
                                            {currentPlayer.category || 'PLAYER'}
                                        </Badge>

                                        <div className="relative z-10 w-full flex items-center justify-center mb-4 lg:mb-6">
                                            <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl w-56 h-56 lg:w-72 lg:h-72 md:w-80 md:h-80 shrink-0">
                                                {/* Frame border */}
                                                <div className="absolute inset-0 border-4 border-slate-300/50 rounded-2xl lg:rounded-3xl pointer-events-none z-10" />
                                                <div className="absolute inset-[2px] border-2 border-slate-200/60 rounded-[18px] lg:rounded-[26px] pointer-events-none z-10" />

                                                {/* Inner shadow effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 rounded-2xl lg:rounded-3xl pointer-events-none z-10" />

                                                {currentPlayer.image_url ? (
                                                    <img src={getImageUrl(currentPlayer.image_url)} alt={currentPlayer.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                        <Users className="w-24 h-24 lg:w-32 lg:h-32 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center w-full relative z-10">
                                            <h2 className="text-xl lg:text-3xl font-black text-slate-900 mb-1 leading-tight">{currentPlayer.name}</h2>
                                            <div className="flex items-center justify-center gap-2 mb-3 lg:mb-4">
                                                <span className="text-lg lg:text-2xl">{currentPlayer.country_flag || '🏏'}</span>
                                                <span className="text-xs lg:text-base font-semibold text-slate-600">{currentPlayer.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bidding Controls */}
                                    <div className="md:col-span-7 p-4 lg:p-8 flex flex-col justify-between h-full bg-white">

                                        <div className="space-y-4 lg:space-y-6">
                                            {/* Current Bid Status */}
                                            <div className={`rounded-2xl p-4 lg:p-6 border relative overflow-hidden ${isMyBid ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className={`absolute top-0 left-0 w-1 h-full ${isMyBid ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                <div className="flex justify-between items-start mb-1 lg:mb-2">
                                                    <p className="text-[10px] lg:text-sm font-semibold text-slate-500 uppercase tracking-wide">Current Highest Bid</p>
                                                    {currentBidder && (
                                                        <div
                                                            className="flex items-center gap-1.5 lg:gap-2 px-1.5 py-0.5 lg:px-2 lg:py-1 bg-white rounded-md border shadow-sm"
                                                            style={{ borderColor: currentBidder.color }}
                                                        >
                                                            <div
                                                                className="w-4 h-4 lg:w-6 lg:h-6 rounded flex items-center justify-center text-[8px] lg:text-xs font-bold text-white bg-white"
                                                                style={{ backgroundColor: currentBidder.logo_url ? 'white' : currentBidder.color }}
                                                            >
                                                                {currentBidder.logo_url ? (
                                                                    <img src={getImageUrl(currentBidder.logo_url)} alt={currentBidder.name} className="w-full h-full object-contain rounded" />
                                                                ) : (
                                                                    currentBidder.short_name
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] lg:text-xs font-bold text-slate-700 max-w-[80px] lg:max-w-none truncate">{currentBidder.name}</span>
                                                            {isMyBid && <Badge className="bg-green-500 text-white text-[8px] lg:text-[10px] px-1 h-4">You</Badge>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">
                                                        {formatCurrency(currentBid)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] lg:text-xs text-slate-400 mt-1 lg:mt-2 font-medium">Base Price: {formatCurrency(currentPlayer.base_price)}</p>
                                            </div>

                                            {/* Bidding Log Snippet */}
                                            <div className="space-y-2">
                                                <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase ml-1">Recent Activity</p>
                                                <div className="space-y-1.5 lg:space-y-2">
                                                    {bidHistory.slice(0, 3).map((bid, index) => (
                                                        <div key={bid.id} className="flex items-center justify-between p-2 lg:p-3 rounded-lg border border-slate-100 bg-white">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${index === 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                                                <span className="text-xs lg:text-sm font-semibold text-slate-700">{bid.team?.name || 'Team'}</span>
                                                            </div>
                                                            <span className="text-xs lg:text-sm font-bold text-slate-900">{formatCurrency(bid.amount)}</span>
                                                        </div>
                                                    ))}
                                                    {bidHistory.length === 0 && (
                                                        <p className="text-xs lg:text-sm text-slate-400 text-center py-2 lg:py-4">No bids yet - be the first!</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className={`mt-4 pt-4 lg:mt-8 lg:pt-8 border-t border-slate-100 transition-opacity duration-300 ${isFrozen && !isMyBid ? 'opacity-50' : 'opacity-100'}`}>
                                            <div className="flex flex-col gap-3 lg:gap-4">

                                                {isFrozen && !isMyBid && (
                                                    <p className="text-center text-xs lg:text-sm text-amber-600 bg-amber-50 p-2 lg:p-3 rounded-lg animate-pulse">
                                                        ⏳ Bid in progress... Please wait
                                                    </p>
                                                )}

                                                {isMyBid && (
                                                    <p className="text-center text-xs lg:text-sm text-green-600 bg-green-50 p-2 lg:p-3 rounded-lg">
                                                        ✓ You're the leading bidder! Wait for another team to bid.
                                                    </p>
                                                )}

                                                <div className="flex gap-2 lg:gap-4 items-center">
                                                    <Button
                                                        className={`flex-1 h-12 lg:h-14 text-sm lg:text-lg font-bold shadow-xl rounded-xl relative overflow-hidden group transition-all ${isMyBid || isFrozen ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'}`}
                                                        disabled={isBidding || !myTeam || isMyBid || isFrozen}
                                                        onClick={() => handlePlaceBid()}
                                                    >
                                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                                            <Gavel className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform" />
                                                            {isBidding ? 'Placing...' : isMyBid ? 'Waiting...' : isFrozen ? 'Please wait...' : `Bid ${formatCurrency(getNextBidAmount())}`}
                                                        </span>
                                                        {/* Shine Effect */}
                                                        {!isMyBid && !isFrozen && <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />}
                                                    </Button>
                                                </div>

                                                {!myTeam && (
                                                    <p className="text-center text-xs lg:text-sm text-amber-600 bg-amber-50 p-2 lg:p-3 rounded-lg">
                                                        ⚠️ You are not assigned to a team. Contact admin.
                                                    </p>
                                                )}

                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </Card>
                        )}

                    </div>

                </div>
            </main>
        </div>
    );
}
