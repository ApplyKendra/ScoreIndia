'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, ArrowLeft, Sparkles, Heart, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';

// Country codes data
const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳', maxDigits: 10 },
    { code: '+1', country: 'USA', flag: '🇺🇸', maxDigits: 10 },
    { code: '+44', country: 'UK', flag: '🇬🇧', maxDigits: 10 },
    { code: '+61', country: 'Australia', flag: '🇦🇺', maxDigits: 9 },
    { code: '+971', country: 'UAE', flag: '🇦🇪', maxDigits: 9 },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', maxDigits: 8 },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾', maxDigits: 10 },
    { code: '+49', country: 'Germany', flag: '🇩🇪', maxDigits: 11 },
    { code: '+33', country: 'France', flag: '🇫🇷', maxDigits: 9 },
    { code: '+81', country: 'Japan', flag: '🇯🇵', maxDigits: 10 },
    { code: '+86', country: 'China', flag: '🇨🇳', maxDigits: 11 },
    { code: '+82', country: 'South Korea', flag: '🇰🇷', maxDigits: 10 },
    { code: '+7', country: 'Russia', flag: '🇷🇺', maxDigits: 10 },
    { code: '+55', country: 'Brazil', flag: '🇧🇷', maxDigits: 11 },
    { code: '+27', country: 'South Africa', flag: '🇿🇦', maxDigits: 9 },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬', maxDigits: 10 },
    { code: '+254', country: 'Kenya', flag: '🇰🇪', maxDigits: 9 },
    { code: '+977', country: 'Nepal', flag: '🇳🇵', maxDigits: 10 },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', maxDigits: 10 },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', maxDigits: 9 },
];

interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // India default
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const router = useRouter();
    const { login } = useAuthStore();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setValue,
    } = useForm<RegisterFormData>();

    const password = watch('password');

    // Handle phone number input with validation
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Only digits
        const maxDigits = selectedCountry.maxDigits;
        const trimmedValue = value.slice(0, maxDigits);
        setPhoneNumber(trimmedValue);
        setValue('phone', trimmedValue ? `${selectedCountry.code}${trimmedValue}` : '');
    };

    // Update phone when country changes
    useEffect(() => {
        if (phoneNumber) {
            const maxDigits = selectedCountry.maxDigits;
            const trimmedValue = phoneNumber.slice(0, maxDigits);
            setPhoneNumber(trimmedValue);
            setValue('phone', `${selectedCountry.code}${trimmedValue}`);
        }
    }, [selectedCountry, phoneNumber, setValue]);

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.register({
                name: data.name,
                email: data.email,
                phone: data.phone || undefined,
                password: data.password,
            });
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background - Matching Homepage Hero */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large Gradient Orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/30 to-pink-600/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#5750F1]/40 to-indigo-600/20 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

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
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 py-16">
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
                                Begin your
                                <span className="block bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
                                    spiritual journey
                                </span>
                            </h1>

                            <p className="text-white/60 text-lg mb-10 leading-relaxed">
                                Join our community of devotees. Create an account to access exclusive services, order prasadam, and connect worldwide.
                            </p>

                            {/* Features */}
                            <div className="space-y-4">
                                {[
                                    { icon: Sparkles, text: 'Access exclusive temple services' },
                                    { icon: Heart, text: 'Support temple activities & donations' },
                                    { icon: CheckCircle2, text: 'Order prasadam & devotional items' },
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
                                    <div className="text-sm text-white/50">Active devotees</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">100+</div>
                                    <div className="text-sm text-white/50">Nitya Sevaks</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Register Form */}
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
                                            Create Account
                                        </h2>
                                        <p className="text-gray-500">
                                            Join our spiritual community today
                                        </p>
                                    </div>

                                    {/* Register Form */}
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    placeholder="Your full name"
                                                    {...register('name', {
                                                        required: 'Name is required',
                                                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                                                    })}
                                                    className={`pl-12 h-12 bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl ${errors.name ? 'border-red-400' : ''}`}
                                                />
                                            </div>
                                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                                        </div>

                                        {/* Email */}
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
                                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                                        </div>

                                        {/* Phone with Country Code */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                                Phone Number <span className="text-gray-400">(optional)</span>
                                            </Label>
                                            <div className="flex gap-2">
                                                {/* Country Code Selector */}
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                        className="h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-gray-700 hover:bg-gray-100 transition-colors min-w-[100px]"
                                                    >
                                                        <span className="text-lg">{selectedCountry.flag}</span>
                                                        <span className="text-sm font-medium">{selectedCountry.code}</span>
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </button>

                                                    {/* Dropdown */}
                                                    {showCountryDropdown && (
                                                        <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
                                                            {COUNTRY_CODES.map((country) => (
                                                                <button
                                                                    key={country.code}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedCountry(country);
                                                                        setShowCountryDropdown(false);
                                                                    }}
                                                                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selectedCountry.code === country.code ? 'bg-[#5750F1]/5' : ''}`}
                                                                >
                                                                    <span className="text-lg">{country.flag}</span>
                                                                    <span className="text-gray-700 text-sm flex-1">{country.country}</span>
                                                                    <span className="text-gray-400 text-sm">{country.code}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Phone Input */}
                                                <div className="relative flex-1">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <Input
                                                        id="phone"
                                                        type="tel"
                                                        placeholder={`${selectedCountry.maxDigits} digits`}
                                                        value={phoneNumber}
                                                        onChange={handlePhoneChange}
                                                        className="pl-12 h-12 bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                                        maxLength={selectedCountry.maxDigits}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {selectedCountry.country}: {phoneNumber.length}/{selectedCountry.maxDigits} digits
                                            </p>
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...register('confirmPassword', {
                                                        required: 'Please confirm your password',
                                                        validate: (value) => value === password || 'Passwords do not match',
                                                    })}
                                                    className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl ${errors.confirmPassword ? 'border-red-400' : ''}`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-200/50"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                                                </Button>
                                            </div>
                                            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-[#5750F1]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#5750F1]/30 hover:-translate-y-0.5 mt-2"
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

                                    {/* Footer */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                        <p className="text-gray-500">
                                            Already have an account?{' '}
                                            <Link href="/login" className="text-[#5750F1] hover:text-[#4a43d6] font-semibold transition-colors">
                                                Sign in
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showCountryDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCountryDropdown(false)}
                />
            )}
        </div>
    );
}
