'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2, Crop as CropIcon } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import api from '@/lib/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, label = "Upload Image", className, disabled }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalFilename, setOriginalFilename] = useState<string>('image.jpg');

    // Update preview when value changes (e.g. initial load)
    useEffect(() => {
        if (value) {
            setPreview(getImageUrl(value));
        } else {
            setPreview(undefined);
        }
    }, [value]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validation
            if (file.size > 20 * 1024 * 1024) {
                setError("File size must be less than 20MB");
                return;
            }

            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                setError("Only JPEG, PNG, WebP, and GIF are allowed");
                return;
            }

            setOriginalFilename(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setIsCropOpen(true);
            });
            reader.readAsDataURL(file);

            // Reset input
            e.target.value = '';
        }
    };

    const handleUploadCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedImageBlob) {
                throw new Error("Failed to crop image");
            }

            // Create a File from the Blob
            const file = new File([croppedImageBlob], originalFilename, { type: "image/jpeg" });

            const data = await api.uploadImage(file);
            onChange(data.url);
            setPreview(getImageUrl(data.url));
            setIsCropOpen(false);
            setImageSrc(null);
        } catch (err: any) {
            setError(err.message || "Upload failed. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange("");
        setPreview(undefined);
    };

    const triggerUpload = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
            <div
                onClick={triggerUpload}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 border-slate-300",
                    error && "border-red-500 bg-red-50",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-slate-50"
                )}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Loader2 className="w-8 h-8 mb-4 text-slate-500 animate-spin" />
                        <p className="text-sm text-slate-500">Uploading...</p>
                    </div>
                ) : preview ? (
                    <div className="relative w-full h-full p-2 group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-md"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <p className="text-white font-medium">Click to change</p>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                        <Upload className="w-8 h-8 mb-3" />
                        <p className="mb-1 text-xs text-center"><span className="font-semibold">Click to upload</span></p>
                        <p className="text-[10px] text-center">JPEG, PNG, WebP (Max 20MB)</p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disabled || loading}
                />
            </div>
            {error && (
                <p className="text-[10.5px] font-medium text-red-500">{error}</p>
            )}

            {/* Crop Dialog */}
            <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                <DialogContent className="sm:max-w-xl bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Crop Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-80 bg-slate-900 rounded-md overflow-hidden">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="space-y-2 py-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Zoom</span>
                            <span>{zoom.toFixed(1)}x</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value: number[]) => setZoom(value[0])}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCropOpen(false); setImageSrc(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUploadCroppedImage} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CropIcon className="w-4 h-4 mr-2" />}
                            Crop & Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
