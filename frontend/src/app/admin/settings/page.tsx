'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Image from 'next/image';
import {
    Loader2,
    Shield,
    Key,
    Mail,
    User,
    Check,
    X,
    QrCode,
    Copy,
    Eye,
    EyeOff,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';

interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function AdminSettingsPage() {
    const { user, checkAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<PasswordFormData>();

    const newPassword = watch('newPassword');

    // Password change handler
    const onPasswordChange = async (data: PasswordFormData) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.changePassword(data.currentPassword, data.newPassword);
            toast.success('Password changed successfully');
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    // 2FA Setup
    const handleSetup2FA = async () => {
        setIsLoading(true);
        try {
            const response = await authApi.setupTwoFactor();
            setQrCode(response.qrCode);
            setSecret(response.secret);
            setIs2FASetupOpen(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to setup 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    // Verify and enable 2FA
    const handleVerify2FA = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.verifyTwoFactor(verificationCode);
            if (response.recoveryCodes) {
                setRecoveryCodes(response.recoveryCodes);
            }
            toast.success('Two-factor authentication enabled!');
            setIs2FASetupOpen(false);
            setVerificationCode('');
            checkAuth(); // Refresh user data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Copy secret to clipboard
    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            toast.success('Secret copied to clipboard');
        }
    };

    if (!user) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account security and preferences
                </p>
            </div>

            {/* Recovery Codes Modal */}
            {recoveryCodes.length > 0 && (
                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                            Save Your Recovery Codes
                        </CardTitle>
                        <CardDescription>
                            These codes can be used to access your account if you lose your authenticator.
                            Store them securely!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg font-mono text-sm">
                            {recoveryCodes.map((code, i) => (
                                <div key={i} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                    {code}
                                </div>
                            ))}
                        </div>
                        <Button
                            className="mt-4"
                            onClick={() => {
                                navigator.clipboard.writeText(recoveryCodes.join('\n'));
                                toast.success('Recovery codes copied!');
                            }}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy All Codes
                        </Button>
                        <Button
                            variant="outline"
                            className="mt-4 ml-2"
                            onClick={() => setRecoveryCodes([])}
                        >
                            I've Saved Them
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-[#5750F1]" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground">Name</Label>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Role</Label>
                            <Badge variant="secondary" className="mt-1">
                                {user.role.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Verification Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[#5750F1]" />
                            Email Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            {user.isEmailVerified ? (
                                <>
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-600">Email Verified</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your email address has been verified
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <X className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-amber-600">Not Verified</p>
                                        <p className="text-sm text-muted-foreground">
                                            Please verify your email address
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        {!user.isEmailVerified && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={async () => {
                                    try {
                                        await authApi.resendVerification(user.email);
                                        toast.success('Verification email sent!');
                                    } catch (error) {
                                        toast.error('Failed to send verification email');
                                    }
                                }}
                            >
                                Resend Verification Email
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Two-Factor Authentication Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[#5750F1]" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>
                            Add an extra layer of security to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {user.twoFactorEnabled ? (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-green-600">2FA Enabled</p>
                                    <p className="text-sm text-muted-foreground">
                                        Your account is protected with 2FA
                                    </p>
                                </div>
                            </div>
                        ) : is2FASetupOpen ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Scan this QR code with Google Authenticator
                                    </p>
                                    {qrCode && (
                                        <div className="inline-block p-4 bg-white rounded-lg">
                                            <img
                                                src={qrCode}
                                                alt="2FA QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                    )}
                                </div>
                                {secret && (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <Label className="text-xs text-muted-foreground">
                                            Or enter this code manually:
                                        </Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 font-mono text-sm break-all">
                                                {secret}
                                            </code>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={copySecret}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label>Verification Code</Label>
                                    <Input
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="mt-2 text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleVerify2FA}
                                        disabled={isLoading || verificationCode.length !== 6}
                                        className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6]"
                                    >
                                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Enable 2FA
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIs2FASetupOpen(false);
                                            setQrCode(null);
                                            setSecret(null);
                                            setVerificationCode('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-amber-600">2FA Not Enabled</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.role !== 'USER' ? 'Required for admin accounts' : 'Recommended for better security'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSetup2FA}
                                    disabled={isLoading}
                                    className="bg-[#5750F1] hover:bg-[#4a43d6]"
                                >
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <QrCode className="h-4 w-4 mr-2" />
                                    Setup 2FA
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Password Change Card - OTP Based */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-[#5750F1]" />
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Request an OTP code to change your password securely
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PasswordChangeWithOtp />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Separate component for secure OTP-based password change
function PasswordChangeWithOtp() {
    const [step, setStep] = useState<'request' | 'verify' | 'change'>('request');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [token, setToken] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Start countdown timer when entering change step
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'change' && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Session expired, go back to request
                        toast.warning('Session expired. Please verify OTP again.');
                        resetState();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timeRemaining]);

    const resetState = () => {
        setStep('request');
        setOtp('');
        setToken('');
        setTimeRemaining(0);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleRequestOtp = async () => {
        setIsLoading(true);
        try {
            await authApi.sendPasswordChangeOtp();
            toast.success('OTP sent to your email');
            setStep('verify');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.verifyPasswordChangeOtp(otp);
            setToken(response.token);
            // Calculate remaining seconds from expiresAt
            const expiresAt = new Date(response.expiresAt);
            const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            setTimeRemaining(remaining > 0 ? remaining : 180);
            setStep('change');
            toast.success('OTP verified! You have 3 minutes to change your password.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (!currentPassword) {
            toast.error('Please enter your current password');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.changePasswordWithToken(token, currentPassword, newPassword);
            toast.success('Password changed successfully');
            resetState();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Step 1: Request OTP
    if (step === 'request') {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    To change your password, we'll first send a verification code to your email.
                </p>
                <Button
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="w-full bg-[#5750F1] hover:bg-[#4a43d6]"
                >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Mail className="h-4 w-4 mr-2" />
                    Send OTP to Email
                </Button>
            </div>
        );
    }

    // Step 2: Verify OTP
    if (step === 'verify') {
        return (
            <div className="space-y-4">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-xl flex items-center justify-center">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to your email
                    </p>
                </div>
                <div>
                    <Label htmlFor="passwordOtp">Verification Code</Label>
                    <Input
                        id="passwordOtp"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="mt-2 text-center text-2xl tracking-widest font-mono"
                        maxLength={6}
                        autoFocus
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.length !== 6}
                        className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6]"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Verify OTP
                    </Button>
                    <Button
                        variant="outline"
                        onClick={resetState}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    // Step 3: Change Password (3-min window)
    return (
        <div className="space-y-4">
            {/* Timer indicator */}
            <div className={`text-center p-3 rounded-lg ${timeRemaining <= 60 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${timeRemaining <= 60 ? 'text-red-500' : 'text-green-500'}`} />
                    <span className={`font-mono font-bold text-lg ${timeRemaining <= 60 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Time remaining to change password
                </p>
            </div>

            <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative mt-2">
                    <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
            <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-2">
                    <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min 8 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
            <div>
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="mt-2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleChangePassword}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6]"
                >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Change Password
                </Button>
                <Button
                    variant="outline"
                    onClick={resetState}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
