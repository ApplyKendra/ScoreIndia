'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    Loader2, Plus, Trash2, Camera, Clock, Upload, X, Eye, EyeOff,
    Edit2, Save, Youtube, Settings, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { darshanApi, type DarshanImage, type AartiScheduleItem, type DarshanSetting } from '@/lib/api/darshan';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminDarshanPage() {
    // Data states
    const [images, setImages] = useState<DarshanImage[]>([]);
    const [aartiSchedule, setAartiSchedule] = useState<AartiScheduleItem[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});

    // Loading states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dialog states
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [aartiDialogOpen, setAartiDialogOpen] = useState(false);
    const [editingAarti, setEditingAarti] = useState<AartiScheduleItem | null>(null);
    const [editingImage, setEditingImage] = useState<DarshanImage | null>(null);

    // Form states
    const [imageFormData, setImageFormData] = useState({ title: '', description: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const [aartiFormData, setAartiFormData] = useState({ name: '', time: '', description: '' });

    // Settings form
    const [youtubeLink, setYoutubeLink] = useState('');
    const [templeOpen, setTempleOpen] = useState('');
    const [templeClose, setTempleClose] = useState('');

    // ============================================
    // DATA FETCHING
    // ============================================

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsData, aartiData, imagesData] = await Promise.all([
                darshanApi.getSettings(),
                darshanApi.getAartiSchedule(true),
                darshanApi.getDarshanImages(true),
            ]);

            // Process settings into a map
            const settingsMap: Record<string, string> = {};
            settingsData.forEach((s) => {
                settingsMap[s.key] = s.value;
            });
            setSettings(settingsMap);
            setYoutubeLink(settingsMap['youtube_link'] || '');
            setTempleOpen(settingsMap['temple_open'] || '4:30 AM');
            setTempleClose(settingsMap['temple_close'] || '9:00 PM');

            setAartiSchedule(aartiData);
            setImages(imagesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load darshan data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ============================================
    // SETTINGS HANDLERS
    // ============================================

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await Promise.all([
                darshanApi.updateSetting('youtube_link', youtubeLink),
                darshanApi.updateSetting('temple_open', templeOpen),
                darshanApi.updateSetting('temple_close', templeClose),
            ]);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // AARTI HANDLERS
    // ============================================

    const handleOpenAartiDialog = (aarti?: AartiScheduleItem) => {
        if (aarti) {
            setEditingAarti(aarti);
            setAartiFormData({ name: aarti.name, time: aarti.time, description: aarti.description || '' });
        } else {
            setEditingAarti(null);
            setAartiFormData({ name: '', time: '', description: '' });
        }
        setAartiDialogOpen(true);
    };

    const handleSaveAarti = async () => {
        if (!aartiFormData.name || !aartiFormData.time) {
            toast.error('Please fill name and time');
            return;
        }

        setSaving(true);
        try {
            if (editingAarti) {
                await darshanApi.updateAarti(editingAarti.id, aartiFormData);
                toast.success('Aarti updated');
            } else {
                await darshanApi.createAarti(aartiFormData);
                toast.success('Aarti created');
            }
            setAartiDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save aarti');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAarti = async (id: string) => {
        if (!confirm('Delete this aarti time?')) return;
        try {
            await darshanApi.deleteAarti(id);
            toast.success('Aarti deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete aarti');
        }
    };

    const handleToggleAarti = async (aarti: AartiScheduleItem) => {
        try {
            await darshanApi.updateAarti(aarti.id, { isActive: !aarti.isActive });
            toast.success(aarti.isActive ? 'Aarti hidden' : 'Aarti shown');
            fetchData();
        } catch (error) {
            toast.error('Failed to update aarti');
        }
    };

    // ============================================
    // IMAGE HANDLERS
    // ============================================

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (JPEG, PNG, or WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image size must be less than 5MB');
            return;
        }

        setUploadError('');
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleOpenImageDialog = (image?: DarshanImage) => {
        if (image) {
            setEditingImage(image);
            setImageFormData({ title: image.title, description: image.description || '' });
            setImagePreview(image.url);
        } else {
            setEditingImage(null);
            setImageFormData({ title: '', description: '' });
            setImagePreview('');
            setSelectedFile(null);
        }
        setImageDialogOpen(true);
    };

    const handleSaveImage = async () => {
        if (!imageFormData.title) {
            toast.error('Please fill title');
            return;
        }

        if (!editingImage && !selectedFile) {
            toast.error('Please select an image');
            return;
        }

        setUploading(true);
        try {
            if (editingImage) {
                // Update existing image metadata
                await darshanApi.updateDarshanImage(editingImage.id, {
                    title: imageFormData.title,
                    description: imageFormData.description,
                });
                toast.success('Image updated');
            } else if (selectedFile) {
                // Create new image
                await darshanApi.uploadDarshanImage(selectedFile, imageFormData.title, imageFormData.description);
                toast.success('Image uploaded');
            }
            setImageDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save image');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleImage = async (image: DarshanImage) => {
        try {
            await darshanApi.updateDarshanImage(image.id, { isActive: !image.isActive });
            toast.success(image.isActive ? 'Image hidden' : 'Image shown');
            fetchData();
        } catch (error) {
            toast.error('Failed to update image');
        }
    };

    const handleDeleteImage = async (id: string) => {
        if (!confirm('Delete this darshan image?')) return;
        try {
            await darshanApi.deleteDarshanImage(id);
            toast.success('Image deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Darshan Management</h1>
                    <p className="text-muted-foreground">Manage darshan images, aarti schedule, and temple settings</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => handleOpenImageDialog()}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Darshan
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{images.length}</p>
                            <p className="text-xs text-muted-foreground">Total Images</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{images.filter(i => i.isActive).length}</p>
                            <p className="text-xs text-muted-foreground">Visible</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{aartiSchedule.length}</p>
                            <p className="text-xs text-muted-foreground">Aarti Times</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <Youtube className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold truncate max-w-24">{youtubeLink ? 'Set' : 'Unset'}</p>
                            <p className="text-xs text-muted-foreground">YouTube Link</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Settings Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-600" />
                        Temple Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube Live Stream Link</Label>
                            <Input
                                id="youtube"
                                value={youtubeLink}
                                onChange={(e) => setYoutubeLink(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="temple-open">Temple Opening Time</Label>
                            <Input
                                id="temple-open"
                                value={templeOpen}
                                onChange={(e) => setTempleOpen(e.target.value)}
                                placeholder="4:30 AM"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="temple-close">Temple Closing Time</Label>
                            <Input
                                id="temple-close"
                                value={templeClose}
                                onChange={(e) => setTempleClose(e.target.value)}
                                placeholder="9:00 PM"
                            />
                        </div>
                    </div>
                    <Button
                        className="mt-4 bg-amber-600 hover:bg-amber-700"
                        onClick={handleSaveSettings}
                        disabled={saving}
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Darshan Images */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-amber-600" />
                                Daily Darshan Images
                            </CardTitle>
                            <Badge variant="outline" className="text-amber-600 border-amber-200">
                                {images.length} Images
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {images.length === 0 ? (
                                <div className="text-center py-12">
                                    <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-muted-foreground mb-4">No darshan images yet</p>
                                    <Button onClick={() => handleOpenImageDialog()} className="bg-amber-600 hover:bg-amber-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload First Image
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {images.map((image) => (
                                        <Card key={image.id} className={`overflow-hidden ${!image.isActive ? 'opacity-60' : ''}`}>
                                            <div className="relative h-40">
                                                <Image
                                                    src={image.url}
                                                    alt={image.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {!image.isActive && (
                                                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                                        <Badge className="bg-gray-800">Hidden</Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-semibold text-sm line-clamp-1">{image.title}</h4>
                                                {image.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{image.description}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(image.createdAt)}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleOpenImageDialog(image)}
                                                        >
                                                            <Edit2 className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleToggleImage(image)}
                                                        >
                                                            {image.isActive ? (
                                                                <Eye className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500"
                                                            onClick={() => handleDeleteImage(image.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Aarti Schedule */}
                <div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                Aarti Schedule
                            </CardTitle>
                            <Button size="sm" variant="outline" onClick={() => handleOpenAartiDialog()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {aartiSchedule.map((aarti) => (
                                    <div
                                        key={aarti.id}
                                        className={`px-4 py-3 flex items-center justify-between hover:bg-muted/50 ${!aarti.isActive ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{aarti.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{aarti.description}</p>
                                        </div>
                                        <Badge variant="outline" className="text-amber-600 border-amber-200 mx-2 flex-shrink-0">
                                            {aarti.time}
                                        </Badge>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleOpenAartiDialog(aarti)}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleToggleAarti(aarti)}
                                            >
                                                {aarti.isActive ? (
                                                    <Eye className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <EyeOff className="h-3 w-3 text-gray-400" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500"
                                                onClick={() => handleDeleteAarti(aarti.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Tips */}
                    <Card className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-amber-800 mb-2">💡 Tips</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                                <li>• Upload images after each aarti</li>
                                <li>• Use high-quality vertical images</li>
                                <li>• Include aarti name in title</li>
                                <li>• Toggle visibility for old images</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Upload/Edit Image Dialog */}
            <Dialog open={imageDialogOpen} onOpenChange={(open) => { setImageDialogOpen(open); if (!open) { setEditingImage(null); setSelectedFile(null); setImagePreview(''); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingImage ? 'Edit Darshan Image' : 'Upload Darshan Image'}</DialogTitle>
                        <DialogDescription>
                            {editingImage ? 'Update image details' : 'Add a new darshan photo for today'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Image Preview/Upload */}
                        {!editingImage && (
                            <>
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={() => { setSelectedFile(null); setImagePreview(''); }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-48 border-2 border-dashed border-amber-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors"
                                        onClick={() => document.getElementById('darshan-upload')?.click()}
                                    >
                                        <Camera className="w-10 h-10 text-amber-500 mb-2" />
                                        <p className="text-sm text-amber-600 font-medium">Click to upload image</p>
                                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP • Max 5MB</p>
                                    </div>
                                )}
                                <input
                                    id="darshan-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                            </>
                        )}

                        {editingImage && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                <Image src={editingImage.url} alt={editingImage.title} fill className="object-cover" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={imageFormData.title}
                                onChange={(e) => setImageFormData({ ...imageFormData, title: e.target.value })}
                                placeholder="e.g., Sri Sri Radha Madhav - Mangala Aarti"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={imageFormData.description}
                                onChange={(e) => setImageFormData({ ...imageFormData, description: e.target.value })}
                                placeholder="e.g., Morning darshan after Mangala Aarti"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveImage}
                            disabled={uploading || (!editingImage && !selectedFile) || !imageFormData.title}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingImage ? <Save className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            {editingImage ? 'Save' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Aarti Dialog */}
            <Dialog open={aartiDialogOpen} onOpenChange={(open) => { setAartiDialogOpen(open); if (!open) setEditingAarti(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingAarti ? 'Edit Aarti' : 'Add New Aarti'}</DialogTitle>
                        <DialogDescription>
                            {editingAarti ? 'Update aarti details' : 'Add a new aarti to the schedule'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="aarti-name">Aarti Name *</Label>
                            <Input
                                id="aarti-name"
                                value={aartiFormData.name}
                                onChange={(e) => setAartiFormData({ ...aartiFormData, name: e.target.value })}
                                placeholder="e.g., Mangala Aarti"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aarti-time">Time *</Label>
                            <Input
                                id="aarti-time"
                                value={aartiFormData.time}
                                onChange={(e) => setAartiFormData({ ...aartiFormData, time: e.target.value })}
                                placeholder="e.g., 04:30 AM"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aarti-desc">Description</Label>
                            <Input
                                id="aarti-desc"
                                value={aartiFormData.description}
                                onChange={(e) => setAartiFormData({ ...aartiFormData, description: e.target.value })}
                                placeholder="e.g., Morning wake-up ceremony"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAartiDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAarti}
                            disabled={saving || !aartiFormData.name || !aartiFormData.time}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
