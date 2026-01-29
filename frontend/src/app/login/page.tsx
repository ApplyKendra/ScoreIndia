'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gavel, Mail, Lock, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

// Role-based redirect paths
const getRoleRedirectPath = (role: string): string => {
    switch (role) {
        case 'super_admin':
        case 'admin':
            return '/admin';
        case 'host':
            return '/host';
        case 'bidder':
            return '/bidders';
        case 'viewer':
        default:
            return '/auctions';
    }
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
    const { login, isAuthenticated, user } = useAuth();
    const router = useRouter();

    // Handle redirect after successful login and auth state update
    useEffect(() => {
        if (isAuthenticated && user && pendingRedirect) {
            router.push(pendingRedirect);
            setPendingRedirect(null);
        }
    }, [isAuthenticated, user, pendingRedirect, router]);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectPath = getRoleRedirectPath(user.role);
            router.push(redirectPath);
        }
    }, [isAuthenticated, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            toast.success('Login successful!');
            // Set pending redirect - will trigger when auth state updates
            const response = await api.login(email, password).catch(() => null);
            const role = response?.user?.role || 'viewer';
            const redirectPath = getRoleRedirectPath(role);
            setPendingRedirect(redirectPath);
            // Also try immediate redirect as backup
            setTimeout(() => {
                router.push(redirectPath);
            }, 100);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
            toast.error(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-slate-900 z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Left Panel: Form */}
            <div className="relative z-10 flex flex-col justify-center px-6 lg:px-12 xl:px-24 py-12 bg-white/5 lg:bg-transparent backdrop-blur-lg lg:backdrop-blur-none border-r border-white/5">
                <div className="w-full max-w-md mx-auto space-y-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-transparent border border-amber-400/40 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">
                            Score<span className="text-amber-400">India</span>
                        </h1>
                    </div>

                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                        <p className="text-slate-400">Enter your credentials to access your dashboard.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="sonu@scoreindia.cloud"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                                    <Link href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 rounded-xl transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Signing in...</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500">
                        Need help?{' '}
                        <a href="mailto:admin@scoreindia.cloud" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Contact Support</a>
                    </p>
                </div>
            </div>

            {/* Right Panel: Feature Showcase */}
            <div className="hidden lg:flex flex-col justify-center items-center relative z-10 p-12 text-center">
                <div className="max-w-lg space-y-6">
                    <div className="relative isolate">
                        <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full" />
                        <Card className="relative bg-slate-800/50 border-slate-700 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-2">
                                <Gavel className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Professional Auction Platform</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Experience the most advanced player auction system with real-time bidding, squad management, and deep analytics.
                            </p>

                            <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-slate-700/50">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">140+</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">players</p>
                                </div>
                                <div className="text-center border-l border-slate-700/50 border-r">
                                    <p className="text-2xl font-bold text-white">₹15L</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">value</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">10</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">teams</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Floating Elements (Decorative) */}
                <div className="absolute top-20 right-20 animate-bounce delay-700">
                    <div className="px-4 py-2 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 text-xs font-mono text-green-400 shadow-xl">
                        Backend Connected ✓
                    </div>
                </div>
                <div className="absolute bottom-40 left-20 animate-bounce duration-[3000ms]">
                    <div className="px-4 py-2 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 text-xs font-mono text-blue-400 shadow-xl">
                        Real-time Ready
                    </div>
                </div>
            </div>
        </div>
    );
}
