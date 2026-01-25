'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Shield,
    Settings,
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    Download,
    Upload,
    UserPlus,
    Briefcase,
    Trophy,
    Gavel,
    Filter,
    LogOut
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { AdminGuard } from '@/components/auth/RoleGuard';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---
interface Team {
    id: string;
    name: string;
    short_name: string;
    color: string;
    budget: number;
    spent: number;
    remaining_budget: number;
    player_count: number;
    logo_url?: string;
}

interface Player {
    id: string;
    name: string;
    role: string;
    base_price: number;
    category: string;
    status: string;
    image_url?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    team_id?: string;
    team?: Team;
}

interface Stats {
    total_teams: number;
    total_players: number;
    registered_bidders: number;
    total_auction_value: number;
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
};

// --- Components ---
function TeamCard({ team, onEdit }: { team: Team; onEdit: () => void }) {
    return (
        <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
                    style={{ backgroundColor: team.color }}
                >
                    {team.short_name}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{team.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Purse: {formatCurrency(team.budget)}</span>
                        <span>•</span>
                        <span className="text-emerald-600">
                            {team.player_count || 0} Players
                        </span>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit2 className="w-4 h-4 text-slate-400" />
            </Button>
        </Card>
    );
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

    // Data states
    const [stats, setStats] = useState<Stats | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newTeam, setNewTeam] = useState({ name: '', short_name: '', color: '#0066FF', budget: 150000, logo_url: '' });
    const [newPlayer, setNewPlayer] = useState({ name: '', country: 'India', role: 'Batsman', base_price: 2000000, category: 'Set 1', image_url: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'bidder', team_id: '' });

    // Edit User state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);

    // Edit Team State
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect if not authenticated or not admin/super_admin
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        // Role-based access control - only super_admin and admin can access
        if (!authLoading && user && !['super_admin', 'admin'].includes(user.role)) {
            // Redirect to appropriate page based on role
            if (user.role === 'host') {
                router.push('/host');
            } else if (user.role === 'bidder') {
                router.push('/bidders');
            } else {
                router.push('/auctions');
            }
        }
    }, [isAuthenticated, authLoading, user, router]);

    // Fetch data
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsData, teamsData, playersData, usersData] = await Promise.all([
                    api.getOverviewStats().catch(() => null),
                    api.getTeams().catch(() => []),
                    api.getPlayers({ limit: 100 }).catch(() => ({ data: [] })),
                    api.getUsers().catch(() => []),
                ]);

                setStats(statsData);
                setTeams(teamsData || []);
                setPlayers(playersData?.data || []);
                setUsers(usersData || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // Handlers
    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await api.updateUser(editingUser.id, {
                role: editingUser.role,
                team_id: editingUser.team_id || null
            });
            toast.success('User updated successfully!');
            setIsEditUserOpen(false);
            setEditingUser(null);
            // Refresh users
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        }
    };

    const handleCreateTeam = async () => {
        try {
            await api.createTeam(newTeam);
            toast.success('Team created successfully!');
            setIsAddTeamOpen(false);
            setNewTeam({ name: '', short_name: '', color: '#0066FF', budget: 150000, logo_url: '' });
            // Refresh teams
            const teamsData = await api.getTeams();
            setTeams(teamsData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create team');
        }
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam) return;
        try {
            await api.updateTeam(editingTeam.id, editingTeam);
            toast.success('Team updated successfully!');
            setIsEditTeamOpen(false);
            setEditingTeam(null);
            // Refresh teams
            const teamsData = await api.getTeams();
            setTeams(teamsData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update team');
        }
    };

    const handlePopulateTeams = async () => {
        const teamsToCreate = [
            { name: 'LaxmiNarayan Cricket Club', short_name: 'LCC', color: '#ff5733' },
            { name: 'Samlei Super Kings', short_name: 'SSK', color: '#ffd700' },
            { name: 'Western Tigers', short_name: 'WT', color: '#33ff57' },
            { name: 'Maa Durga Cricket Club', short_name: 'MDCC', color: '#ff33a8' },
            { name: 'Kaushal Tigers', short_name: 'KT', color: '#3357ff' },
            { name: 'Choice XI', short_name: 'CXI', color: '#33fff3' },
            { name: 'Veterans United', short_name: 'VU', color: '#8d33ff' },
            { name: 'Sambalpur Titans', short_name: 'ST', color: '#ff8d33' },
        ];

        try {
            toast.info('Populating teams...');
            for (const team of teamsToCreate) {
                await api.createTeam({ ...team, budget: 150000 });
            }
            toast.success('All teams populated successfully!');
            // Refresh teams
            const teamsData = await api.getTeams();
            setTeams(teamsData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to populate teams');
        }
    };

    const handleCreatePlayer = async () => {
        try {
            await api.createPlayer(newPlayer);
            toast.success('Player created successfully!');
            setIsAddPlayerOpen(false);
            toast.success('Player created successfully!');
            setIsAddPlayerOpen(false);
            setNewPlayer({ name: '', country: 'India', role: 'Batsman', base_price: 2000000, category: 'Set 1', image_url: '' });
            // Refresh players
            const playersData = await api.getPlayers({ limit: 100 });
            setPlayers(playersData?.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create player');
        }
    };

    const handlePopulatePlayers = async () => {
        const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'];
        const randomNames = [
            'Aarav Patel', 'Vihaan Sharma', 'Arjun Singh', 'Rohan Gupta', 'Ishaan Kumar',
            'Aditya Verma', 'Siddharth Malhotra', 'Kabir Das', 'Reyansh Reddy', 'Vivaan Joshi',
            'Sai Prasad', 'Dhruv Mehta', 'Ayaan Khan', 'Krishna Iyer', 'Atharva Nair',
            'Shaurya Jain', 'Rudraksh Mishra', 'Advait Rao', 'Pranav Kulkarni', 'Omkar Patil'
        ];

        try {
            toast.info('Populating players...');
            for (let i = 0; i < 20; i++) {
                const player = {
                    name: randomNames[i] || `Player ${i + 1}`,
                    country: 'India',
                    role: roles[Math.floor(Math.random() * roles.length)],
                    base_price: 2000,
                    category: i < 5 ? 'Marquee' : i < 10 ? 'Set 1' : 'Set 2'
                };
                await api.createPlayer(player);
            }
            toast.success('20 random players populated successfully!');
            // Refresh players
            const playersData = await api.getPlayers({ limit: 100 });
            setPlayers(playersData?.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to populate players');
        }
    };

    const handleCreateUser = async () => {
        try {
            await api.createUser(newUser);
            toast.success('User created successfully!');
            setIsAddUserOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'bidder', team_id: '' });
            // Refresh users
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
        }
    };

    const handleDeletePlayer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this player?')) return;
        try {
            await api.deletePlayer(id);
            toast.success('Player deleted');
            setPlayers(players.filter(p => p.id !== id));
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete player');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.deleteUser(id);
            toast.success('User deleted');
            setUsers(users.filter(u => u.id !== id));
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const STATS = [
        { label: 'Total Teams', value: stats?.total_teams || (teams?.length ?? 0), icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Players', value: stats?.total_players || (players?.length ?? 0), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Registered Bidders', value: stats?.registered_bidders || (users?.filter(u => u.role === 'bidder').length ?? 0), icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Auction Value', value: formatCurrency(stats?.total_auction_value || 0), icon: Gavel, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Shield className="w-6 h-6 text-indigo-400 mr-3" />
                    <span className="font-bold text-lg tracking-wide">Admin Console</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Button
                        variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Overview
                    </Button>
                    <Button
                        variant={activeTab === 'teams' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setActiveTab('teams')}
                    >
                        <Trophy className="w-4 h-4 mr-3" />
                        Manage Teams
                    </Button>
                    <Button
                        variant={activeTab === 'players' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setActiveTab('players')}
                    >
                        <Users className="w-4 h-4 mr-3" />
                        Manage Players
                    </Button>
                    <Button
                        variant={activeTab === 'users' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setActiveTab('users')}
                    >
                        <Briefcase className="w-4 h-4 mr-3" />
                        Bidders & Users
                    </Button>
                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <Button
                            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                        </Button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-slate-600">
                                <AvatarFallback className="bg-slate-700 text-xs">
                                    {user?.name?.charAt(0) || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-slate-400">{user?.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">

                {/* --- Overview Tab --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                            <p className="text-slate-500">Welcome back, {user?.name || 'Administrator'}.</p>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {STATS.map((stat) => (
                                <Card key={stat.label} className="p-6 border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <Badge variant="outline" className="text-xs font-normal">Live</Badge>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <Card className="p-6 border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-800">Recent Users</h3>
                                    <Button variant="outline" size="sm" onClick={() => setActiveTab('users')}>View All</Button>
                                </div>
                                <div className="space-y-4">
                                    {users.slice(0, 3).map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                                                    <p className="text-xs text-slate-500">{u.role}</p>
                                                </div>
                                            </div>
                                            <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className={u.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {u.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-4">No users yet</p>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                    <Gavel className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Start Auction</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Go to Host Dashboard to start and manage the live auction.</p>
                                </div>
                                <Button onClick={() => router.push('/host')}>Go to Host Dashboard</Button>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- Teams Tab --- */}
                {activeTab === 'teams' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Manage Teams</h1>
                                <p className="text-slate-500">Create, edit, and manage auction teams.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePopulateTeams}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Populate Teams
                                </Button>
                                <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add New Team
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Create New Team</DialogTitle>
                                            <DialogDescription>Add a new team to the auction.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Team Name</Label>
                                                <Input
                                                    value={newTeam.name}
                                                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                                    placeholder="Mumbai Masters"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Team Logo</Label>
                                                <ImageUpload
                                                    value={newTeam.logo_url}
                                                    onChange={(url) => setNewTeam({ ...newTeam, logo_url: url })}
                                                    label="Upload Logo"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Short Name</Label>
                                                    <Input
                                                        value={newTeam.short_name}
                                                        onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value })}
                                                        placeholder="MM"
                                                        maxLength={5}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Color</Label>
                                                    <Input
                                                        type="color"
                                                        value={newTeam.color}
                                                        onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Budget (in paisa)</Label>
                                                <Input
                                                    type="number"
                                                    value={newTeam.budget}
                                                    onChange={(e) => setNewTeam({ ...newTeam, budget: parseInt(e.target.value) })}
                                                />
                                                <p className="text-xs text-slate-500">Current: {formatCurrency(newTeam.budget)}</p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateTeam}>Create Team</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                        </div>

                        {/* Edit Team Dialog */}
                        <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Edit Team</DialogTitle>
                                    <DialogDescription>Update team details.</DialogDescription>
                                </DialogHeader>
                                {editingTeam && (
                                    <div className="space-y-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Team Name</Label>
                                            <Input
                                                value={editingTeam.name}
                                                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                                placeholder="Mumbai Masters"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Team Logo</Label>
                                            <ImageUpload
                                                value={editingTeam.logo_url}
                                                onChange={(url) => setEditingTeam({ ...editingTeam, logo_url: url })}
                                                label="Upload Logo"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Short Name</Label>
                                                <Input
                                                    value={editingTeam.short_name}
                                                    onChange={(e) => setEditingTeam({ ...editingTeam, short_name: e.target.value })}
                                                    placeholder="MM"
                                                    maxLength={5}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Color</Label>
                                                <Input
                                                    type="color"
                                                    value={editingTeam.color}
                                                    onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Budget (in paisa)</Label>
                                            <Input
                                                type="number"
                                                value={editingTeam.budget}
                                                onChange={(e) => setEditingTeam({ ...editingTeam, budget: parseInt(e.target.value) })}
                                            />
                                            <p className="text-xs text-slate-500">Current: {formatCurrency(editingTeam.budget)}</p>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditTeamOpen(false)}>Cancel</Button>
                                    <Button onClick={handleUpdateTeam}>Update Team</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    onEdit={() => {
                                        setEditingTeam(team);
                                        setIsEditTeamOpen(true);
                                    }}
                                />
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-3 text-center py-12 text-slate-400">
                                    No teams yet. Click "Add New Team" to create one.
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {/* --- Players Tab --- */}
                {
                    activeTab === 'players' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Player Database</h1>
                                    <p className="text-slate-500">{players.length} players in the pool</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handlePopulatePlayers}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Populate Random Players
                                    </Button>
                                    <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Player
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Add New Player</DialogTitle>
                                                <DialogDescription>Add a player to the auction pool.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Player Name</Label>
                                                    <Input
                                                        value={newPlayer.name}
                                                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                                        placeholder="Virat Kohli"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Player Image</Label>
                                                    <ImageUpload
                                                        value={newPlayer.image_url}
                                                        onChange={(url) => setNewPlayer({ ...newPlayer, image_url: url })}
                                                        label="Upload Photo"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label>Country</Label>
                                                        <Input
                                                            value={newPlayer.country}
                                                            onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })}
                                                            placeholder="India"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Role</Label>
                                                        <Select value={newPlayer.role} onValueChange={(v) => setNewPlayer({ ...newPlayer, role: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Batsman">Batsman</SelectItem>
                                                                <SelectItem value="Bowler">Bowler</SelectItem>
                                                                <SelectItem value="All-rounder">All-rounder</SelectItem>
                                                                <SelectItem value="Wicketkeeper">Wicketkeeper</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label>Base Price (paisa)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newPlayer.base_price}
                                                            onChange={(e) => setNewPlayer({ ...newPlayer, base_price: parseInt(e.target.value) })}
                                                        />
                                                        <p className="text-xs text-slate-500">{formatCurrency(newPlayer.base_price)}</p>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Category</Label>
                                                        <Select value={newPlayer.category} onValueChange={(v) => setNewPlayer({ ...newPlayer, category: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Marquee">Marquee</SelectItem>
                                                                <SelectItem value="Set 1">Set 1</SelectItem>
                                                                <SelectItem value="Set 2">Set 2</SelectItem>
                                                                <SelectItem value="Set 3">Set 3</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddPlayerOpen(false)}>Cancel</Button>
                                                <Button onClick={handleCreatePlayer}>Add Player</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <Card className="border-slate-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Player Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Base Price</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {players.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell className="font-medium text-slate-900">{player.name}</TableCell>
                                                <TableCell>{player.role}</TableCell>
                                                <TableCell>{formatCurrency(player.base_price)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal text-slate-600">
                                                        {player.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={player.status === 'sold' ? 'default' : 'outline'} className={player.status === 'sold' ? 'bg-emerald-500' : ''}>
                                                        {player.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeletePlayer(player.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {players.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                                    No players yet. Click "Add Player" to create one.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )
                }

                {/* --- Users Tab --- */}
                {
                    activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Bidders & Users</h1>
                                    <p className="text-slate-500">Manage user accounts and team assignments.</p>
                                </div>
                                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Create New Bidder
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Create New Bidder Account</DialogTitle>
                                            <DialogDescription>Add a new user and assign them to a team.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Full Name</Label>
                                                <Input
                                                    value={newUser.name}
                                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Email Address</Label>
                                                <Input
                                                    type="email"
                                                    value={newUser.email}
                                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                    placeholder="john@team.com"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    value={newUser.password}
                                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Role</Label>
                                                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bidder">Bidder</SelectItem>
                                                        <SelectItem value="host">Host</SelectItem>
                                                        <SelectItem value="admin">Administrator</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {teams.length > 0 && (
                                                <div className="grid gap-2">
                                                    <Label>Assign Team (Optional)</Label>
                                                    <Select value={newUser.team_id} onValueChange={(v) => setNewUser({ ...newUser, team_id: v })}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a team..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {teams.map(team => (
                                                                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateUser}>Create Account</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Card className="border-slate-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User Details</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Assigned Team</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{u.name}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">{u.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {u.team ? (
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: u.team.color }}
                                                            />
                                                            <span className="text-sm font-medium">{u.team.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">No Team</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        {u.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                                                            setEditingUser(u);
                                                            setIsEditUserOpen(true);
                                                        }}>
                                                            <Edit2 className="w-4 h-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteUser(u.id)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {users.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                                    No users yet. Click "Create New Bidder" to add one.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>

                            {/* Edit User Dialog */}
                            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Edit User</DialogTitle>
                                        <DialogDescription>Update user role and team assignment.</DialogDescription>
                                    </DialogHeader>
                                    {editingUser && (
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Full Name</Label>
                                                <Input value={editingUser.name} disabled />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Email Address</Label>
                                                <Input value={editingUser.email} disabled />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Role</Label>
                                                <Select
                                                    value={editingUser.role}
                                                    onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bidder">Bidder</SelectItem>
                                                        <SelectItem value="host">Host</SelectItem>
                                                        <SelectItem value="admin">Administrator</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Assign Team</Label>
                                                <Select
                                                    value={editingUser.team_id || "none"}
                                                    onValueChange={(v) => setEditingUser({ ...editingUser, team_id: v === "none" ? undefined : v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a team..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Team</SelectItem>
                                                        {teams.map(team => (
                                                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateUser}>Update User</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Edit User Dialog */}
                            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Edit User</DialogTitle>
                                        <DialogDescription>Update user role and team assignment.</DialogDescription>
                                    </DialogHeader>
                                    {editingUser && (
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Full Name</Label>
                                                <Input value={editingUser.name} disabled />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Email Address</Label>
                                                <Input value={editingUser.email} disabled />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Role</Label>
                                                <Select
                                                    value={editingUser.role}
                                                    onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bidder">Bidder</SelectItem>
                                                        <SelectItem value="host">Host</SelectItem>
                                                        <SelectItem value="admin">Administrator</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Assign Team</Label>
                                                <Select
                                                    value={editingUser.team_id || "none"}
                                                    onValueChange={(v) => setEditingUser({ ...editingUser, team_id: v === "none" ? undefined : v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a team..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Team</SelectItem>
                                                        {teams.map(team => (
                                                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateUser}>Update User</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )
                }

                {/* --- Settings Tab --- */}
                {
                    activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
                                <p className="text-slate-500">Global settings and danger zone operations.</p>
                            </div>

                            {/* Danger Zone */}
                            <Card className="p-6 border-red-200 bg-red-50/50">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                        <Trash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-800 text-lg">Danger Zone</h3>
                                        <p className="text-sm text-red-600 mt-1 mb-4">
                                            These actions are irreversible. Please proceed with caution.
                                        </p>

                                        <div className="bg-white rounded-lg p-4 border border-red-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="max-w-xl">
                                                    <h4 className="font-semibold text-slate-800">Reset Entire Auction</h4>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        This will clear all bids, reset all players to available, and reset all team budgets.
                                                        Use this to start a completely fresh auction.
                                                    </p>
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="shrink-0 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Reset Auction
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-white text-slate-900">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-red-600">⚠️ Confirm Auction Reset</DialogTitle>
                                                            <DialogDescription asChild>
                                                                <div className="text-slate-700">
                                                                    <span>This action cannot be undone. This will permanently:</span>
                                                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-700">
                                                                        <li>Delete all bids from the database</li>
                                                                        <li>Reset all players to "available" status</li>
                                                                        <li>Reset all team spent amounts to ₹0</li>
                                                                        <li>Delete the current auction session</li>
                                                                    </ul>
                                                                </div>
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter className="mt-4">
                                                            <Button variant="outline">Cancel</Button>
                                                            <Button
                                                                variant="destructive"
                                                                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.resetAuction();
                                                                        toast.success('Auction reset successfully!');
                                                                        // Refresh data
                                                                        const [teamsData, playersData] = await Promise.all([
                                                                            api.getTeams(),
                                                                            api.getPlayers({ limit: 100 }),
                                                                        ]);
                                                                        setTeams(teamsData);
                                                                        setPlayers(playersData?.data || []);
                                                                    } catch (error: any) {
                                                                        toast.error(error.message || 'Failed to reset auction');
                                                                    }
                                                                }}
                                                            >
                                                                Yes, Reset Everything
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>

                                        {/* Reset Everything Section */}
                                        <div className="bg-white rounded-lg p-4 border border-red-200 mt-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="max-w-xl">
                                                    <h4 className="font-semibold text-slate-800">Reset Everything (Complete Wipe)</h4>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        This will delete ALL data including teams, players, bids, and auction records.
                                                        Use this to completely start fresh with an empty system.
                                                    </p>
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="shrink-0 bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Reset Everything
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-white text-slate-900">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-red-600">⚠️ DANGER: Complete System Wipe</DialogTitle>
                                                            <DialogDescription asChild>
                                                                <div className="text-slate-700">
                                                                    <span>This action is IRREVERSIBLE. This will permanently delete:</span>
                                                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-700">
                                                                        <li><strong>All teams</strong> from the database</li>
                                                                        <li><strong>All players</strong> from the database</li>
                                                                        <li><strong>All bids</strong> from the database</li>
                                                                        <li><strong>All auction sessions</strong></li>
                                                                    </ul>
                                                                    <p className="mt-3 font-semibold text-red-600 text-sm">You will need to re-add all teams and players after this operation.</p>
                                                                </div>
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter className="mt-4">
                                                            <Button variant="outline">Cancel</Button>
                                                            <Button
                                                                variant="destructive"
                                                                className="bg-red-700 hover:bg-red-800 text-white border-red-800"
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.resetEverything();
                                                                        toast.success('System reset complete - all data deleted!');
                                                                        // Refresh all data
                                                                        const [teamsData, playersData, statsData] = await Promise.all([
                                                                            api.getTeams(),
                                                                            api.getPlayers({ limit: 100 }),
                                                                            api.getOverviewStats().catch(() => null),
                                                                        ]);
                                                                        setTeams(teamsData || []);
                                                                        setPlayers(playersData?.data || []);
                                                                        setStats(statsData);
                                                                    } catch (error: any) {
                                                                        toast.error(error.message || 'Failed to reset system');
                                                                    }
                                                                }}
                                                            >
                                                                Yes, DELETE EVERYTHING
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
