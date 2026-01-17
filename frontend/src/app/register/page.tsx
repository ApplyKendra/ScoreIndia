'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, ArrowLeft, Heart, Calendar, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';

interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuthStore();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>();

    const password = watch('password');

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.register({
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.password,
            });
            // Tokens are now set in HttpOnly cookies by the backend
            login(response.user);
            toast.success('Registration successful! Welcome to ISKCON.');
            router.push('/');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-purple-950 flex items-center justify-center p-4">
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
                    <div className="flex flex-wrap items-stretch min-h-[700px]">
                        {/* Left Side - Gradient Panel */}
                        <div className="hidden xl:block xl:w-1/2 bg-gradient-to-br from-purple-700 via-[#5750F1] to-indigo-700 relative">
                            <div className="p-10 h-full flex flex-col justify-center text-white relative z-10">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
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
                                            <p className="text-purple-100 text-sm">Join Our Community</p>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-3xl font-bold mb-4">
                                    Begin your spiritual journey
                                </h2>

                                <p className="text-purple-100 text-lg mb-8">
                                    Create an account to access exclusive services, order prasadam, and connect with devotees worldwide.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <UtensilsCrossed className="h-4 w-4" />
                                        </div>
                                        <span className="text-purple-100">Order Prasadam Daily</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <span className="text-purple-100">Shop Devotional Items</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <span className="text-purple-100">Register for Events</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Heart className="h-4 w-4" />
                                        </div>
                                        <span className="text-purple-100">Support the Temple</span>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <div className="text-sm text-purple-100/90 mb-2">Join our family of</div>
                                    <div className="text-2xl font-bold">10,000+ Devotees</div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 -translate-x-32 blur-xl"></div>
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 translate-x-24 blur-xl"></div>
                        </div>

                        {/* Right Side - Register Form */}
                        <div className="w-full xl:w-1/2">
                            <div className="w-full p-6 sm:p-8 lg:p-12 xl:p-14">
                                <div className="mb-6">
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
                                        <Link href="/login" className="text-sm font-medium text-[#5750F1] hover:underline">
                                            Sign in
                                        </Link>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        Create account
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Join our spiritual community today
                                    </p>
                                </div>

                                {/* Register Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="Your full name"
                                                {...register('name', {
                                                    required: 'Name is required',
                                                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                                                })}
                                                className={`pl-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.name ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                {...register('email', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Invalid email address',
                                                    },
                                                })}
                                                className={`pl-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.email ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium">Phone (optional)</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                {...register('phone')}
                                                className="pl-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                {...register('password', {
                                                    required: 'Password is required',
                                                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                        message: 'Include uppercase, lowercase, and number',
                                                    },
                                                })}
                                                className={`pl-10 pr-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.password ? 'border-red-500' : ''}`}
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
                                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                {...register('confirmPassword', {
                                                    required: 'Please confirm your password',
                                                    validate: (value) => value === password || 'Passwords do not match',
                                                })}
                                                className={`pl-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:border-[#5750F1] focus:ring-[#5750F1] ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-[#5750F1] hover:bg-[#4a43d6] text-white font-medium shadow-lg shadow-[#5750F1]/25 mt-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </Button>
                                </form>

                                <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="font-medium text-[#5750F1] hover:underline">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
