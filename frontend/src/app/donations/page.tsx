'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Heart,
    Building2,
    UtensilsCrossed,
    BookOpen,
    Users,
    Sparkles,
    Star,
    Check,
    Smartphone,
    Building,
    ArrowRight,
    Copy,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    FileImage
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/lib/stores/auth-store';

// Payment details
const UPI_ID = 'iskconburla@sbi';
const BANK_DETAILS = {
    accountName: 'ISKCON Burla',
    accountNumber: '33998240294',
    ifscCode: 'SBIN0007749',
    bankName: 'State Bank of India (SBI)'
};

// Donation categories
const DONATION_CATEGORIES = [
    {
        id: 'general',
        title: 'General Donation',
        description: 'Support daily temple operations and worship',
        icon: Heart,
        color: 'from-rose-500 to-pink-500'
    },
    {
        id: 'temple',
        title: 'Temple Construction',
        description: 'Contribute to building a magnificent temple',
        icon: Building2,
        color: 'from-[#5750F1] to-purple-600'
    },
    {
        id: 'prasadam',
        title: 'Prasadam Distribution',
        description: 'Feed devotees with sanctified food',
        icon: UtensilsCrossed,
        color: 'from-amber-500 to-orange-500'
    },
    {
        id: 'education',
        title: 'Spiritual Education',
        description: 'Support Bhagavad Gita classes and programs',
        icon: BookOpen,
        color: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'community',
        title: 'Community Outreach',
        description: 'Help spread Krishna consciousness',
        icon: Users,
        color: 'from-cyan-500 to-blue-500'
    },
    {
        id: 'festivals',
        title: 'Festival Sponsorship',
        description: 'Sponsor grand festival celebrations',
        icon: Sparkles,
        color: 'from-yellow-500 to-amber-500'
    }
];

// Preset donation amounts
const PRESET_AMOUNTS = [501, 1001, 2501, 5001, 11001, 21001];

type PaymentStep = 'form' | 'payment' | 'upload' | 'success';

