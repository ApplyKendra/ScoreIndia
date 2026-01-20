'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Plus, X } from 'lucide-react';

interface ContactUsData {
    id?: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    address: string;
    phoneNumbers: string[];
    emails: string[];
    mapEmbedUrl: string;
    timings: string;
    isPublished: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminContactUsPage() {
    const [data, setData] = useState<ContactUsData>({
        heroTitle: 'Contact Us',
        heroSubtitle: '',
        heroImage: '',
        address: '',
        phoneNumbers: [''],
        emails: [''],
        mapEmbedUrl: '',
        timings: '',
        isPublished: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/pages/contact-us`);
            if (res.ok) {
                const result = await res.json();
                setData({
                    ...result,
                    phoneNumbers: result.phoneNumbers?.length ? result.phoneNumbers : [''],
                    emails: result.emails?.length ? result.emails : [''],
                });
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
                setData({ ...data, heroImage: result.imageUrl });
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
            const res = await fetch(`${API_URL}/pages/contact-us`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...data,
                    phoneNumbers: data.phoneNumbers.filter(p => p.trim()),
                    emails: data.emails.filter(e => e.trim()),
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

    const addPhone = () => setData({ ...data, phoneNumbers: [...data.phoneNumbers, ''] });
    const removePhone = (index: number) => {
        const newPhones = [...data.phoneNumbers];
        newPhones.splice(index, 1);
        setData({ ...data, phoneNumbers: newPhones.length ? newPhones : [''] });
    };
    const updatePhone = (index: number, value: string) => {
        const newPhones = [...data.phoneNumbers];
        newPhones[index] = value;
        setData({ ...data, phoneNumbers: newPhones });
    };

    const addEmail = () => setData({ ...data, emails: [...data.emails, ''] });
    const removeEmail = (index: number) => {
        const newEmails = [...data.emails];
        newEmails.splice(index, 1);
        setData({ ...data, emails: newEmails.length ? newEmails : [''] });
    };
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...data.emails];
        newEmails[index] = value;
        setData({ ...data, emails: newEmails });
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us Page</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage contact information</p>
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
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            className="text-sm"
                        />
                        {uploading && <span className="text-sm text-[#5750F1]">Uploading...</span>}
                    </div>
                </div>
            </Card>

            {/* Address & Timings */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                        value={data.address}
                        onChange={(e) => setData({ ...data, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Full temple address..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Temple Timings</label>
                    <textarea
                        value={data.timings}
                        onChange={(e) => setData({ ...data, timings: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="e.g., Open: 4:30 AM - 1:00 PM, 4:00 PM - 8:30 PM"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Google Maps Embed URL</label>
                    <input
                        type="text"
                        value={data.mapEmbedUrl}
                        onChange={(e) => setData({ ...data, mapEmbedUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="https://www.google.com/maps/embed?..."
                    />
                </div>
            </Card>

            {/* Phone Numbers */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phone Numbers</h2>
                    <Button variant="outline" size="sm" onClick={addPhone}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </div>
                {data.phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => updatePhone(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="+91 9876543210"
                        />
                        {data.phoneNumbers.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removePhone(idx)} className="text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </Card>

            {/* Emails */}
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Addresses</h2>
                    <Button variant="outline" size="sm" onClick={addEmail}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </div>
                {data.emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => updateEmail(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="info@iskconburla.com"
                        />
                        {data.emails.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeEmail(idx)} className="text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
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
