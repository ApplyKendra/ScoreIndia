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
    EyeOff
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
                break;
            case 'auction:unsold':
                // Just handled via state change
                break;
            case 'auction:live':
                // Auction is now live - show notification and update state
                toast.success('🔴 Auction is now LIVE!');
                setAuctionState(prev => prev ? { ...prev, status: 'live' } : { status: 'live' });
                break;
            case 'auction:reset':
                // Auction was reset - refresh everything
                toast.info('Auction has been reset');
                api.getAuctionState().then(state => {
                    setAuctionState(state);
                    if (state?.bids) setBidHistory(state.bids);
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
            api.getAuctionState().then(state => {
                if (state) {
                    setAuctionState(state);
                    if (state.bids) setBidHistory(state.bids);
                }
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
                const stateData = await api.getAuctionState();
                if (stateData) {
                    setAuctionState(stateData);
                    if (stateData.bids) setBidHistory(stateData.bids);
                }
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
                    {/* App Logo */}
                    {/* App Logo */}
                    <svg className="h-6 lg:h-10 w-auto" viewBox="0 0 733 221" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M87.6812 136.887L31.0104 215.832L15.5079 217.032L80.3784 126.663L87.6812 136.887ZM168.067 190.2L136.5 193.162L35.9588 56.9581L67.5275 53.9961L168.067 190.2ZM102.124 157.112L75.3988 194.343L59.8973 195.543L94.8227 146.888L102.124 157.112ZM125.181 124.994L117.879 114.771L199.41 1.19965L214.912 -2.6843e-06L125.181 124.994ZM110.737 104.77L103.435 94.5458L139.774 43.9281L155.276 42.7285L110.737 104.77Z" fill="url(#paint0_linear_164_221)" />
                        <path d="M212.042 177.658C204.282 177.658 197.282 176.058 191.042 172.858C184.802 169.658 179.842 164.938 176.162 158.698C172.562 152.458 170.762 144.858 170.762 135.898C170.762 129.178 171.842 123.218 174.002 118.018C176.242 112.818 179.282 108.458 183.122 104.938C187.042 101.338 191.522 98.6577 196.562 96.8977C201.602 95.0577 206.962 94.1377 212.642 94.1377C217.042 94.1377 221.162 94.6577 225.002 95.6977C228.842 96.6577 232.522 98.0977 236.042 100.018L236.522 115.738H233.282L228.242 106.258C227.442 104.658 226.562 103.218 225.602 101.938C224.722 100.658 223.562 99.7377 222.122 99.1777C220.122 98.2177 217.762 97.7377 215.042 97.7377C210.322 97.7377 206.002 98.9377 202.082 101.338C198.242 103.738 195.162 107.738 192.842 113.338C190.522 118.858 189.362 126.418 189.362 136.018C189.362 145.538 190.442 153.098 192.602 158.698C194.842 164.298 197.842 168.298 201.602 170.698C205.362 173.018 209.602 174.178 214.322 174.178C216.482 174.178 218.242 174.018 219.602 173.698C220.962 173.378 222.322 172.938 223.682 172.378C225.282 171.738 226.522 170.818 227.402 169.618C228.282 168.338 229.042 166.898 229.682 165.298L234.242 154.378H237.482L237.002 171.658C233.562 173.578 229.762 175.058 225.602 176.098C221.442 177.138 216.922 177.658 212.042 177.658ZM260.107 175.618V173.098L262.507 172.258C263.947 171.858 264.947 171.178 265.507 170.218C266.067 169.178 266.387 167.778 266.467 166.018V105.658C266.387 103.978 266.107 102.698 265.627 101.818C265.147 100.858 264.147 100.138 262.627 99.6577L260.107 98.8177V96.2977H317.227L318.067 115.498H314.707L309.907 104.698C309.267 103.178 308.547 102.018 307.747 101.218C306.947 100.338 305.747 99.8977 304.147 99.8977H283.747C283.667 104.858 283.627 109.978 283.627 115.258C283.627 120.458 283.627 126.338 283.627 132.898H295.507C297.107 132.898 298.307 132.498 299.107 131.698C299.987 130.818 300.787 129.658 301.507 128.218L303.547 123.658H306.187V145.858H303.547L301.387 141.298C300.747 139.858 300.027 138.698 299.227 137.818C298.427 136.938 297.227 136.498 295.627 136.498H283.627C283.627 142.258 283.627 147.218 283.627 151.378C283.627 155.538 283.627 159.258 283.627 162.538C283.707 165.738 283.747 168.898 283.747 172.018H306.787C308.387 172.018 309.627 171.618 310.507 170.818C311.387 169.938 312.107 168.738 312.667 167.218L317.107 156.418H320.467L319.627 175.618H260.107ZM344.792 175.618V173.098L348.272 172.138C349.792 171.738 350.832 170.978 351.392 169.858C352.032 168.738 352.352 167.378 352.352 165.778V107.698C351.632 106.178 350.992 105.058 350.432 104.338C349.952 103.538 349.432 102.858 348.872 102.298C348.312 101.738 347.552 101.098 346.592 100.378L344.432 98.8177V96.2977H364.952L404.792 150.778V106.258C404.792 104.658 404.512 103.258 403.952 102.058C403.472 100.858 402.432 100.058 400.832 99.6577L397.232 98.8177V96.2977H415.112V98.8177L412.112 99.6577C410.592 100.138 409.632 100.978 409.232 102.178C408.912 103.298 408.752 104.658 408.752 106.258V176.098H402.032L356.312 113.218V165.658C356.312 167.338 356.552 168.738 357.032 169.858C357.512 170.978 358.512 171.738 360.032 172.138L363.272 173.098V175.618H344.792ZM477.598 177.658C469.838 177.658 462.838 176.058 456.598 172.858C450.358 169.658 445.398 164.938 441.718 158.698C438.118 152.458 436.318 144.858 436.318 135.898C436.318 129.178 437.398 123.218 439.558 118.018C441.798 112.818 444.838 108.458 448.678 104.938C452.598 101.338 457.078 98.6577 462.118 96.8977C467.158 95.0577 472.518 94.1377 478.198 94.1377C482.598 94.1377 486.718 94.6577 490.558 95.6977C494.398 96.6577 498.078 98.0977 501.598 100.018L502.078 115.738H498.838L493.798 106.258C492.998 104.658 492.118 103.218 491.158 101.938C490.278 100.658 489.118 99.7377 487.678 99.1777C485.678 98.2177 483.318 97.7377 480.598 97.7377C475.878 97.7377 471.558 98.9377 467.638 101.338C463.798 103.738 460.718 107.738 458.398 113.338C456.078 118.858 454.918 126.418 454.918 136.018C454.918 145.538 455.998 153.098 458.158 158.698C460.398 164.298 463.398 168.298 467.158 170.698C470.918 173.018 475.158 174.178 479.878 174.178C482.038 174.178 483.798 174.018 485.158 173.698C486.518 173.378 487.878 172.938 489.238 172.378C490.838 171.738 492.078 170.818 492.958 169.618C493.838 168.338 494.598 166.898 495.238 165.298L499.798 154.378H503.038L502.558 171.658C499.118 173.578 495.318 175.058 491.158 176.098C486.998 177.138 482.478 177.658 477.598 177.658ZM525.663 175.618V173.098L528.063 172.258C529.503 171.858 530.503 171.178 531.063 170.218C531.623 169.178 531.943 167.778 532.023 166.018V105.658C531.943 103.978 531.663 102.698 531.183 101.818C530.703 100.858 529.703 100.138 528.183 99.6577L525.663 98.8177V96.2977H582.783L583.623 115.498H580.263L575.463 104.698C574.823 103.178 574.103 102.018 573.303 101.218C572.503 100.338 571.303 99.8977 569.703 99.8977H549.303C549.223 104.858 549.183 109.978 549.183 115.258C549.183 120.458 549.183 126.338 549.183 132.898H561.063C562.663 132.898 563.863 132.498 564.663 131.698C565.543 130.818 566.343 129.658 567.063 128.218L569.103 123.658H571.743V145.858H569.103L566.943 141.298C566.303 139.858 565.583 138.698 564.783 137.818C563.983 136.938 562.783 136.498 561.183 136.498H549.183C549.183 142.258 549.183 147.218 549.183 151.378C549.183 155.538 549.183 159.258 549.183 162.538C549.263 165.738 549.303 168.898 549.303 172.018H572.343C573.943 172.018 575.183 171.618 576.063 170.818C576.943 169.938 577.663 168.738 578.223 167.218L582.663 156.418H586.023L585.183 175.618H525.663Z" fill="#38AEE9" />
                        <defs>
                            <linearGradient id="paint0_linear_164_221" x1="-15" y1="169.5" x2="230" y2="109" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0072AF" />
                                <stop offset="0.5" stopColor="#59C4FF" />
                                <stop offset="1" stopColor="#0072AF" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Divider */}
                    <div className="hidden lg:block h-8 w-px bg-slate-200" />

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
                            <div>
                                <p className="text-[10px] lg:text-xs text-slate-500 mb-1">Remaining Purse</p>
                                <p className="text-xl lg:text-2xl font-black text-slate-900">
                                    {formatCurrency(teamProfile.remaining_budget || teamProfile.budget)}
                                </p>
                                <Progress
                                    value={((teamProfile.budget - (teamProfile.remaining_budget || teamProfile.budget)) / teamProfile.budget) * 100}
                                    className="h-1.5 lg:h-2 mt-2"
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
                            {mySquad.map((player) => (
                                <div key={player.id} className="flex items-center justify-between p-2 lg:p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                                    <div className="flex items-center gap-2 lg:gap-3">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] lg:text-xs font-bold text-slate-500">
                                            {player.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-semibold text-slate-800">{player.name}</p>
                                            <p className="text-[10px] lg:text-xs text-slate-500">{player.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] lg:text-xs font-bold text-slate-700">{formatCurrency(player.sold_price || player.base_price)}</p>
                                        <Badge variant="secondary" className="text-[8px] lg:text-[10px] h-3 lg:h-4 px-1">
                                            {player.country === 'India' ? 'Indian' : 'Overseas'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
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
                                            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/50">
                                                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl lg:text-4xl font-black text-slate-800 mb-3 lg:mb-4">
                                            Auction is LIVE!
                                        </h3>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100 mb-6">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </span>
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Broadcast Active</span>
                                        </div>
                                        <p className="text-slate-500 max-w-md mx-auto text-sm lg:text-lg mb-8">
                                            Owners are reviewing strategies. The next player will appear on the block momentarily.
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
                                    <div className="md:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative">
                                        <Badge className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-slate-900 text-white hover:bg-slate-800 text-[10px] lg:text-xs">
                                            {currentPlayer.category || 'PLAYER'}
                                        </Badge>

                                        <div className="w-48 h-48 lg:w-64 lg:h-64 md:w-80 md:h-80 rounded-2xl lg:rounded-3xl bg-white shadow-xl flex items-center justify-center mb-4 lg:mb-6 border-4 border-white relative overflow-hidden shrink-0">
                                            {currentPlayer.image_url ? (
                                                <img src={getImageUrl(currentPlayer.image_url)} alt={currentPlayer.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-24 h-24 lg:w-32 lg:h-32 text-slate-300" />
                                            )}
                                        </div>

                                        <div className="text-center w-full">
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
