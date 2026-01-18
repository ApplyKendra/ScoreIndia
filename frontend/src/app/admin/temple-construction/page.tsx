'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Plus, X, GripVertical } from 'lucide-react';

interface Phase {
    name: string;
    description: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
    order: number;
}

interface TempleConstructionData {
    id?: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    projectDescription: string;
    targetAmount: number | null;
    raisedAmount: number | null;
    progressImages: string[];
    phases: Phase[];
    donationLink: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminTempleConstructionPage() {
    const [data, setData] = useState<TempleConstructionData>({
        heroTitle: 'New Temple Construction',
        heroSubtitle: '',
        heroImage: '',
        projectDescription: '',
        targetAmount: null,
        raisedAmount: null,
        progressImages: [],
        phases: [],
        donationLink: '',
        isPublished: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/pages/temple-construction`);
            if (res.ok) {
                const result = await res.json();
                setData({
                    ...result,
                    phases: result.phases || [],
                    progressImages: result.progressImages || [],
                    targetAmount: result.targetAmount ? Number(result.targetAmount) : null,
                    raisedAmount: result.raisedAmount ? Number(result.raisedAmount) : null,
                });
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (field: string, file: File) => {
        setUploading(field);
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
                if (field === 'progressImages') {
                    setData({ ...data, progressImages: [...data.progressImages, result.imageUrl] });
                } else {
                    setData({ ...data, [field]: result.imageUrl });
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/pages/temple-construction`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
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

    const addPhase = () => {
        setData({
            ...data,
            phases: [...data.phases, { name: '', description: '', status: 'PLANNED', order: data.phases.length }],
        });
    };

    const updatePhase = (index: number, field: keyof Phase, value: string) => {
        const newPhases = [...data.phases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setData({ ...data, phases: newPhases });
    };

    const removePhase = (index: number) => {
        const newPhases = [...data.phases];
        newPhases.splice(index, 1);
        setData({ ...data, phases: newPhases });
    };

    const removeProgressImage = (index: number) => {
        const newImages = [...data.progressImages];
        newImages.splice(index, 1);
        setData({ ...data, progressImages: newImages });
    };

    const progressPercentage = data.targetAmount && data.raisedAmount
        ? Math.min(100, (data.raisedAmount / data.targetAmount) * 100)
        : 0;

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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Temple Construction Page</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage construction project details</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Hero Section */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hero Section</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            value={data.heroTitle}
                            onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subtitle</label>
                        <input
                            type="text"
                            value={data.heroSubtitle}
                            onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Hero Image</label>
                    <div className="flex items-center gap-4">
                        {data.heroImage && (
                            <img src={data.heroImage} alt="Hero" className="h-20 w-32 object-cover rounded-lg" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('heroImage', e.target.files[0])}
                            className="text-sm"
                        />
                        {uploading === 'heroImage' && <span className="text-sm text-[#5750F1]">Uploading...</span>}
                    </div>
                </div>
            </Card>

            {/* Project Description */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Description</h2>
                <textarea
                    value={data.projectDescription}
                    onChange={(e) => setData({ ...data, projectDescription: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Describe the temple construction project..."
                />
            </Card>

            {/* Fundraising Progress */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fundraising Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Amount (₹)</label>
                        <input
                            type="number"
                            value={data.targetAmount ?? ''}
                            onChange={(e) => setData({ ...data, targetAmount: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="50000000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Raised Amount (₹)</label>
                        <input
                            type="number"
                            value={data.raisedAmount ?? ''}
                            onChange={(e) => setData({ ...data, raisedAmount: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="15000000"
                        />
                    </div>
                </div>
                {data.targetAmount && data.raisedAmount !== null && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#5750F1] to-purple-600 transition-all"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium mb-1">Donation Link</label>
                    <input
                        type="url"
                        value={data.donationLink}
                        onChange={(e) => setData({ ...data, donationLink: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="https://razorpay.com/..."
                    />
                </div>
            </Card>

            {/* Construction Phases */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Construction Phases</h2>
                    <Button variant="outline" size="sm" onClick={addPhase}>
                        <Plus className="h-4 w-4 mr-1" /> Add Phase
                    </Button>
                </div>
                {data.phases.map((phase, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 border rounded-lg dark:border-gray-700">
                        <GripVertical className="h-5 w-5 text-gray-400 mt-2" />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={phase.name}
                                onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Phase Name"
                            />
                            <input
                                type="text"
                                value={phase.description}
                                onChange={(e) => updatePhase(idx, 'description', e.target.value)}
                                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Description"
                            />
                            <select
                                value={phase.status}
                                onChange={(e) => updatePhase(idx, 'status', e.target.value)}
                                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="PLANNED">Planned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePhase(idx)} className="text-red-500">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </Card>

            {/* Progress Images */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Images</h2>
                <div className="flex flex-wrap gap-3">
                    {data.progressImages.map((img, idx) => (
                        <div key={idx} className="relative">
                            <img src={img} alt={`Progress ${idx + 1}`} className="h-24 w-32 object-cover rounded-lg" />
                            <button
                                onClick={() => removeProgressImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload('progressImages', e.target.files[0])}
                    className="text-sm"
                />
                {uploading === 'progressImages' && <span className="text-sm text-[#5750F1]">Uploading...</span>}
            </Card>

            {/* Publish Toggle */}
            <Card className="p-6">
                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={data.isPublished}
                        onChange={(e) => setData({ ...data, isPublished: e.target.checked })}
                        className="h-4 w-4 text-[#5750F1] rounded"
                    />
                    <span className="text-sm font-medium">Published (visible to users)</span>
                </label>
            </Card>
        </div>
    );
}
