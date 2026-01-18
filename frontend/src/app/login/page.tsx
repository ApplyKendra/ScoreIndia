'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, Video, ShoppingBag, UtensilsCrossed, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';

interface LoginFormData {
    email: string;
    password: string;
}

function LoginContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Prevent multiple redirects
        if (isRedirecting) return;

        if (isAuthenticated && user) {
            setIsRedirecting(true);
            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.replace(redirect);
            } else if (user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN') {
                router.replace('/admin');
            } else {
                router.replace('/');
            }
        }
    }, [isAuthenticated, user, router, searchParams, isRedirecting]);


    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.login({ email: data.email, password: data.password });

            // Check if 2FA setup is required (first-time admin login)
            if (response.requiresTwoFactorSetup && response.userId && response.setupToken) {
                toast.info('Two-factor authentication setup is required');
                // Redirect to dedicated 2FA setup page with userId and setupToken
                router.push(`/setup-2fa?userId=${response.userId}&token=${encodeURIComponent(response.setupToken)}`);
                return;
            }

            // Check if 2FA verification is required
            if (response.requiresTwoFactor && response.userId) {
                setRequiresTwoFactor(true);
                setPendingUserId(response.userId);
                toast.info('Please enter your 2FA code');
                return;
            }

            // Normal login - tokens are set in HttpOnly cookies
            login(response.user);
            toast.success('Welcome back!');

            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.push(redirect);
            } else if (response.user.role === 'SUPER_ADMIN' || response.user.role === 'SUB_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const [requiresEmailOtp, setRequiresEmailOtp] = useState(false);
    const [emailOtpCode, setEmailOtpCode] = useState('');
    const [resendCount, setResendCount] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Resend OTP handler with 3x limit
    const handleResendOtp = async () => {
        if (!pendingUserId || resendCount >= 3 || resendCooldown > 0) return;

        setIsLoading(true);
        try {
            await authApi.resendLoginOtp(pendingUserId);
            setResendCount(prev => prev + 1);
            toast.success('New OTP sent to your email');

            // 30 second cooldown between resends
            setResendCooldown(30);
            const interval = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTwoFactorSubmit = async () => {
        if (!pendingUserId || twoFactorCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.validateTwoFactor(pendingUserId, twoFactorCode);

            // Check if email OTP is required (admin accounts)
            if (response.requiresEmailOtp && response.userId) {
                setRequiresTwoFactor(false);
                setRequiresEmailOtp(true);
                setTwoFactorCode('');
                toast.info('An OTP has been sent to your email');
                return;
            }

            login(response.user);
            toast.success('Welcome back!');

            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.push(redirect);
            } else if (response.user.role === 'SUPER_ADMIN' || response.user.role === 'SUB_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid 2FA code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailOtpSubmit = async () => {
        if (!pendingUserId || emailOtpCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            console.log('🔐 Verifying email OTP...');
            const response = await authApi.verifyEmailOtp(pendingUserId, emailOtpCode);
            console.log('🔐 OTP Verify Response:', response);
            console.log('🔐 User:', response.user);
            console.log('🔐 User Role:', response.user?.role);

            login(response.user);
            toast.success('Welcome back!');

            const redirect = searchParams.get('redirect');
            console.log('🔐 Redirect param:', redirect);
            console.log('🔐 Checking role for redirect...');

            if (redirect) {
                console.log('🔐 Redirecting to:', redirect);
                router.push(redirect);
            } else if (response.user.role === 'SUPER_ADMIN' || response.user.role === 'SUB_ADMIN') {
                console.log('🔐 Admin role detected, redirecting to /admin');
                router.push('/admin');
            } else {
                console.log('🔐 User role, redirecting to /');
                router.push('/');
            }
        } catch (error: any) {
            console.error('🔐 OTP Verify Error:', error);
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 flex items-center justify-center p-4">
            {/* Back to Home */}
            <Link
                href="/"
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                Back to Home
            </Link>

            <div className="w-full max-w-6xl mx-auto">
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="flex flex-wrap items-stretch min-h-[620px]">
                        {/* Left Side - Login Form */}
                        <div className="w-full xl:w-1/2">
                            <div className="w-full p-6 sm:p-8 lg:p-12 xl:p-16">
                                <div className="mb-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        {/* Logo */}
                                        <Link href="/" className="flex items-center gap-2 group">
                                            <div className="h-12 w-12 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#5750F1]/20 group-hover:scale-105 transition-transform duration-300">
                                                <Image
                                                    src="/logo-white.svg"
                                                    alt="ISKCON Logo"
                                                    width={32}
                                                    height={32}
                                                    className="h-8 w-8"
                                                />
                                            </div>
                                            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">ISKCON Burla</span>
                                        </Link>
                                        <Link href="/register" className="text-sm font-medium text-[#5750F1] hover:underline">
                                            Create account
                                        </Link>
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                        Welcome back
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                        Sign in to access your ISKCON services
                                    </p>
                                </div>

                                {/* Login Form, 2FA Form, or Email OTP Form */}
                                {requiresEmailOtp ? (
                                    <div className="space-y-5">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl flex items-center justify-center">
                                                <Mail className="h-8 w-8 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                Email Verification
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                                Enter the 6-digit code sent to your email
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emailOtpCode" className="text-sm font-medium">
                                                Email OTP Code
                                            </Label>
                                            <Input
                                                id="emailOtpCode"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="000000"
                                                value={emailOtpCode}
                                                onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#10B981] focus:ring-[#10B981]"
                                                maxLength={6}
                                                autoFocus
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleEmailOtpSubmit}
                                            className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white text-base font-medium shadow-lg shadow-[#10B981]/25"
                                            disabled={isLoading || emailOtpCode.length !== 6}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify & Sign In'
                                            )}
                                        </Button>
                                        {/* Resend OTP Button */}
                                        <div className="text-center">
                                            {resendCount < 3 ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="text-sm text-[#10B981] hover:text-[#059669]"
                                                    onClick={handleResendOtp}
                                                    disabled={isLoading || resendCooldown > 0}
                                                >
                                                    {resendCooldown > 0 ? (
                                                        `Resend in ${resendCooldown}s`
                                                    ) : (
                                                        `Resend OTP (${3 - resendCount} left)`
                                                    )}
                                                </Button>
                                            ) : (
                                                <p className="text-sm text-red-500">Maximum resend attempts reached</p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => {
                                                setRequiresEmailOtp(false);
                                                setEmailOtpCode('');
                                                setPendingUserId(null);
                                                setResendCount(0);
                                            }}
                                        >
                                            Back to Login
                                        </Button>
                                    </div>
                                ) : requiresTwoFactor ? (
                                    <div className="space-y-5">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-2xl flex items-center justify-center">
                                                <Lock className="h-8 w-8 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                Two-Factor Authentication
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                                Enter the 6-digit code from your authenticator app
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twoFactorCode" className="text-sm font-medium">
                                                Verification Code
                                            </Label>
                                            <Input
                                                id="twoFactorCode"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="000000"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1]"
                                                maxLength={6}
                                                autoFocus
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleTwoFactorSubmit}
                                            className="w-full h-12 bg-[#5750F1] hover:bg-[#4a43d6] text-white text-base font-medium shadow-lg shadow-[#5750F1]/25"
                                            disabled={isLoading || twoFactorCode.length !== 6}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Continue'
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => {
                                                setRequiresTwoFactor(false);
                                                setTwoFactorCode('');
                                                setPendingUserId(null);
                                            }}
                                        >
                                            Back to Login
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    {...register('email', {
                                                        required: 'Email is required',
                                                        pattern: {
                                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                            message: 'Invalid email address',
                                                        },
                                                    })}
                                                    className={`pl-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.email ? 'border-red-500 ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-red-500">{errors.email.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                                <Link href="#" className="text-sm text-[#5750F1] hover:underline">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...register('password', {
                                                        required: 'Password is required',
                                                    })}
                                                    className={`pl-10 pr-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.password ? 'border-red-500 ring-red-500' : ''}`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                                </Button>
                                            </div>
                                            {errors.password && (
                                                <p className="text-sm text-red-500">{errors.password.message}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-[#5750F1] hover:bg-[#4a43d6] text-white text-base font-medium shadow-lg shadow-[#5750F1]/25"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                'Sign in'
                                            )}
                                        </Button>
                                    </form>
                                )}

                                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/register" className="font-medium text-[#5750F1] hover:underline">
                                        Register here
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Gradient Panel */}
                        <div className="hidden xl:block xl:w-1/2 bg-gradient-to-br from-indigo-700 via-[#5750F1] to-purple-700 relative">
                            <div className="p-10 h-full flex flex-col justify-center text-white relative z-10">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                            <Image
                                                src="/logo-white.svg"
                                                alt="ISKCON Logo"
                                                width={48}
                                                height={48}
                                                className="h-12 w-12"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">ISKCON Portal</h2>
                                            <p className="text-indigo-100 text-sm">Digital Temple Services</p>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-3xl font-bold mb-4">
                                    Your gateway to spiritual services
                                </h2>

                                <p className="text-indigo-100 text-lg mb-8">
                                    Access prasadam ordering, temple store, live darshan, and youth programs all in one place.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <UtensilsCrossed className="h-4 w-4" />
                                        </div>
                                        <span className="text-indigo-100">Order Prasadam Online</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <span className="text-indigo-100">Shop Devotional Items</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Video className="h-4 w-4" />
                                        </div>
                                        <span className="text-indigo-100">Watch Live Darshan</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <span className="text-indigo-100">Join Youth Programs</span>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <div className="text-sm text-indigo-100/90 mb-2">Trusted by</div>
                                    <div className="text-2xl font-bold">10,000+ Devotees</div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24 blur-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
