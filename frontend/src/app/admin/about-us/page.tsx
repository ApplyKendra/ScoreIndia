'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Image as ImageIcon, X } from 'lucide-react';

interface AboutUsData {
    id?: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    mission: string;
    missionImage: string;
    vision: string;
    history: string;
    historyImages: string[];
    founderInfo: string;
    founderImage: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminAboutUsPage() {
    const [data, setData] = useState<AboutUsData>({
        heroTitle: '',
        heroSubtitle: '',
        heroImage: '',
        mission: '',
        missionImage: '',
        vision: '',
        history: '',
        historyImages: [],
        founderInfo: '',
        founderImage: '',
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
            const res = await fetch(`${API_URL}/pages/about-us`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
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
                if (field === 'historyImages') {
                    setData({ ...data, historyImages: [...data.historyImages, result.imageUrl] });
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
            const res = await fetch(`${API_URL}/pages/about-us`, {
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

    const removeHistoryImage = (index: number) => {
        const newImages = [...data.historyImages];
        newImages.splice(index, 1);
        setData({ ...data, historyImages: newImages });
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About Us Page</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage the About Us page content</p>
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

            {/* Mission Section */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mission</h2>
                <textarea
                    value={data.mission}
                    onChange={(e) => setData({ ...data, mission: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter mission statement..."
                />
                <div>
                    <label className="block text-sm font-medium mb-1">Mission Image</label>
                    <div className="flex items-center gap-4">
                        {data.missionImage && (
                            <img src={data.missionImage} alt="Mission" className="h-20 w-32 object-cover rounded-lg" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('missionImage', e.target.files[0])}
                            className="text-sm"
                        />
                    </div>
                </div>
            </Card>

            {/* Vision Section */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vision</h2>
                <textarea
                    value={data.vision}
                    onChange={(e) => setData({ ...data, vision: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter vision statement..."
                />
            </Card>

            {/* History Section */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
                <textarea
                    value={data.history}
                    onChange={(e) => setData({ ...data, history: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter temple history..."
                />
                <div>
                    <label className="block text-sm font-medium mb-2">History Images</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                        {data.historyImages.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img src={img} alt={`History ${idx + 1}`} className="h-20 w-32 object-cover rounded-lg" />
                                <button
                                    onClick={() => removeHistoryImage(idx)}
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
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('historyImages', e.target.files[0])}
                        className="text-sm"
                    />
                </div>
            </Card>

            {/* Founder Section */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Founder Information</h2>
                <textarea
                    value={data.founderInfo}
                    onChange={(e) => setData({ ...data, founderInfo: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter founder information..."
                />
                <div>
                    <label className="block text-sm font-medium mb-1">Founder Image</label>
                    <div className="flex items-center gap-4">
                        {data.founderImage && (
                            <img src={data.founderImage} alt="Founder" className="h-20 w-20 object-cover rounded-full" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('founderImage', e.target.files[0])}
                            className="text-sm"
                        />
                    </div>
                </div>
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
