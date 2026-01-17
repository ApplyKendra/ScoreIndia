'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Shield, ShieldCheck, ShieldX, ToggleLeft, ToggleRight, Trash2, Lock, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usersApi, AdminUser } from '@/lib/api/users';
import authApi from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

const roleColors: Record<string, string> = {
    USER: 'bg-gray-100 text-gray-800',
    SUB_ADMIN: 'bg-blue-100 text-blue-800',
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
};

const roleIcons: Record<string, React.ReactNode> = {
    USER: <Shield className="h-4 w-4" />,
    SUB_ADMIN: <ShieldCheck className="h-4 w-4" />,
    SUPER_ADMIN: <ShieldX className="h-4 w-4" />,
};

interface UserFormData {
    name: string;
    email: string;
    password: string;
    phone: string;
}

type VerificationStep = 'idle' | 'request-otp' | 'enter-otp' | 'enter-2fa' | 'complete';

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Create admin dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        phone: '',
    });

    // Verification states
    const [verificationStep, setVerificationStep] = useState<VerificationStep>('idle');
    const [otpCode, setOtpCode] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [sessionToken, setSessionToken] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [saving, setSaving] = useState(false);

    // Action confirmation dialog
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        type: 'delete' | 'toggle';
        user: AdminUser;
    } | null>(null);

    // Countdown timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (verificationStep !== 'idle') {
                            toast.warning('Session expired. Please start again.');
                            resetVerification();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timeRemaining, verificationStep]);

    const resetVerification = () => {
        setVerificationStep('idle');
        setOtpCode('');
        setTwoFactorCode('');
        setSessionToken('');
        setTimeRemaining(0);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ============================================
    // CREATE SUB-ADMIN FLOW (2FA + Email OTP)
    // ============================================

    const openCreateDialog = () => {
        setFormData({ name: '', email: '', password: '', phone: '' });
        resetVerification();
        setCreateDialogOpen(true);
    };

    const handleRequestOtpForCreate = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill all required fields first');
            return;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        try {
            await authApi.sendPasswordChangeOtp();
            setVerificationStep('enter-otp');
            toast.success('OTP sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyOtpForCreate = async () => {
        if (otpCode.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setSaving(true);
        try {
            const response = await authApi.verifyPasswordChangeOtp(otpCode);
            setSessionToken(response.token);
            const expiresAt = new Date(response.expiresAt);
            const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            setTimeRemaining(remaining > 0 ? remaining : 180);
            setVerificationStep('enter-2fa');
            toast.success('OTP verified! Now enter your 2FA code.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateWithVerification = async () => {
        if (twoFactorCode.length !== 6) {
            toast.error('Please enter a valid 6-digit 2FA code');
            return;
        }

        setSaving(true);
        try {
            await usersApi.createAdminSecure(
                { name: formData.name, email: formData.email, password: formData.password, phone: formData.phone || undefined },
                twoFactorCode,
                sessionToken
            );
            toast.success('Sub-admin created successfully');
            setCreateDialogOpen(false);
            resetVerification();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create sub-admin');
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // DELETE/TOGGLE USER FLOW
    // ============================================

    const openConfirmDialog = (type: 'delete' | 'toggle', user: AdminUser) => {
        if (user.id === currentUser?.id) {
            toast.error(`You cannot ${type === 'delete' ? 'delete' : 'deactivate'} yourself`);
            return;
        }
        setPendingAction({ type, user });
        resetVerification();
        setConfirmDialogOpen(true);
    };

    const handleRequestOtpForAction = async () => {
        setSaving(true);
        try {
            await authApi.sendPasswordChangeOtp();
            setVerificationStep('enter-otp');
            toast.success('OTP sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyOtpForAction = async () => {
        if (otpCode.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setSaving(true);
        try {
            const response = await authApi.verifyPasswordChangeOtp(otpCode);
            setSessionToken(response.token);
            const expiresAt = new Date(response.expiresAt);
            const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            setTimeRemaining(remaining > 0 ? remaining : 180);
            setVerificationStep('enter-2fa');
            toast.success('OTP verified! Now enter your 2FA code.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setSaving(false);
        }
    };

    const handleActionWithVerification = async () => {
        if (!pendingAction) return;
        if (twoFactorCode.length !== 6) {
            toast.error('Please enter a valid 6-digit 2FA code');
            return;
        }

        setSaving(true);
        try {
            if (pendingAction.type === 'delete') {
                await usersApi.deleteSecure(
                    pendingAction.user.id,
                    twoFactorCode,
                    pendingAction.user.role === 'SUB_ADMIN' ? sessionToken : undefined
                );
                toast.success('User deleted successfully');
            } else {
                await usersApi.toggleActiveSecure(
                    pendingAction.user.id,
                    twoFactorCode,
                    pendingAction.user.role === 'SUB_ADMIN' ? sessionToken : undefined
                );
                toast.success(`User ${pendingAction.user.isActive ? 'deactivated' : 'activated'}`);
            }
            setConfirmDialogOpen(false);
            setPendingAction(null);
            resetVerification();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const requiresOtp = (user: AdminUser) => user.role === 'SUB_ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage system users and administrators</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Admin
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                            {user.id === currentUser?.id && (
                                                <Badge variant="outline" className="ml-2">You</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge className={roleColors[user.role]}>
                                                <span className="flex items-center gap-1">
                                                    {roleIcons[user.role]}
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openConfirmDialog('toggle', user)}
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                    disabled={user.id === currentUser?.id || user.role === 'SUPER_ADMIN'}
                                                >
                                                    {user.isActive ? (
                                                        <ToggleRight className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500"
                                                    onClick={() => openConfirmDialog('delete', user)}
                                                    disabled={user.id === currentUser?.id || user.role === 'SUPER_ADMIN'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create Sub-Admin Dialog with Verification */}
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
                if (!open) resetVerification();
                setCreateDialogOpen(open);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-500" />
                            Create Sub-Admin
                        </DialogTitle>
                        <DialogDescription>
                            Requires email OTP and 2FA verification for security.
                        </DialogDescription>
                    </DialogHeader>

                    {verificationStep === 'idle' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@example.org"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min 8 characters"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="9999999999"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleRequestOtpForCreate} disabled={saving} className="bg-purple-600">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send OTP to Verify
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {verificationStep === 'enter-otp' && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-purple-600" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Enter the 6-digit OTP sent to your email
                                </p>
                            </div>
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="text-center text-2xl tracking-widest font-mono"
                                maxLength={6}
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setVerificationStep('idle')}>
                                    Back
                                </Button>
                                <Button onClick={handleVerifyOtpForCreate} disabled={saving || otpCode.length !== 6}>
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Verify OTP
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {verificationStep === 'enter-2fa' && (
                        <div className="space-y-4">
                            {timeRemaining > 0 && (
                                <div className={`text-center p-3 rounded-lg ${timeRemaining <= 60 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className={`h-4 w-4 ${timeRemaining <= 60 ? 'text-red-500' : 'text-green-500'}`} />
                                        <span className={`font-mono font-bold text-lg ${timeRemaining <= 60 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatTime(timeRemaining)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-blue-600" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Enter your authenticator 2FA code
                                </p>
                            </div>
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="text-center text-2xl tracking-widest font-mono"
                                maxLength={6}
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setVerificationStep('enter-otp')}>
                                    Back
                                </Button>
                                <Button onClick={handleCreateWithVerification} disabled={saving || twoFactorCode.length !== 6} className="bg-green-600">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Create Sub-Admin
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Action Dialog (Delete/Toggle) with Verification */}
            <Dialog open={confirmDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    resetVerification();
                    setPendingAction(null);
                }
                setConfirmDialogOpen(open);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {pendingAction?.type === 'delete' ? (
                                <Trash2 className="h-5 w-5 text-red-500" />
                            ) : (
                                <ToggleRight className="h-5 w-5 text-orange-500" />
                            )}
                            {pendingAction?.type === 'delete' ? 'Delete User' : 'Toggle User Status'}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingAction?.user.role === 'SUB_ADMIN'
                                ? 'This action requires 2FA and email OTP verification.'
                                : 'This action requires 2FA verification.'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {pendingAction && (
                        <>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="font-medium">{pendingAction.user.name}</p>
                                <p className="text-sm text-muted-foreground">{pendingAction.user.email}</p>
                                <Badge className={`mt-2 ${roleColors[pendingAction.user.role]}`}>
                                    {pendingAction.user.role.replace('_', ' ')}
                                </Badge>
                            </div>

                            {/* SUB_ADMIN: Need OTP first */}
                            {requiresOtp(pendingAction.user) && verificationStep === 'idle' && (
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleRequestOtpForAction} disabled={saving} className="bg-purple-600">
                                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send OTP First
                                    </Button>
                                </DialogFooter>
                            )}

                            {/* USER: Skip OTP, go straight to 2FA */}
                            {!requiresOtp(pendingAction.user) && verificationStep === 'idle' && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Lock className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Enter your authenticator 2FA code
                                        </p>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleActionWithVerification}
                                            disabled={saving || twoFactorCode.length !== 6}
                                            className={pendingAction.type === 'delete' ? 'bg-red-600' : 'bg-orange-600'}
                                        >
                                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            {pendingAction.type === 'delete' ? 'Delete User' : 'Toggle Status'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {verificationStep === 'enter-otp' && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                            <Mail className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Enter the 6-digit OTP sent to your email
                                        </p>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setVerificationStep('idle')}>
                                            Back
                                        </Button>
                                        <Button onClick={handleVerifyOtpForAction} disabled={saving || otpCode.length !== 6}>
                                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            Verify OTP
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {verificationStep === 'enter-2fa' && (
                                <div className="space-y-4">
                                    {timeRemaining > 0 && (
                                        <div className={`text-center p-3 rounded-lg ${timeRemaining <= 60 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <AlertTriangle className={`h-4 w-4 ${timeRemaining <= 60 ? 'text-red-500' : 'text-green-500'}`} />
                                                <span className={`font-mono font-bold text-lg ${timeRemaining <= 60 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatTime(timeRemaining)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Lock className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Enter your authenticator 2FA code
                                        </p>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setVerificationStep('enter-otp')}>
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleActionWithVerification}
                                            disabled={saving || twoFactorCode.length !== 6}
                                            className={pendingAction.type === 'delete' ? 'bg-red-600' : 'bg-orange-600'}
                                        >
                                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            {pendingAction.type === 'delete' ? 'Delete User' : 'Toggle Status'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
