'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Plus, X, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MembershipTier {
    name: string;
    amount: number;
    description: string;
    benefits: string[];
}

interface NityaSevakPageData {
    id?: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    description: string;
    benefits: string[];
    membershipTiers: MembershipTier[];
    isPublished: boolean;
}

interface Application {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    selectedTier: string;
    amount: string;
    panNumber: string;
    message: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminNityaSevakPage() {
    const [activeTab, setActiveTab] = useState<'content' | 'applications'>('content');
    const [pageData, setPageData] = useState<NityaSevakPageData>({
        heroTitle: 'Become a Nitya Sevak',
        heroSubtitle: '',
        heroImage: '',
        description: '',
        benefits: [''],
        membershipTiers: [],
        isPublished: true,
    });
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch page content
            const pageRes = await fetch(`${API_URL}/api/pages/nitya-sevak`);
            if (pageRes.ok) {
                const data = await pageRes.json();
                setPageData({
                    ...data,
                    benefits: data.benefits?.length ? data.benefits : [''],
                    membershipTiers: data.membershipTiers || [],
                });
            }

            // Fetch applications
            const appsRes = await fetch(`${API_URL}/api/pages/nitya-sevak/applications`, {
                credentials: 'include',
            });
            if (appsRes.ok) {
                const appsData = await appsRes.json();
                setApplications(appsData);
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (res.ok) {
                const result = await res.json();
                setPageData({ ...pageData, heroImage: result.imageUrl });
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/pages/nitya-sevak`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...pageData,
                    benefits: pageData.benefits.filter(b => b.trim()),
                }),
            });
            if (res.ok) {
                alert('Saved successfully!');
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateApplicationStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch(`${API_URL}/api/pages/nitya-sevak/applications/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Benefits management
    const addBenefit = () => setPageData({ ...pageData, benefits: [...pageData.benefits, ''] });
    const removeBenefit = (index: number) => {
        const newBenefits = [...pageData.benefits];
        newBenefits.splice(index, 1);
        setPageData({ ...pageData, benefits: newBenefits.length ? newBenefits : [''] });
    };
    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...pageData.benefits];
        newBenefits[index] = value;
        setPageData({ ...pageData, benefits: newBenefits });
    };

    // Tiers management
    const addTier = () => {
        setPageData({
            ...pageData,
            membershipTiers: [
                ...pageData.membershipTiers,
                { name: '', amount: 0, description: '', benefits: [] },
            ],
        });
    };
    const removeTier = (index: number) => {
        const newTiers = [...pageData.membershipTiers];
        newTiers.splice(index, 1);
        setPageData({ ...pageData, membershipTiers: newTiers });
    };
    const updateTier = (index: number, field: keyof MembershipTier, value: string | number) => {
        const newTiers = [...pageData.membershipTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setPageData({ ...pageData, membershipTiers: newTiers });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5750F1]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nitya Sevak Program</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage life patron membership program</p>
                </div>
                {activeTab === 'content' && (
                    <Button onClick={handleSave} disabled={saving} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'content'
                        ? 'border-[#5750F1] text-[#5750F1]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Page Content
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'applications'
                        ? 'border-[#5750F1] text-[#5750F1]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Applications
                    {applications.filter(a => a.status === 'PENDING').length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {applications.filter(a => a.status === 'PENDING').length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'content' ? (
                <>
                    {/* Hero Section */}
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hero Section</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={pageData.heroTitle}
                                    onChange={(e) => setPageData({ ...pageData, heroTitle: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Subtitle</label>
                                <input
                                    type="text"
                                    value={pageData.heroSubtitle}
                                    onChange={(e) => setPageData({ ...pageData, heroSubtitle: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Hero Image</label>
                            <div className="flex items-center gap-4">
                                {pageData.heroImage && (
                                    <img src={pageData.heroImage} alt="Hero" className="h-20 w-32 object-cover rounded-lg" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="text-sm"
                                />
                                {uploading && <span className="text-sm text-[#5750F1]">Uploading...</span>}
                            </div>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Program Description</h2>
                        <textarea
                            value={pageData.description}
                            onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="Describe the Nitya Sevak membership program..."
                        />
                    </Card>

                    {/* Benefits */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Member Benefits</h2>
                            <Button variant="outline" size="sm" onClick={addBenefit}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </div>
                        {pageData.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={benefit}
                                    onChange={(e) => updateBenefit(idx, e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., Special darshan during festivals"
                                />
                                {pageData.benefits.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeBenefit(idx)} className="text-red-500">
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </Card>

                    {/* Membership Tiers */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Membership Tiers</h2>
                            <Button variant="outline" size="sm" onClick={addTier}>
                                <Plus className="h-4 w-4 mr-1" /> Add Tier
                            </Button>
                        </div>
                        {pageData.membershipTiers.map((tier, idx) => (
                            <div key={idx} className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                                        <input
                                            type="text"
                                            value={tier.name}
                                            onChange={(e) => updateTier(idx, 'name', e.target.value)}
                                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            placeholder="Tier Name (e.g., Gold)"
                                        />
                                        <input
                                            type="number"
                                            value={tier.amount}
                                            onChange={(e) => updateTier(idx, 'amount', Number(e.target.value))}
                                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            placeholder="Amount (₹)"
                                        />
                                        <input
                                            type="text"
                                            value={tier.description}
                                            onChange={(e) => updateTier(idx, 'description', e.target.value)}
                                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            placeholder="Description"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeTier(idx)} className="text-red-500 ml-2">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </Card>

                    {/* Publish Toggle */}
                    <Card className="p-6">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={pageData.isPublished}
                                onChange={(e) => setPageData({ ...pageData, isPublished: e.target.checked })}
                                className="h-4 w-4 text-[#5750F1] rounded"
                            />
                            <span className="text-sm font-medium">Published (visible to users)</span>
                        </label>
                    </Card>
                </>
            ) : (
                /* Applications Tab */
                <div className="space-y-4">
                    {applications.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No applications yet</h3>
                            <p className="text-gray-500 mt-1">Applications will appear here when users submit them</p>
                        </Card>
                    ) : (
                        applications.map((app) => (
                            <Card key={app.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                                app.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {app.email} • {app.phone}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">{app.selectedTier}</span> - ₹{Number(app.amount).toLocaleString()}
                                        </p>
                                        {app.message && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{app.message}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {app.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:bg-green-50"
                                                onClick={() => updateApplicationStatus(app.id, 'APPROVED')}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