export default function DonationsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        pan: '',
        address: '',
        city: '',
        pincode: ''
    });
    const [step, setStep] = useState<PaymentStep>('form');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [donationId, setDonationId] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadToken, setUploadToken] = useState<string | null>(null); // Security token for guest uploads

    // Get user from auth store for auto-fill
    const { user, isAuthenticated } = useAuthStore();

    // Auto-fill form with user data
    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
            }));
        }
    }, [isAuthenticated, user]);

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (value: string) => {
        const numValue = value.replace(/[^0-9]/g, '');
        setCustomAmount(numValue);
        setSelectedAmount(null);
    };

    const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

    // Timer countdown
    useEffect(() => {
        if (step === 'payment' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleProceedToPayment = async () => {
        // Validate form
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (!selectedCategory) {
            toast.error('Please select a donation purpose');
            return;
        }
        if (finalAmount < 100) {
            toast.error('Minimum donation amount is ₹100');
            return;
        }

        setSubmitting(true);
        try {
            // Create donation record
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/donations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    pan: formData.pan || undefined,
                    address: formData.address || undefined,
                    city: formData.city || undefined,
                    pincode: formData.pincode || undefined,
                    category: selectedCategory,
                    amount: finalAmount,
                    paymentMethod: paymentMethod,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setDonationId(data.donationId);
                if (data.uploadToken) {
                    setUploadToken(data.uploadToken); // Store for guest uploads
                }
                setTimeLeft(600); // Reset timer to 10 minutes
                setStep('payment');
            } else {
                toast.error('Failed to create donation. Please try again.');
            }
        } catch (error) {
            console.error('Error creating donation:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                toast.error('File too large. Please select an image smaller than 5MB');
                e.target.value = ''; // Reset input
                return;
            }
            setUploadedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setUploadPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUploadProof = async () => {
        if (!uploadedFile || !donationId) {
            toast.error('Please upload a payment screenshot');
            return;
        }

        setSubmitting(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const formDataUpload = new FormData();
            formDataUpload.append('file', uploadedFile);
            if (transactionId) {
                formDataUpload.append('transactionId', transactionId);
            }
            // Include uploadToken for guest uploads (security)
            if (uploadToken) {
                formDataUpload.append('uploadToken', uploadToken);
            }

            const response = await fetch(`${API_URL}/donations/${donationId}/upload-proof`, {
                method: 'POST',
                credentials: 'include',
                body: formDataUpload,
            });

            if (response.ok) {
                setStep('success');
                toast.success('Payment proof uploaded successfully!');
            } else {
                toast.error('Failed to upload payment proof. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading proof:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Generate UPI QR code URL (using Google Charts API - more reliable)
    const upiString = `upi://pay?pa=${UPI_ID}&pn=ISKCON%20Burla&am=${finalAmount}&cu=INR`;
    const upiQrUrl = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(upiString)}`;

    // Payment Instructions Modal
    if (step === 'payment') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
                <div className="max-w-xl mx-auto">
                    {/* Timer */}
                    <div className={`flex items-center justify-center gap-2 mb-6 p-4 rounded-xl ${timeLeft < 120 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                        <Clock className="w-5 h-5" />
                        <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
                        <span className="text-sm">remaining to complete payment</span>
                    </div>

                    {/* Payment Card */}
                    <Card className="p-6 sm:p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Payment</h2>
                            <p className="text-gray-500 mt-1">Donation ID: <span className="font-mono font-bold text-[#5750F1]">{donationId}</span></p>
                            <p className="text-3xl font-bold text-[#5750F1] mt-4">₹{finalAmount.toLocaleString()}</p>
                        </div>

                        {paymentMethod === 'UPI' ? (
                            <div className="space-y-6">
                                {/* QR Code */}
                                <div className="flex flex-col items-center">
                                    <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-100">
                                        <QRCodeSVG
                                            value={upiString}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-3">Scan QR code with any UPI app</p>
                                </div>

                                {/* Pay Now Button - NPCI Compliant Deep Link */}
                                <a
                                    href={upiString}
                                    className="block w-full"
                                >
                                    <Button
                                        className="w-full py-6 text-lg bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 rounded-xl shadow-xl"
                                    >
                                        <Smartphone className="w-5 h-5 mr-2" />
                                        Pay ₹{finalAmount.toLocaleString()} with UPI App
                                    </Button>
                                </a>
                                <p className="text-center text-xs text-gray-400">
                                    Click to open your default UPI app (GPay, PhonePe, Paytm, etc.)
                                </p>

                                {/* UPI ID for manual entry */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-2">Or pay manually to UPI ID:</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg text-gray-900 dark:text-white flex-1">{UPI_ID}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(UPI_ID, 'UPI ID')}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bank Transfer Details</h3>

                                {[
                                    { label: 'Account Name', value: BANK_DETAILS.accountName },
                                    { label: 'Account Number', value: BANK_DETAILS.accountNumber },
                                    { label: 'IFSC Code', value: BANK_DETAILS.ifscCode },
                                    { label: 'Bank', value: BANK_DETAILS.bankName },
                                ].map((item) => (
                                    <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500">{item.label}</p>
                                            <p className="font-mono font-bold text-gray-900 dark:text-white">{item.value}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(item.value, item.label)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Proceed to Upload */}
                        <Button
                            onClick={() => setStep('upload')}
                            className="w-full mt-6 py-6 text-lg font-bold bg-[#5750F1] hover:bg-[#4a43d6] rounded-xl"
                        >
                            I've Made the Payment
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            After making payment, click above to upload screenshot
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    // Upload Proof Screen
    if (step === 'upload') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
                <div className="max-w-xl mx-auto">
                    <Card className="p-6 sm:p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-[#5750F1]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-[#5750F1]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Payment Proof</h2>
                            <p className="text-gray-500 mt-1">Donation ID: <span className="font-mono font-bold text-[#5750F1]">{donationId}</span></p>
                        </div>

                        {/* File Upload */}
                        <div className="mb-6">
                            <label className="block">
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${uploadPreview ? 'border-[#5750F1] bg-[#5750F1]/5' : 'border-gray-300 dark:border-gray-700 hover:border-[#5750F1]'
                                    }`}>
                                    {uploadPreview ? (
                                        <div className="relative">
                                            <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setUploadedFile(null);
                                                    setUploadPreview(null);
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 dark:text-gray-400">Click to upload screenshot</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Transaction ID (Optional) */}
                        <div className="mb-6">
                            <Label htmlFor="transactionId" className="text-gray-900 dark:text-white">
                                Transaction ID <span className="text-gray-400 text-sm">(optional)</span>
                            </Label>
                            <Input
                                id="transactionId"
                                placeholder="Enter UPI/Bank transaction ID"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="mt-2 rounded-xl"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleUploadProof}
                            disabled={!uploadedFile || submitting}
                            className="w-full py-6 text-lg font-bold bg-[#5750F1] hover:bg-[#4a43d6] rounded-xl disabled:opacity-50"
                        >
                            {submitting ? 'Uploading...' : 'Submit & Mark as Paid'}
                            <CheckCircle className="w-5 h-5 ml-2" />
                        </Button>

                        <button
                            onClick={() => setStep('payment')}
                            className="w-full mt-3 py-3 text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Back to payment instructions
                        </button>
                    </Card>
                </div>
            </div>
        );
    }

    // Success Screen
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 flex items-center justify-center">
                <Card className="p-8 sm:p-12 border-0 shadow-xl bg-white dark:bg-gray-900 max-w-md text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
                    <p className="text-gray-500 mb-4">Your donation has been submitted successfully.</p>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                        <p className="text-sm text-gray-500">Donation ID</p>
                        <p className="font-mono font-bold text-xl text-[#5750F1]">{donationId}</p>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        Our team will verify your payment within 24-48 hours. You'll receive a confirmation email and receipt once verified.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => window.location.href = '/my-donations'}
                            className="w-full py-4 bg-[#5750F1] hover:bg-[#4a43d6] rounded-xl"
                        >
                            View My Donations
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStep('form');
                                setSelectedCategory(null);
                                setSelectedAmount(null);
                                setCustomAmount('');
                                setUploadedFile(null);
                                setUploadPreview(null);
                                setDonationId(null);
                            }}
                            className="w-full py-4 rounded-xl"
                        >
                            Make Another Donation
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Main Donation Form
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section className="relative min-h-[40vh] sm:min-h-[45vh] overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 blur-3xl animate-orb-1" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl animate-orb-2" />
                </div>

                {/* Content */}
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[45vh] text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-4">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-medium text-white/80">Support Our Mission</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-white mb-3">
                        Make a Sacred Contribution
                    </h1>

                    <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
                        Your donation helps maintain temple services, distribute prasadam, and spread Krishna consciousness.
                    </p>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
                        <path
                            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8 sm:py-12 px-4">
                <div className="mx-auto max-w-4xl">

                    {/* Step 1: Category Selection */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5750F1] text-white flex items-center justify-center text-sm sm:text-base font-bold">1</div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Choose Donation Purpose</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {DONATION_CATEGORIES.map((category) => {
                                const Icon = category.icon;
                                const isSelected = selectedCategory === category.id;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`relative text-left p-4 rounded-xl border-2 transition-all duration-300 ${isSelected
                                            ? 'border-[#5750F1] bg-[#5750F1]/5 dark:bg-[#5750F1]/10 shadow-lg shadow-[#5750F1]/20'
                                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#5750F1]/50'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#5750F1] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-2`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{category.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Amount Selection */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5750F1] text-white flex items-center justify-center text-sm sm:text-base font-bold">2</div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Select Amount</h2>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                            {PRESET_AMOUNTS.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => handleAmountSelect(amount)}
                                    className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 ${selectedAmount === amount
                                        ? 'bg-[#5750F1] text-white shadow-lg shadow-[#5750F1]/30'
                                        : 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-[#5750F1]/50'
                                        }`}
                                >
                                    ₹{amount.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        <div className="relative max-w-sm">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</div>
                            <Input
                                type="text"
                                placeholder="Custom amount"
                                value={customAmount}
                                onChange={(e) => handleCustomAmountChange(e.target.value)}
                                className="pl-10 py-5 font-medium rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-[#5750F1]"
                            />
                        </div>
                    </div>

                    {/* Step 3: Donor Information */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5750F1] text-white flex items-center justify-center text-sm sm:text-base font-bold">3</div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Your Information</h2>
                        </div>

                        <Card className="p-4 sm:p-6 border-0 shadow-lg bg-white dark:bg-gray-900">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-gray-900 dark:text-white font-medium">Full Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                {/* Show email field only for guests, or show as readonly for logged-in */}
                                {isAuthenticated && user?.email ? (
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-900 dark:text-white font-medium">Email</Label>
                                        <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300">
                                            {user.email}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-gray-900 dark:text-white font-medium">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-gray-900 dark:text-white font-medium">Phone *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="pan" className="text-gray-900 dark:text-white font-medium">
                                        PAN Number <span className="text-gray-400 text-xs">(80G coming soon)</span>
                                    </Label>
                                    <Input
                                        id="pan"
                                        placeholder="ABCDE1234F"
                                        value={formData.pan}
                                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                        className="rounded-xl uppercase"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="address" className="text-gray-900 dark:text-white font-medium">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Street address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="city" className="text-gray-900 dark:text-white font-medium">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="pincode" className="text-gray-900 dark:text-white font-medium">PIN Code</Label>
                                    <Input
                                        id="pincode"
                                        placeholder="XXXXXX"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="rounded-xl"
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Step 4: Payment Method */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5750F1] text-white flex items-center justify-center text-sm sm:text-base font-bold">4</div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'UPI', label: 'UPI', icon: Smartphone, description: 'Google Pay, PhonePe, Paytm, etc.' },
                                { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building, description: 'NEFT / RTGS / IMPS' }
                            ].map((method) => {
                                const Icon = method.icon;
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as 'UPI' | 'BANK_TRANSFER')}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 ${isSelected
                                            ? 'border-[#5750F1] bg-[#5750F1]/5 dark:bg-[#5750F1]/10'
                                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#5750F1]/50'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#5750F1] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                        <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-[#5750F1]' : 'text-gray-400'}`} />
                                        <h3 className="font-bold text-gray-900 dark:text-white">{method.label}</h3>
                                        <p className="text-xs text-gray-500">{method.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Proceed Button */}
                    <div className="max-w-md mx-auto">
                        <Button
                            onClick={handleProceedToPayment}
                            disabled={!selectedCategory || finalAmount < 100 || !formData.name || !formData.email || !formData.phone || submitting}
                            className="w-full py-5 sm:py-6 text-base sm:text-lg font-bold bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 rounded-xl shadow-xl shadow-[#5750F1]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                'Processing...'
                            ) : finalAmount > 0 ? (
                                <span className="flex items-center gap-2">
                                    Proceed to Pay ₹{finalAmount.toLocaleString()}
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            ) : (
                                'Select amount to continue'
                            )}
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-4">
                            By donating, you agree to our terms. 80G tax benefits coming soon.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
