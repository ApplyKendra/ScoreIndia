'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingBag, Calendar, UtensilsCrossed, TrendingUp, ArrowUpRight, Activity, DollarSign, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: '150+',
            icon: Users,
            description: 'Active community members',
            trend: '+12%',
            trendLabel: 'from last month',
            color: 'from-[#5750F1] to-[#867EF9]',
        },
        {
            title: 'Prasadam Orders',
            value: '24',
            icon: UtensilsCrossed,
            description: 'Fresh orders today',
            trend: '+5%',
            trendLabel: 'from yesterday',
            color: 'from-[#7C3AED] to-[#A78BFA]',
        },
        {
            title: 'Store Revenue',
            value: '₹12,450',
            icon: DollarSign,
            description: 'Total sales today',
            trend: '+18%',
            trendLabel: 'from last week',
            color: 'from-[#059669] to-[#34D399]',
        },
        {
            title: 'Active Events',
            value: '3',
            icon: Calendar,
            description: 'Upcoming programs',
            trend: 'Next',
            trendLabel: 'Sunday Feast',
            color: 'from-[#D97706] to-[#FBBF24]',
        },
    ];

    const recentActivities = [
        { id: 1, title: 'New Order #ORD-001', description: 'Ram Das ordered Govinda\'s Thali', time: '2m ago', status: 'new' },
        { id: 2, title: 'Order Completed #ORD-098', description: 'Delivery confirmed by Radha Dasi', time: '15m ago', status: 'completed' },
        { id: 3, title: 'New Registration', description: 'Govind Kumar joined as devotee', time: '32m ago', status: 'new' },
    ];

    const quickLinks = [
        { label: 'Manage Users', href: '/admin/users', icon: Users },
        { label: 'View Orders', href: '/admin/orders', icon: ShoppingBag },
        { label: 'Add Event', href: '/admin/events', icon: Calendar },
        { label: 'Menu Items', href: '/admin/menu', icon: UtensilsCrossed },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, <span className="font-medium text-foreground">{user?.name}</span>. Here&apos;s your daily overview.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-background border border-border/50 backdrop-blur-sm p-2 px-4 rounded-xl shadow-sm">
                    <Clock className="h-4 w-4 text-[#5750F1]" />
                    <span className="text-sm font-medium text-foreground">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} variant="elevated" className="overflow-hidden relative group hover:-translate-y-1 transition-all duration-300">
                        {/* Gradient accent */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-2 text-foreground">{stat.value}</div>
                            <div className="flex items-center text-xs">
                                <span className={`flex items-center gap-1 font-medium ${stat.trend.includes('+') ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {stat.trend.includes('+') && <TrendingUp className="w-3 h-3" />}
                                    {stat.trend}
                                </span>
                                <span className="text-muted-foreground ml-1">{stat.trendLabel}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card variant="elevated" className="lg:col-span-4">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-[#5750F1]" />
                                    Recent Activity
                                </CardTitle>
                                <CardDescription>Latest actions across the platform</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#5750F1] hover:text-[#4a43d6] hover:bg-[#5750F1]/10">
                                View All <ArrowRight className="ml-1 w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity, i) => (
                                <div key={activity.id} className="flex items-start gap-4 group">
                                    {/* Timeline indicator */}
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full transition-colors ${activity.status === 'new' ? 'bg-[#5750F1] ring-4 ring-[#5750F1]/20' : 'bg-green-500 ring-4 ring-green-500/20'}`} />
                                        {i < recentActivities.length - 1 && (
                                            <div className="w-0.5 h-12 bg-border/50 mt-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 bg-muted/30 hover:bg-muted/50 p-4 rounded-xl transition-colors -mt-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {activity.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / System Health */}
                <Card variant="elevated" className="lg:col-span-3 flex flex-col">
                    <CardHeader>
                        <CardTitle>System Overview</CardTitle>
                        <CardDescription>Quick status check</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        {/* Server Status */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Server Status</span>
                                <span className="text-green-600 font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Operational
                                </span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-full rounded-full" />
                            </div>
                        </div>

                        {/* Storage Usage */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Storage Usage</span>
                                <span className="font-medium text-foreground">45%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#5750F1] to-[#867EF9] w-[45%] rounded-full" />
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="pt-4 border-t border-border/50">
                            <h4 className="font-medium mb-4 text-foreground">Quick Links</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {quickLinks.map((link) => (
                                    <Link key={link.href} href={link.href}>
                                        <div className="p-3 bg-muted/30 rounded-xl hover:bg-[#5750F1]/10 hover:text-[#5750F1] transition-all cursor-pointer text-sm font-medium text-center group flex flex-col items-center gap-2">
                                            <link.icon className="w-5 h-5 text-muted-foreground group-hover:text-[#5750F1] transition-colors" />
                                            {link.label}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
