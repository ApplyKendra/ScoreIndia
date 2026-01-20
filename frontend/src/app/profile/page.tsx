'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Loader2, User, Mail, Phone, Save, Lock, Shield,
    Eye, EyeOff, ShoppingBag, Heart, Settings, ArrowRight,
    CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import api from '@/lib/api/client';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Set form data when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#5750F1] mx-auto mb-4" />
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        router.push('/login');
        return null;
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setSaving(true);
        try {
            // Update user profile via API
            const response = await api.patch('/auth/profile', {
                name: formData.name,
                phone: formData.phone || undefined,
            });
            setUser({ ...user, name: formData.name, phone: formData.phone });
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword) {
            toast.error('Current password is required');
            return;
        }
        if (!passwordData.newPassword) {
            toast.error('New password is required');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            await api.post('/auth/update-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordSection(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const quickLinks = [
        { href: '/orders', label: 'My Orders', icon: ShoppingBag, color: 'emerald' },
        { href: '/my-donations', label: 'My Donations', icon: Heart, color: 'rose' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#5750F1] via-purple-600 to-indigo-700">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }} />
                </div>

                {/* Animated Orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-white/50 to-pink-400 rounded-full blur opacity-60" />
                            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl">
                                {getInitials(user.name)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full border-4 border-[#5750F1] flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.name}</h1>
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                    {user.role.replace('_', ' ')}
                                </Badge>
                            </div>
                            <p className="text-white/80 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                            {user.phone && (
                                <p className="text-white/80 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <Phone className="h-4 w-4" />
                                    {user.phone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid gap-6 lg:gap-8">

                    {/* Profile Information Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#5750F1]/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-[#5750F1]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your account details</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Display Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your name"
                                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        value={user.email}
                                        disabled
                                        className="h-12 pl-12 bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-600 rounded-xl cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Email cannot be changed</p>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-12 px-6 bg-[#5750F1] hover:bg-[#4a43d6] text-white rounded-xl shadow-lg shadow-[#5750F1]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#5750F1]/30"
                                >
                                    {saving ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-5 w-5 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Security Card - Password Change */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="rounded-xl"
                                >
                                    {showPasswordSection ? 'Cancel' : 'Change Password'}
                                </Button>
                            </div>
                        </div>

                        {showPasswordSection && (
                            <div className="p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Current Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                            className="h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="Enter new password"
                                                className="h-12 pr-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Confirm New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                                className="h-12 pr-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:border-[#5750F1] focus:ring-[#5750F1]/20 rounded-xl"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        Password must be at least 8 characters long
                                    </p>
                                </div>

                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={changingPassword}
                                    className="h-12 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-600/25 transition-all duration-300"
                                >
                                    {changingPassword ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Lock className="h-5 w-5 mr-2" />
                                    )}
                                    Update Password
                                </Button>
                            </div>
                        )}

                        {!showPasswordSection && (
                            <div className="p-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Keep your account secure by using a strong, unique password.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-cyan-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Access your activities</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 grid sm:grid-cols-2 gap-4">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`group flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-${link.color}-200 dark:hover:border-${link.color}-800 hover:bg-${link.color}-50 dark:hover:bg-${link.color}-900/20 transition-all duration-300`}
                                >
                                    <div className={`h-12 w-12 rounded-xl bg-${link.color}-100 dark:bg-${link.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <link.icon className={`h-6 w-6 text-${link.color}-600`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{link.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">View history</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}

                            {(user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN') && (
                                <Link
                                    href="/admin"
                                    className="sm:col-span-2 group flex items-center gap-4 p-4 rounded-xl border border-[#5750F1]/20 bg-[#5750F1]/5 hover:bg-[#5750F1]/10 transition-all duration-300"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-[#5750F1]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Settings className="h-6 w-6 text-[#5750F1]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#5750F1]">Admin Dashboard</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage temple operations</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-[#5750F1] group-hover:translate-x-1 transition-all" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
