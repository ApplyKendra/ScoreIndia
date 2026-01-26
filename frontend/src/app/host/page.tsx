'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Gavel,
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Users,
    Timer,
    AlertTriangle,
    X,
    Search,
    Hammer,
    LogOut,
    Power,
    Youtube,
    Link2,
    ChevronRight,
    Zap,
    TrendingUp,
    Crown,
    Activity,
    Radio,
    Monitor,
    Minimize2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    max_players?: number;
    logo_url?: string;
}

interface Player {
    id: string;
    name: string;
    country: string;
    country_flag?: string;
    role: string;
    base_price: number;
    category: string;
    status: string;
    image_url?: string;
    sold_price?: number;
    team_id?: string;
    team?: Team;
    queue_order?: number;
    badge?: string;
    stats?: {
        matches?: number;
        runs?: number;
        wickets?: number;
    };
}

interface Bid {
    id: string;
    amount: number;
    team_id: string;
    team?: Team;
    created_at: string;
}

interface AuctionState {
    status: string;
    current_player?: Player;
    current_bid?: number;
    current_bidder?: Team;
    timer_remaining?: number;
    bids?: Bid[];
    tied_teams?: Team[];
}

// --- Helpers ---
const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    return `₹${value.toLocaleString()}`;
};

const formatTime = (date: string) => {
    if (!date) return '--:--:--';
    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return '--:--:--';
        }
        return dateObj.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
        return '--:--:--';
    }
};

// Action Button Component
function ActionButton({
    onClick,
    disabled,
    loading,
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    style
}: {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    style?: React.CSSProperties;
}) {
    const baseStyles = "relative font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl select-none";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.97] text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
        success: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.97] text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40",
        danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-[0.97] text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
        warning: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-[0.97] text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
        ghost: "bg-transparent hover:bg-slate-100 active:bg-slate-200 active:scale-[0.97] text-slate-700",
        outline: "bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.97] text-slate-700 shadow-sm hover:shadow-md"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        xl: "h-12 px-6 text-lg"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            style={style}
        >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>...</span>
                </>
            ) : children}
        </button>
    );
}

