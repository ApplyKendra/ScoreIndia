'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Shield, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

function Setup2FAContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const setupToken = searchParams.get('token'); // Security token from login
    const { login } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'loading' | 'scan' | 'verify'>('loading');

    useEffect(() => {
        if (!userId || !setupToken) {
            toast.error('Invalid setup request. Please login again.');
            router.push('/login');
            return;
        }
        initSetup();
    }, [userId, setupToken]);

    const initSetup = async () => {
        if (!userId || !setupToken) return;

        setIsLoading(true);
        try {
            // Call setup endpoint with setupToken for security
            const response = await authApi.setupTwoFactorForUser(userId, setupToken);
            setQrCode(response.qrCode);
            setSecret(response.secret);
            setStep('scan');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initialize 2FA setup. Please login again.');
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!userId || verificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            // Verify 2FA and complete login
            const response = await authApi.verifyTwoFactorSetup(userId, verificationCode);
            login(response.user);
            toast.success('2FA enabled successfully! Welcome!');

            if (response.user.role === 'SUPER_ADMIN' || response.user.role === 'SUB_ADMIN') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            toast.success('Secret copied to clipboard');
        }
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#5750F1] mx-auto" />
                    <p className="mt-4 text-muted-foreground">Setting up two-factor authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 p-4">
            <Link
                href="/login"
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                Back to Login
            </Link>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-2xl flex items-center justify-center">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Setup Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Admin accounts require 2FA for security. Scan the QR code below with Google Authenticator.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* QR Code */}
                    {qrCode && (
                        <div className="flex justify-center">
                            <div className="p-4 bg-white rounded-lg shadow-inner">
                                <img
                                    src={qrCode}
                                    alt="2FA QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                        </div>
                    )}

                    {/* Manual Secret */}
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

                    {/* Verification Code Input */}
                    <div className="space-y-2">
                        <Label htmlFor="code">Enter verification code</Label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                            maxLength={6}
                        />
                    </div>

                    <Button
                        onClick={handleVerify}
                        disabled={isLoading || verificationCode.length !== 6}
                        className="w-full h-12 bg-[#5750F1] hover:bg-[#4a43d6]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Enable 2FA & Continue'
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Setup2FAPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        }>
            <Setup2FAContent />
        </Suspense>
    );
}
