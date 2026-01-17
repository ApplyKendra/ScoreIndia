'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon, X, Upload } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { prasadamApi, PrasadamItem, PrasadamCategory } from '@/lib/api/prasadam';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MenuItemFormData {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    maxQuantityPerOrder: string;
    imageUrl: string;
}

export default function AdminMenuPage() {
    const [items, setItems] = useState<PrasadamItem[]>([]);
    const [categories, setCategories] = useState<PrasadamCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PrasadamItem | null>(null);
    const [formData, setFormData] = useState<MenuItemFormData>({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        maxQuantityPerOrder: '10',
        imageUrl: '',
    });
    const [saving, setSaving] = useState(false);

    // Image upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [menuItems, cats] = await Promise.all([
                prasadamApi.getMenuItems(),
                prasadamApi.getCategories(),
            ]);
            setItems(menuItems);
            setCategories(cats);
        } catch (error) {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
        if (!selectedFile) return formData.imageUrl || null;

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

    const openCreateDialog = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: categories[0]?.id || '',
            maxQuantityPerOrder: '10',
            imageUrl: '',
        });
        setSelectedFile(null);
        setImagePreview('');
        setUploadError('');
        setDialogOpen(true);
    };

    const openEditDialog = (item: PrasadamItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: String(item.price),
            categoryId: item.categoryId,
            maxQuantityPerOrder: String(item.maxQuantityPerOrder),
            imageUrl: item.imageUrl || '',
        });
        setSelectedFile(null);
        setImagePreview(item.imageUrl || '');
        setUploadError('');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
        setSelectedFile(null);
        setImagePreview('');
        setUploadError('');
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.categoryId) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            // Upload image first if new file selected
            let imageUrl = formData.imageUrl;
            if (selectedFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl === null && selectedFile) {
                    // Upload failed
                    setSaving(false);
                    return;
                }
                imageUrl = uploadedUrl || '';
            }

            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                price: parseFloat(formData.price),
                categoryId: formData.categoryId,
                maxQuantityPerOrder: parseInt(formData.maxQuantityPerOrder),
                imageUrl: imageUrl || undefined,
            };

            if (editingItem) {
                await prasadamApi.updateMenuItem(editingItem.id, payload);
                toast.success('Menu item updated');
            } else {
                await prasadamApi.createMenuItem(payload);
                toast.success('Menu item created');
            }
            closeDialog();
            fetchData();
        } catch (error) {
            toast.error('Failed to save menu item');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAvailability = async (item: PrasadamItem) => {
        try {
            await prasadamApi.toggleAvailability(item.id);
            toast.success(`Item ${item.isAvailable ? 'hidden' : 'shown'}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update availability');
        }
    };

    const handleDelete = async (item: PrasadamItem) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        try {
            await prasadamApi.deleteMenuItem(item.id);
            toast.success('Item deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setImagePreview('');
        setFormData({ ...formData, imageUrl: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage prasadam menu items with images</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No menu items yet</h3>
                            <p className="text-gray-500 mt-1">Add your first item to get started</p>
                            <Button onClick={openCreateDialog} className="mt-4 bg-[#5750F1] hover:bg-[#4a43d6]">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                {item.description && (
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{item.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.category?.name || 'Uncategorized'}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">₹{item.price}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.isAvailable ? 'default' : 'secondary'} className={item.isAvailable ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                                                {item.isAvailable ? 'Available' : 'Hidden'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleAvailability(item)}
                                                    title={item.isAvailable ? 'Hide' : 'Show'}
                                                >
                                                    {item.isAvailable ? (
                                                        <ToggleRight className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(item)}
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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? 'Update the menu item details and image.' : 'Add a new item to the prasadam menu.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <Label>Item Image</Label>
                            <div className="space-y-3">
                                {/* Image Preview */}
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => document.getElementById('menu-image-upload')?.click()}
                                        className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center cursor-pointer hover:border-[#5750F1] hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload image</p>
                                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB)</p>
                                    </div>
                                )}

                                {/* Hidden file input */}
                                <input
                                    id="menu-image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {/* Change image button when preview exists */}
                                {imagePreview && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('menu-image-upload')?.click()}
                                        className="w-full"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        Change Image
                                    </Button>
                                )}

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="flex items-center gap-2 text-sm text-[#5750F1]">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Uploading...</span>
                                    </div>
                                )}

                                {/* Upload Error */}
                                {uploadError && (
                                    <p className="text-sm text-red-500">{uploadError}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Masala Dosa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the item..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="100"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxQty">Max Quantity</Label>
                                <Input
                                    id="maxQty"
                                    type="number"
                                    value={formData.maxQuantityPerOrder}
                                    onChange={(e) => setFormData({ ...formData, maxQuantityPerOrder: e.target.value })}
                                    placeholder="10"
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || uploading} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                            {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