export default function HostDashboard() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [queue, setQueue] = useState<Player[]>([]);
    const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
    const [bidHistory, setBidHistory] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [timer, setTimer] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [teamSquad, setTeamSquad] = useState<Player[]>([]);
    const [loadingSquad, setLoadingSquad] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isStreamLoading, setIsStreamLoading] = useState(false);
    const [activePanel, setActivePanel] = useState<'teams' | 'queue'>('queue');
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);

    const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Auth and role check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!authLoading && user && !['super_admin', 'admin', 'host'].includes(user.role)) {
            if (user.role === 'bidder') {
                router.push('/bidders');
            } else {
                router.push('/auctions');
            }
        }
    }, [isAuthenticated, authLoading, user, router]);

    // WebSocket handler
    const handleWebSocketMessage = useCallback((event: string, data: any) => {
        switch (event) {
            case 'auction:state':
                setAuctionState(data);
                if (data?.bids) setBidHistory(data.bids);
                if (data?.timer_remaining) setTimer(data.timer_remaining);
                break;
            case 'auction:bid':
                setBidHistory(prev => [data, ...prev]);
                setAuctionState(prev => prev ? {
                    ...prev,
                    current_bid: data.amount,
                    current_bidder: data.team,
                } : null);
                break;
            case 'auction:sold':
                toast.success(`${data.player?.name} sold to ${data.team?.name}!`);
                api.getTeams().then(t => setTeams(t || []));
                api.getPlayerQueue(10).then(q => setQueue(q || []));
                break;
            case 'auction:unsold':
                toast.info(`${data.player?.name} marked unsold`);
                api.getPlayerQueue(10).then(q => setQueue(q || []));
                break;
            case 'auction:player-changed':
                setAuctionState(prev => ({
                    status: prev?.status || 'active',
                    ...prev,
                    current_player: data,
                    current_bid: data.base_price,
                    current_bidder: undefined,
                }));
                setBidHistory([]);
                setTimer(30);
                setIsTimerRunning(true);
                break;
            case 'auction:timer':
                if (data?.remaining !== undefined) setTimer(data.remaining);
                break;
            case 'auction:started':
                setIsTimerRunning(true);
                break;
            case 'auction:paused':
                setIsTimerRunning(false);
                break;
            case 'auction:resumed':
                setIsTimerRunning(true);
                break;
            case 'auction:bid-undone':
                // Handle bid undo event from WebSocket
                if (data?.bids) {
                    setBidHistory(data.bids);
                }
                if (data?.current_bid !== undefined) {
                    setAuctionState(prev => prev ? {
                        ...prev,
                        current_bid: data.current_bid,
                        current_bidder: data.current_bidder,
                    } : null);
                }
                break;
        }
    }, []);

    const { isConnected } = useWebSocket({
        token: api.getToken(),
        enabled: isAuthenticated,
        onMessage: handleWebSocketMessage,
        onOpen: useCallback(() => {
            Promise.all([
                api.getAuctionState().catch(() => null),
                api.getTeams().catch(() => []),
                api.getPlayerQueue(10).catch(() => []),
            ]).then(([stateData, teamsData, queueData]) => {
                if (stateData) {
                    setAuctionState(stateData);
                    if (stateData.bids) setBidHistory(stateData.bids);
                    if (stateData.timer_remaining) setTimer(stateData.timer_remaining);
                }
                if (teamsData) setTeams(teamsData);
                if (queueData) setQueue(queueData);
            }).catch(() => { });
        }, []),
    });

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const [teamsData, queueData, stateData] = await Promise.all([
                api.getTeams().catch(() => []),
                api.getPlayerQueue(10).catch(() => []),
                api.getAuctionState().catch(() => null),
            ]);
            setTeams(teamsData || []);
            setQueue(queueData || []);
            setAuctionState(stateData);
            if (stateData?.bids) setBidHistory(stateData.bids);
            if (stateData?.timer_remaining) setTimer(stateData.timer_remaining);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        api.getPublicStreamUrl()
            .then(data => { if (data?.url) setYoutubeUrl(data.url); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!isConnected || !isAuthenticated) return;
        const interval = setInterval(async () => {
            try {
                const [stateData, teamsData] = await Promise.all([
                    api.getAuctionState().catch(() => null),
                    api.getTeams().catch(() => []),
                ]);
                if (stateData) {
                    setAuctionState(stateData);
                    if (stateData.bids) setBidHistory(stateData.bids);
                }
                if (teamsData) setTeams(teamsData);
            } catch (e) { }
        }, 30000);
        return () => clearInterval(interval);
    }, [isConnected, isAuthenticated]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    // Action handlers
    const handleStartAuction = async () => {
        setActionLoading('start');
        try {
            await api.startAuction();
            toast.success('Auction started!');
            try {
                const player = await api.nextPlayer();
                toast.success(`First player: ${player.name}`);
            } catch (e) { }
            const stateData = await api.getAuctionState();
            setAuctionState(stateData);
            if (stateData?.bids) setBidHistory(stateData.bids);
            setIsTimerRunning(true);
            setTimer(30);
            const queueData = await api.getPlayerQueue(10).catch(() => []);
            setQueue(queueData || []);
            const teamsData = await api.getTeams().catch(() => []);
            setTeams(teamsData || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to start auction');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePauseAuction = async () => {
        setActionLoading('pause');
        try {
            await api.pauseAuction();
            setIsTimerRunning(false);
            toast.success('Auction paused');
        } catch (error: any) {
            toast.error(error.message || 'Failed to pause auction');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResumeAuction = async () => {
        setActionLoading('resume');
        try {
            await api.resumeAuction();
            setIsTimerRunning(true);
            toast.success('Auction resumed');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resume auction');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndAuction = async () => {
        setActionLoading('end');
        try {
            await api.endAuction();
            setIsTimerRunning(false);
            setTimer(0);
            setAuctionState(prev => prev ? { ...prev, status: 'ended', current_player: undefined } : null);
            toast.success('Auction ended successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to end auction');
        } finally {
            setActionLoading(null);
        }
    };

    const handleNextPlayer = async () => {
        setActionLoading('next');
        try {
            const result = await api.nextPlayer();
            setAuctionState(prev => ({
                status: prev?.status || 'active',
                ...prev,
                current_player: result,
                current_bid: result.base_price,
                current_bidder: undefined,
            }));
            setBidHistory([]);
            setTimer(30);
            setIsTimerRunning(true);
            toast.success(`Next player: ${result.name}`);
            const queueData = await api.getPlayerQueue(10);
            setQueue(queueData || []);
        } catch (error: any) {
            toast.error(error.message || 'No more players in queue');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartBidForPlayer = async (playerId: string, playerName: string) => {
        setActionLoading(`start-${playerId}`);
        try {
            const result = await api.startBidForPlayer(playerId);
            setAuctionState(prev => ({
                status: prev?.status || 'active',
                ...prev,
                current_player: result,
                current_bid: result.base_price,
                current_bidder: undefined
            }));
            setBidHistory([]);
            setTimer(30);
            setIsTimerRunning(true);
            setSearchQuery('');
            toast.success(`Starting bid for: ${playerName}`);
            const queueData = await api.getPlayerQueue(10);
            setQueue(queueData || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to start bid for player');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSell = async () => {
        setActionLoading('sell');
        try {
            const result = await api.sellPlayer();
            toast.success(`${result.player?.name} sold to ${result.team?.name}!`);
            setIsTimerRunning(false);
            setBidHistory([]);
            const [teamsData, stateData, queueData] = await Promise.all([
                api.getTeams(),
                api.getAuctionState(),
                api.getPlayerQueue(10).catch(() => []),
            ]);
            setTeams(teamsData || []);
            setAuctionState(stateData);
            setQueue(queueData || []);
            if (stateData?.current_player) {
                setTimer(30);
                setIsTimerRunning(true);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to sell player');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSellToTeam = async (teamId: string, teamName: string) => {
        setActionLoading(`sell-to-${teamId}`);
        try {
            const result = await api.sellToTeam(teamId);
            toast.success(`${result.player?.name} sold to ${teamName}!`);
            setIsTimerRunning(false);
            setBidHistory([]);
            const [teamsData, stateData, queueData] = await Promise.all([
                api.getTeams(),
                api.getAuctionState(),
                api.getPlayerQueue(10).catch(() => []),
            ]);
            setTeams(teamsData || []);
            setAuctionState(stateData);
            setQueue(queueData || []);
            if (stateData?.current_player) {
                setTimer(30);
                setIsTimerRunning(true);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to allocate player');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnsold = async () => {
        setActionLoading('unsold');
        try {
            await api.markUnsold();
            toast.info('Player marked as unsold');
            setIsTimerRunning(false);
            setBidHistory([]);
            const [stateData, queueData] = await Promise.all([
                api.getAuctionState(),
                api.getPlayerQueue(10).catch(() => []),
            ]);
            setAuctionState(stateData);
            setQueue(queueData || []);
            if (stateData?.current_player) {
                setTimer(30);
                setIsTimerRunning(true);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to mark unsold');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetTimer = async () => {
        setActionLoading('timer');
        try {
            const result = await api.resetTimer();
            setTimer(result.remaining || 30);
            setIsTimerRunning(true);
            toast.success('Timer reset');
        } catch (error: any) {
            toast.error(error.message || 'Failed to reset timer');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUndoBid = async () => {
        setActionLoading('undo');
        try {
            // Call the undo API - backend deletes last bid and updates auction state
            await api.undoBid();

            // Fetch fresh state from server immediately
            const stateData = await api.getAuctionState();
            if (stateData) {
                setAuctionState(stateData);
                if (stateData.bids && stateData.bids.length > 0) {
                    setBidHistory(stateData.bids);
                    toast.success(`Bid undone. Current: ${formatCurrency(stateData.bids[0].amount)}`);
                } else {
                    setBidHistory([]);
                    toast.success(`Bid undone. Reset to base price.`);
                }
            } else {
                toast.success('Bid undone');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to undo bid');
        } finally {
            setActionLoading(null);
        }
    };


    const handleSkipPlayer = async () => {
        setActionLoading('skip');
        try {
            // Use the new skipPlayer API that returns player to queue
            await api.skipPlayer();
            toast.info('Player skipped - returned to queue');
            setIsTimerRunning(false);
            setBidHistory([]);
            const [stateData, queueData] = await Promise.all([
                api.getAuctionState(),
                api.getPlayerQueue(10).catch(() => []),
            ]);
            setAuctionState(stateData);
            setQueue(queueData || []);
            if (stateData?.current_player) {
                setTimer(30);
                setIsTimerRunning(true);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to skip player');
        } finally {
            setActionLoading(null);
        }
    };


    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleTeamClick = async (team: Team) => {
        setSelectedTeam(team);
        setLoadingSquad(true);
        try {
            const squad = await api.getTeamSquad(team.id);
            setTeamSquad(squad || []);
        } catch (error) {
            console.error('Failed to fetch team squad:', error);
            toast.error('Failed to load team squad');
            setTeamSquad([]);
        } finally {
            setLoadingSquad(false);
        }
    };

    const handleBroadcastLive = async () => {
        setActionLoading('broadcast');
        try {
            await api.broadcastLive();
            toast.success('🔴 Auction is now LIVE!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to broadcast live');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetStreamUrl = async () => {
        if (!youtubeUrl.trim()) {
            toast.error('Please enter a YouTube URL');
            return;
        }
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|live\/|embed\/)|youtu\.be\/)[\w-]+/;
        if (!youtubeRegex.test(youtubeUrl.trim())) {
            toast.error('Please enter a valid YouTube URL');
            return;
        }
        setIsStreamLoading(true);
        try {
            await api.setStreamUrl(youtubeUrl.trim());
            toast.success('🎬 Stream URL set!');
            setYoutubeDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to set stream URL');
        } finally {
            setIsStreamLoading(false);
        }
    };

    const handleClearStreamUrl = async () => {
        setIsStreamLoading(true);
        try {
            await api.setStreamUrl('');
            setYoutubeUrl('');
            toast.success('Stream URL cleared');
        } catch (error: any) {
            toast.error(error.message || 'Failed to clear stream URL');
        } finally {
            setIsStreamLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-600 font-medium text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const currentPlayer = auctionState?.current_player;
    const currentBid = auctionState?.current_bid || currentPlayer?.base_price || 0;
    const currentBidder = auctionState?.current_bidder;
    const isAuctionLive = auctionState?.status === 'live' || auctionState?.status === 'paused';
    const isPaused = auctionState?.status === 'paused';

    return (
        <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">

            {/* Compact Sub-Header */}
            <header className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-3 shrink-0 shadow-sm">
                {/* Left: Logo & Connection */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow">
                        <Gavel className="w-4 h-4 text-white" />
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                </div>

                {/* Center: Timer & Controls */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono border ${timer < 10 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                        <Timer className="w-4 h-4" />
                        <span className="text-lg font-bold tabular-nums w-8 text-center">{timer}s</span>
                    </div>

                    {isAuctionLive ? (
                        <>
                            <ActionButton
                                onClick={isPaused ? handleResumeAuction : handlePauseAuction}
                                loading={actionLoading === 'pause' || actionLoading === 'resume'}
                                variant={isPaused ? 'success' : 'warning'}
                                size="sm"
                            >
                                {isPaused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Hold</>}
                            </ActionButton>

                            <ActionButton onClick={handleResetTimer} loading={actionLoading === 'timer'} variant="outline" size="sm">
                                <RotateCcw className="w-3 h-3" />
                            </ActionButton>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="h-8 px-3 text-xs font-semibold bg-red-50 hover:bg-red-100 active:bg-red-200 active:scale-[0.97] text-red-600 border border-red-200 rounded-lg transition-all flex items-center gap-1">
                                        <Power className="w-3 h-3" /> End
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-slate-200">
                                    <DialogHeader>
                                        <DialogTitle>End Auction?</DialogTitle>
                                        <DialogDescription>This will end the auction session.</DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button onClick={handleEndAuction} className="bg-red-600 hover:bg-red-700 text-white">End</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <ActionButton onClick={handleBroadcastLive} loading={actionLoading === 'broadcast'} variant="danger" size="sm">
                            <Radio className="w-3 h-3" /> Go Live
                        </ActionButton>
                    )}

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    {/* YouTube Button */}
                    <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
                        <DialogTrigger asChild>
                            <button className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${youtubeUrl ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}>
                                <Youtube className="w-4 h-4" />
                                {youtubeUrl ? 'Stream Set' : 'Set Stream'}
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-slate-200 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                    YouTube Live Stream
                                </DialogTitle>
                                <DialogDescription>Set the YouTube live stream URL</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://youtube.com/live/..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                {youtubeUrl && (
                                    <Button variant="outline" onClick={handleClearStreamUrl} disabled={isStreamLoading}>Clear</Button>
                                )}
                                <Button onClick={handleSetStreamUrl} disabled={!youtubeUrl.trim() || isStreamLoading} className="bg-red-600 hover:bg-red-700 text-white">
                                    <Link2 className="w-4 h-4 mr-1" />
                                    {isStreamLoading ? 'Setting...' : 'Set Stream'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Presentation Mode Button */}
                    <button
                        onClick={() => setPresentationMode(!presentationMode)}
                        className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${presentationMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                    >
                        {presentationMode ? <Minimize2 className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        {presentationMode ? 'Exit' : 'Present'}
                    </button>
                </div>

                {/* Right: User */}
                <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 border border-slate-200">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-semibold">{user?.name?.charAt(0) || 'H'}</AvatarFallback>
                    </Avatar>
                    <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">

                {/* Left Sidebar - Hidden in presentation mode */}
                <aside className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${presentationMode ? 'w-0 opacity-0 pointer-events-none overflow-hidden' : 'w-80'}`}>
                    <div className="flex border-b border-slate-200 shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActivePanel('queue');
                            }}
                            className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activePanel === 'queue' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Activity className="w-4 h-4" /> Queue
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActivePanel('teams');
                            }}
                            className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activePanel === 'teams' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users className="w-4 h-4" /> Teams
                        </button>
                    </div>

                    <ScrollArea className="flex-1">
                        {activePanel === 'queue' ? (
                            <div className="flex flex-col h-full">
                                <div className="p-3 border-b border-slate-100 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="p-3 space-y-2">
                                    {queue
                                        .filter(p => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase().trim();
                                            // Match by name
                                            if (p.name.toLowerCase().includes(q)) return true;
                                            // Match by queue order number (for numeric searches like "4", "5", etc.)
                                            if (p.queue_order !== undefined && String(p.queue_order).includes(q)) return true;
                                            // Match by role
                                            if (p.role?.toLowerCase().includes(q)) return true;
                                            return false;
                                        })
                                        .slice(0, 10)
                                        .map((p, i) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-all group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xs text-slate-400 font-mono w-6">#{p.queue_order || i + 1}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-slate-800 truncate font-medium">{p.name}</p>
                                                        <p className="text-xs text-slate-400">{p.role} • {formatCurrency(p.base_price)}</p>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    onClick={() => handleStartBidForPlayer(p.id, p.name)}
                                                    disabled={!!currentPlayer}
                                                    loading={actionLoading === `start-${p.id}`}
                                                    variant="primary"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 h-7 px-3 text-xs flex items-center gap-1"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    <span>Bid</span>
                                                </ActionButton>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2">
                                {teams.map(team => {
                                    const spent = team.spent || 0;
                                    const remaining = team.remaining_budget || (team.budget - spent);
                                    const budgetUsedPercent = (spent / team.budget) * 100;
                                    return (
                                        <button
                                            key={team.id}
                                            onClick={() => handleTeamClick(team)}
                                            className="w-full p-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-[0.99] border border-slate-200 rounded-lg transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                {team.logo_url ? (
                                                    <img src={getImageUrl(team.logo_url)} alt={team.name} className="w-10 h-10 rounded object-contain bg-white" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: team.color }}>
                                                        {team.short_name}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 text-sm truncate">{team.name}</p>
                                                    <p className="text-xs text-slate-400">{team.player_count || 0} players</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                            </div>
                                            <Progress value={budgetUsedPercent} className="h-1.5" />
                                            <div className="flex justify-between text-xs mt-1.5">
                                                <span className="text-emerald-600 font-medium">{formatCurrency(spent)}</span>
                                                <span className="text-slate-400 font-medium">{formatCurrency(remaining)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </aside>

                {/* Center Stage - Vertical Layout: Image -> Info -> Bid */}
                <section className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${presentationMode ? 'p-6' : 'p-3'}`}>

                    {!currentPlayer ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Card className="max-w-sm w-full bg-white border-slate-200 p-6 text-center shadow-lg rounded-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-indigo-500" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2">Select Next Player</h2>
                                <p className="text-slate-500 text-sm">Use the queue to select a player</p>
                            </Card>
                        </div>
                    ) : (
                        /* Player Card - Vertical Layout */
                        <Card className="flex-1 bg-white border-slate-200 overflow-hidden flex flex-col shadow-lg rounded-2xl">

                            {/* Dark Background Container for Player Image and Info */}
                            <div className="bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 relative overflow-hidden shrink-0">
                                {/* Decorative gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />

                                {/* Large Player Image with Frame */}
                                <div className={`flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 ${presentationMode ? 'p-4' : 'p-4'}`}>
                                    <div className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${presentationMode ? 'w-64 h-64 lg:w-80 lg:h-80' : 'w-56 h-56 lg:w-72 lg:h-72'}`}>
                                        {/* Frame border */}
                                        <div className="absolute inset-0 border-4 border-white/30 rounded-3xl pointer-events-none z-10" />
                                        <div className="absolute inset-[2px] border-2 border-white/20 rounded-[22px] pointer-events-none z-10" />

                                        {/* Inner shadow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 rounded-3xl pointer-events-none z-10" />

                                        {currentPlayer.image_url ? (
                                            <img src={getImageUrl(currentPlayer.image_url)} alt={currentPlayer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-600">
                                                <Users className="w-20 h-20 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Player Info with Dark Background */}
                                <div className={`text-center shrink-0 transition-all duration-300 relative z-10 ${presentationMode ? 'px-6 py-3 pb-4' : 'px-4 py-2 pb-3'}`}>
                                    <h2 className={`font-bold text-white transition-all duration-300 ${presentationMode ? 'text-2xl lg:text-3xl' : 'text-lg'} drop-shadow-lg`}>{currentPlayer.name}</h2>
                                    <div className={`flex items-center justify-center mt-1.5 transition-all duration-300 ${presentationMode ? 'gap-3' : 'gap-2'}`}>
                                        <span className={`transition-all duration-300 ${presentationMode ? 'text-xl' : 'text-base'}`}>{currentPlayer.country_flag || '🏏'}</span>
                                        <span className={`text-slate-200 transition-all duration-300 ${presentationMode ? 'text-base' : 'text-sm'}`}>{currentPlayer.country}</span>
                                        <Badge className={`bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 ${presentationMode ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'}`}>{currentPlayer.role}</Badge>
                                        <span className="text-slate-400">•</span>
                                        <span className={`text-white font-semibold transition-all duration-300 ${presentationMode ? 'text-base' : 'text-sm'}`}>Base: {formatCurrency(currentPlayer.base_price)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Bid Display */}
                            <div className={`flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white min-h-0 transition-all duration-300 ${presentationMode ? 'px-6 py-3' : 'px-4 py-3'}`}>
                                <p className={`text-slate-500 uppercase tracking-wider font-semibold mb-2 transition-all duration-300 ${presentationMode ? 'text-xs' : 'text-[10px]'}`}>Current Bid</p>
                                {currentBidder && (
                                    <div className={`flex items-center rounded-lg mb-2 transition-all duration-300 ${presentationMode ? 'gap-2 px-3 py-1.5' : 'gap-2 px-2.5 py-1'}`} style={{ backgroundColor: `${currentBidder.color}15`, border: `1px solid ${currentBidder.color}30` }}>
                                        <div className={`rounded flex items-center justify-center font-bold text-white transition-all duration-300 ${presentationMode ? 'w-7 h-7 text-xs' : 'w-5 h-5 text-[9px]'}`} style={{ backgroundColor: currentBidder.color }}>
                                            {currentBidder.short_name}
                                        </div>
                                        <span className={`font-bold text-slate-800 transition-all duration-300 ${presentationMode ? 'text-base' : 'text-sm'}`}>{currentBidder.name}</span>
                                        <Crown className={`text-amber-500 transition-all duration-300 ${presentationMode ? 'w-4 h-4' : 'w-3 h-3'}`} />
                                    </div>
                                )}
                                <p className={`font-black text-slate-900 tracking-tight tabular-nums transition-all duration-300 ${presentationMode ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl'} leading-[1.1]`}>
                                    {formatCurrency(currentBid)}
                                </p>

                                {/* Tie Breaking */}
                                {auctionState?.tied_teams && auctionState.tied_teams.length > 1 && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-xl w-full max-w-xs">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                                            <span className="font-bold text-amber-800 text-[10px]">Tie! Select winner:</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {auctionState.tied_teams.map((team) => (
                                                <ActionButton
                                                    key={team.id}
                                                    onClick={() => handleSellToTeam(team.id, team.name)}
                                                    loading={actionLoading === `sell-to-${team.id}`}
                                                    size="sm"
                                                    className="text-white text-xs"
                                                    style={{ backgroundColor: team.color }}
                                                >
                                                    {team.short_name}
                                                </ActionButton>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons - Hidden in presentation mode */}
                            {!presentationMode && (
                                <div className="border-t border-slate-200 p-3 bg-white flex items-center justify-center gap-3 shrink-0">
                                    <ActionButton onClick={handleUnsold} loading={actionLoading === 'unsold'} variant="outline" size="md">
                                        <X className="w-4 h-4" /> Unsold
                                    </ActionButton>

                                    <ActionButton
                                        onClick={handleSell}
                                        disabled={!currentBidder || (auctionState?.tied_teams && auctionState.tied_teams.length > 1)}
                                        loading={actionLoading === 'sell'}
                                        variant="success"
                                        size="xl"
                                        className="min-w-[140px]"
                                    >
                                        <Hammer className="w-5 h-5" /> SOLD!
                                    </ActionButton>

                                    <ActionButton onClick={handleSkipPlayer} loading={actionLoading === 'skip'} variant="outline" size="md">
                                        <SkipForward className="w-4 h-4" /> Skip
                                    </ActionButton>
                                </div>
                            )}
                        </Card>
                    )}
                </section>

                {/* Right Sidebar - Bid History */}
                <aside className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${presentationMode ? 'w-80' : 'w-64'}`}>
                    <div className="p-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-slate-800 text-sm">Bids</span>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">Live</Badge>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className={`space-y-1.5 transition-all duration-300 ${presentationMode ? 'p-3' : 'p-2'}`}>
                            {bidHistory.slice(0, 10).map((bid, index) => (
                                <div
                                    key={bid.id}
                                    className={`rounded-lg border transition-all ${presentationMode ? 'p-4' : 'p-2.5'} ${index === 0
                                        ? 'bg-indigo-50 border-indigo-200'
                                        : 'bg-slate-50 border-slate-100 opacity-70'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-semibold text-slate-800 transition-all duration-300 ${presentationMode ? 'text-sm' : 'text-xs'}`}>{bid.team?.name || 'Unknown'}</span>
                                        <span className={`text-slate-400 font-mono transition-all duration-300 ${presentationMode ? 'text-xs' : 'text-[9px]'}`}>{bid.created_at ? formatTime(bid.created_at) : '--:--:--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`font-black transition-all duration-300 ${presentationMode ? 'text-xl' : 'text-base'} ${index === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                                            {formatCurrency(bid.amount)}
                                        </p>
                                        {index === 0 && <Crown className={`text-amber-500 transition-all duration-300 ${presentationMode ? 'w-5 h-5' : 'w-3 h-3'}`} />}
                                    </div>
                                </div>
                            ))}
                            {bidHistory.length === 0 && (
                                <p className={`text-center text-slate-400 py-6 transition-all duration-300 ${presentationMode ? 'text-sm' : 'text-xs'}`}>No bids yet</p>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-2 border-t border-slate-200 shrink-0">
                        <ActionButton
                            onClick={handleUndoBid}
                            disabled={bidHistory.length === 0}
                            loading={actionLoading === 'undo'}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            <RotateCcw className="w-3 h-3" /> Undo Last Bid
                        </ActionButton>
                    </div>
                </aside>
            </main>

            {/* Team Squad Dialog */}
            <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                <DialogContent className="!bg-white dark:!bg-white !text-slate-900 dark:!text-slate-900 border-slate-200 max-w-lg max-h-[70vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base !text-slate-900 dark:!text-slate-900">
                            {selectedTeam && (
                                <>
                                    {selectedTeam.logo_url ? (
                                        <img src={getImageUrl(selectedTeam.logo_url)} alt={selectedTeam.name} className="w-8 h-8 rounded object-contain bg-slate-50" />
                                    ) : (
                                        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: selectedTeam.color }}>
                                            {selectedTeam.short_name}
                                        </div>
                                    )}
                                    {selectedTeam.name} Squad
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="!text-slate-600 dark:!text-slate-600">
                            {selectedTeam && (
                                <span className="text-xs">
                                    Spent: <span className="font-bold text-emerald-600">{formatCurrency(selectedTeam.spent || 0)}</span> •
                                    Left: <span className="font-bold text-red-600">{formatCurrency(selectedTeam.remaining_budget || (selectedTeam.budget - (selectedTeam.spent || 0)))}</span>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] mt-2">
                        {loadingSquad ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : teamSquad.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">No players yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {teamSquad.map((player) => (
                                    <div key={player.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                        <div className="w-10 h-10 rounded bg-white border overflow-hidden shrink-0">
                                            {player.image_url ? (
                                                <img src={getImageUrl(player.image_url)} alt={player.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{player.name}</p>
                                            <p className="text-[10px] text-slate-400">{player.role}</p>
                                        </div>
                                        <p className="font-bold text-emerald-600 text-sm">{formatCurrency(player.sold_price || player.base_price)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
