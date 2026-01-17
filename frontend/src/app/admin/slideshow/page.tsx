'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    Eye,
    EyeOff,
    X,
    Save,
    Image as ImageIcon,
    Link as LinkIcon,
} from 'lucide-react';

interface HeroSlide {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    buttonText?: string;
    buttonLink?: string;
    gradient?: string;
    displayOrder: number;
    isActive: boolean;
}

const GRADIENT_OPTIONS = [
    { label: 'Orange to Pink', value: 'from-orange-500 via-rose-500 to-pink-500' },
    { label: 'Amber to Red', value: 'from-amber-500 via-orange-500 to-red-500' },
    { label: 'Violet to Fuchsia', value: 'from-violet-500 via-purple-500 to-fuchsia-500' },
    { label: 'Cyan to Indigo', value: 'from-cyan-500 via-blue-500 to-indigo-500' },
    { label: 'Emerald to Teal', value: 'from-emerald-500 via-green-500 to-teal-500' },
    { label: 'Rose to Pink', value: 'from-rose-500 via-pink-500 to-fuchsia-500' },
];

// API URL: Get base URL (without /api suffix) for direct fetch calls
const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return envUrl.replace(/\/api\/?$/, '');
};
const API_URL = getBaseUrl();

export default function AdminSlideshowPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        buttonText: '',
        buttonLink: '',
        gradient: GRADIENT_OPTIONS[0].value,
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');

    const fetchSlides = async () => {
        try {
            const res = await fetch(`${API_URL}/api/hero-slides?includeInactive=true`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setSlides(data);
            }
        } catch (error) {
            console.error('Failed to fetch slides:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlides();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image size must be less than 5MB');
            return;
        }

        setUploadError('');
        setSelectedFile(file);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!selectedFile) return formData.imageUrl; // Return existing URL if no new file

        setUploading(true);
        setUploadError('');

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', selectedFile);

            const res = await fetch(`${API_URL}/api/upload/image`, {
                method: 'POST',
                credentials: 'include',
                body: formDataUpload,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Upload failed');
            }

            const data = await res.json();
            return data.imageUrl;
        } catch (error: any) {
            setUploadError(error.message || 'Failed to upload image');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const openModal = (slide?: HeroSlide) => {
        if (slide) {
            setEditingSlide(slide);
            setFormData({
                title: slide.title,
                subtitle: slide.subtitle || '',
                imageUrl: slide.imageUrl,
                buttonText: slide.buttonText || '',
                buttonLink: slide.buttonLink || '',
                gradient: slide.gradient || GRADIENT_OPTIONS[0].value,
                isActive: slide.isActive,
            });
            setImagePreview(slide.imageUrl);
        } else {
            setEditingSlide(null);
            setFormData({
                title: '',
                subtitle: '',
                imageUrl: '',
                buttonText: '',
                buttonLink: '',
                gradient: GRADIENT_OPTIONS[0].value,
                isActive: true,
            });
            setImagePreview('');
        }
        setSelectedFile(null);
        setUploadError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSlide(null);
        setSelectedFile(null);
        setImagePreview('');
        setUploadError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Upload image first if new file selected
        let imageUrl = formData.imageUrl;
        if (selectedFile) {
            const uploadedUrl = await uploadImage();
            if (!uploadedUrl) {
                return; // Upload failed, don't proceed
            }
            imageUrl = uploadedUrl;
        }

        if (!imageUrl) {
            setUploadError('Please select an image');
            return;
        }

        try {
            const url = editingSlide
                ? `${API_URL}/api/hero-slides/${editingSlide.id}`
                : `${API_URL}/api/hero-slides`;

            const res = await fetch(url, {
                method: editingSlide ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    imageUrl,
                }),
            });

            if (res.ok) {
                await fetchSlides();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save slide:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            const res = await fetch(`${API_URL}/api/hero-slides/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                await fetchSlides();
            }
        } catch (error) {
            console.error('Failed to delete slide:', error);
        }
    };

    const toggleActive = async (slide: HeroSlide) => {
        try {
            const res = await fetch(`${API_URL}/api/hero-slides/${slide.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ isActive: !slide.isActive }),
            });
            if (res.ok) {
                await fetchSlides();
            }
        } catch (error) {
            console.error('Failed to toggle slide:', error);
        }
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Slideshow</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage homepage slideshow images and links
                    </p>
                </div>
                <Button onClick={() => openModal()} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                </Button>
            </div>

            {/* Slides List */}
            <div className="grid gap-4">
                {slides.length === 0 ? (
                    <Card className="p-12 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No slides yet</h3>
                        <p className="text-gray-500 mt-1">Add your first slideshow image</p>
                        <Button onClick={() => openModal()} className="mt-4 bg-[#5750F1] hover:bg-[#4a43d6]">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Slide
                        </Button>
                    </Card>
                ) : (
                    slides.map((slide) => (
                        <Card key={slide.id} className={`p-4 ${!slide.isActive ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                                {/* Drag Handle */}
                                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                                    <GripVertical className="h-5 w-5" />
                                </div>

                                {/* Image Preview */}
                                <div className={`h-20 w-32 rounded-lg bg-gradient-to-br ${slide.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center overflow-hidden`}>
                                    {slide.imageUrl ? (
                                        <img
                                            src={slide.imageUrl}
                                            alt={slide.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-white/60" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{slide.title}</h3>
                                    {slide.subtitle && (
                                        <p className="text-sm text-gray-500">{slide.subtitle}</p>
                                    )}
                                    {slide.buttonLink && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-[#5750F1]">
                                            <LinkIcon className="h-3 w-3" />
                                            <span>{slide.buttonLink}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleActive(slide)}
                                        className={slide.isActive ? 'text-green-500' : 'text-gray-400'}
                                    >
                                        {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openModal(slide)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => handleDelete(slide.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., Sri Sri Radha Madhav"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., Divine Deities of ISKCON"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Image *
                                </label>

                                <div className="space-y-3">
                                    {/* File Input */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            className="flex-1"
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            {selectedFile ? 'Change Image' : 'Choose Image'}
                                        </Button>
                                        {selectedFile && (
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                                {selectedFile.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Upload Progress */}
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-sm text-[#5750F1]">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#5750F1]"></div>
                                            <span>Uploading...</span>
                                        </div>
                                    )}

                                    {/* Upload Error */}
                                    {uploadError && (
                                        <p className="text-sm text-red-500">{uploadError}</p>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        Supported: JPEG, PNG, WebP. Max size: 5MB
                                    </p>
                                </div>
                            </div>

                            {/* Gradient */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Background Gradient
                                </label>
                                <select
                                    value={formData.gradient}
                                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                >
                                    {GRADIENT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Button Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    value={formData.buttonText}
                                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., Learn More"
                                />
                            </div>

                            {/* Button Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Button Link
                                </label>
                                <input
                                    type="text"
                                    value={formData.buttonLink}
                                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., /prasadam or https://..."
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 text-[#5750F1] rounded"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                                    Active (visible on homepage)
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6]">
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingSlide ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
