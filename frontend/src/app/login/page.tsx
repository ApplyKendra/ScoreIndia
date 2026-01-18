'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
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

            if (response.requiresTwoFactorSetup && response.userId && response.setupToken) {
                toast.info('Two-factor authentication setup is required');
                router.push(`/setup-2fa?userId=${response.userId}&token=${encodeURIComponent(response.setupToken)}`);
                return;
            }

            if (response.requiresTwoFactor && response.userId) {
                setRequiresTwoFactor(true);
                setPendingUserId(response.userId);
                toast.info('Please enter your 2FA code');
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

    const handleResendOtp = async () => {
        if (!pendingUserId || resendCount >= 3 || resendCooldown > 0) return;

        setIsLoading(true);
        try {
            await authApi.resendLoginOtp(pendingUserId);
            setResendCount(prev => prev + 1);
            toast.success('New OTP sent to your email');

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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background - Matching Homepage Hero */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large Gradient Orbs */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#5750F1]/40 to-purple-600/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/20 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/10 blur-2xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

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

            {/* Back to Home */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition-all duration-300 group"
            >
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-all duration-300">
                    <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="hidden sm:inline">Back to Home</span>
            </Link>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-[1100px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                        {/* Left Side - Branding & Features */}
                        <div className="hidden lg:flex flex-col justify-center">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-3 mb-10 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#5750F1] rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                                    <div className="relative h-14 w-14 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#5750F1]/30">
                                        <Image
                                            src="/logo-white.svg"
                                            alt="ISKCON Logo"
                                            width={36}
                                            height={36}
                                            className="h-9 w-9"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="font-bold text-2xl text-white">ISKCON Burla</h2>
                                    <p className="text-white/50 text-sm">Digital Temple Portal</p>
                                </div>
                            </Link>

                            {/* Headline */}
                            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                                Welcome back to your
                                <span className="block bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
                                    spiritual journey
                                </span>
                            </h1>

                            <p className="text-white/60 text-lg mb-10 leading-relaxed">
                                Access exclusive temple services, order prasadam, watch live darshan, and connect with our devotee community.
                            </p>

                            {/* Features */}
                            <div className="space-y-4">
                                {[
                                    { icon: Sparkles, text: 'Order sacred prasadam online' },
                                    { icon: Shield, text: 'Secure & encrypted authentication' },
                                    { icon: CheckCircle2, text: 'Access exclusive devotee services' },
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                            <feature.icon className="h-5 w-5 text-[#5750F1]" />
                                        </div>
                                        <span className="text-white/70 group-hover:text-white transition-colors">{feature.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="mt-12 pt-8 border-t border-white/10 flex gap-12">
                                <div>
                                    <div className="text-3xl font-bold text-white">1000+</div>
                                    <div className="text-sm text-white/50">Active members</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">15+</div>
                                    <div className="text-sm text-white/50">Years of service</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className="w-full max-w-md mx-auto lg:max-w-none lg:pl-8">
                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-8">
                                <Link href="/" className="inline-flex items-center gap-3">
                                    <div className="h-12 w-12 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg">
                                        <Image
                                            src="/logo-white.svg"
                                            alt="ISKCON Logo"
                                            width={28}
                                            height={28}
                                            className="h-7 w-7"
                                        />
                                    </div>
                                    <span className="font-bold text-xl text-white">ISKCON Burla</span>
                                </Link>
                            </div>

                            {/* Form Card - White Background */}
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#5750F1]/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-xl opacity-60" />

                                <div className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl">
                                    {/* Form Header */}
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                            {requiresEmailOtp ? 'Email Verification' : requiresTwoFactor ? 'Two-Factor Auth' : 'Sign In'}
                                        </h2>
                                        <p className="text-gray-500">
                                            {requiresEmailOtp
                                                ? 'Enter the 6-digit code sent to your email'
                                                : requiresTwoFactor
                                                    ? 'Enter your authenticator code'
                                                    : 'Continue to your account'}
                                        </p>
                                    </div>

                                    {/* Login Form, 2FA Form, or Email OTP Form */}
                                    {requiresEmailOtp ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-center mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                                    <Mail className="h-8 w-8 text-white" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="emailOtpCode" className="text-sm font-medium text-gray-700">
                                                    Verification Code
                                                </Label>
                                                <Input
                                                    id="emailOtpCode"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="000000"
                                                    value={emailOtpCode}
                                                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                                    maxLength={6}
                                                    autoFocus
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleEmailOtpSubmit}
                                                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300"
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
                                            <div className="text-center">
                                                {resendCount < 3 ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
                                                className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                                        <div className="space-y-6">
                                            <div className="flex justify-center mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center shadow-lg shadow-[#5750F1]/25">
                                                    <Shield className="h-8 w-8 text-white" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="twoFactorCode" className="text-sm font-medium text-gray-700">
                                                    Authenticator Code
                                                </Label>
                                                <Input
                                                    id="twoFactorCode"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="000000"
                                                    value={twoFactorCode}
                                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20"
                                                    maxLength={6}
                                                    autoFocus
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleTwoFactorSubmit}
                                                className="w-full h-12 bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-[#5750F1]/25 transition-all duration-300"
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
                                                className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="you@example.com"
                                                        {...register('email', {
                                                            required: 'Email is required',
                                                            pattern: {
                                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                message: 'Invalid email address',
                                                            },
                                                        })}
                                                        className={`pl-12 h-12 bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl ${errors.email ? 'border-red-400' : ''}`}
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                                                    <Link href="#" className="text-sm text-[#5750F1] hover:text-[#4a43d6] font-medium transition-colors">
                                                        Forgot password?
                                                    </Link>
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        {...register('password', {
                                                            required: 'Password is required',
                                                        })}
                                                        className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl ${errors.password ? 'border-red-400' : ''}`}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-200/50"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                                                    </Button>
                                                </div>
                                                {errors.password && (
                                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                                )}
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-12 bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-[#5750F1]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#5750F1]/30 hover:-translate-y-0.5"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    'Sign In'
                                                )}
                                            </Button>
                                        </form>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                        <p className="text-gray-500">
                                            Don&apos;t have an account?{' '}
                                            <Link href="/register" className="text-[#5750F1] hover:text-[#4a43d6] font-semibold transition-colors">
                                                Create account
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
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
            <div className="min-h-screen flex items-center justify-center bg-[#0f0c29]">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
