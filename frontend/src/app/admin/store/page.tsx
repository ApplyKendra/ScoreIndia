'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, Image as ImageIcon, X, Save, LayoutGrid, LayoutList, Package } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storeApi, StoreItem, StoreCategory } from '@/lib/api/store';

interface StoreItemFormData {
    name: string;
    description: string;
    displayPrice: string;
    categoryId: string;
    author: string;
    language: string;
    material: string;
    isFeatured: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminStorePage() {
    const [items, setItems] = useState<StoreItem[]>([]);
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [formData, setFormData] = useState<StoreItemFormData>({
        name: '',
        description: '',
        displayPrice: '',
        categoryId: '',
        author: '',
        language: '',
        material: '',
        isFeatured: false,
    });
    const [saving, setSaving] = useState(false);

    // Image upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [storeItems, cats] = await Promise.all([
                storeApi.getItems(),
                storeApi.getCategories(),
            ]);
            setItems(storeItems);
            setCategories(cats);
        } catch (error) {
            toast.error('Failed to load store items');
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
        if (!selectedFile) return currentImageUrl || null;

        setUploading(true);
        setUploadError('');

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', selectedFile);

            const res = await fetch(`${API_URL}/upload/image`, {
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

    const clearImage = () => {
        setSelectedFile(null);
        setImagePreview('');
        setCurrentImageUrl('');
    };

    const openCreateDialog = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            displayPrice: '',
            categoryId: categories[0]?.id || '',
            author: '',
            language: '',
            material: '',
            isFeatured: false,
        });
        setSelectedFile(null);
        setImagePreview('');
        setCurrentImageUrl('');
        setUploadError('');
        setDialogOpen(true);
    };

    const openEditDialog = (item: StoreItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            displayPrice: item.displayPrice ? String(item.displayPrice) : '',
            categoryId: item.categoryId,
            author: item.author || '',
            language: item.language || '',
            material: item.material || '',
            isFeatured: item.isFeatured,
        });
        setSelectedFile(null);
        setImagePreview(item.imageUrl || '');
        setCurrentImageUrl(item.imageUrl || '');
        setUploadError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.description || !formData.categoryId) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            // Upload image if selected
            let imageUrl = currentImageUrl;
            if (selectedFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else if (!currentImageUrl) {
                    // Upload failed and no existing image
                    setSaving(false);
                    return;
                }
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                displayPrice: formData.displayPrice ? parseFloat(formData.displayPrice) : undefined,
                categoryId: formData.categoryId,
                author: formData.author || undefined,
                language: formData.language || undefined,
                material: formData.material || undefined,
                isFeatured: formData.isFeatured,
                imageUrl: imageUrl || undefined,
            };

            if (editingItem) {
                await storeApi.updateItem(editingItem.id, payload);
                toast.success('Store item updated');
            } else {
                await storeApi.createItem(payload);
                toast.success('Store item created');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save store item');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStock = async (item: StoreItem) => {
        try {
            await storeApi.toggleStock(item.id);
            toast.success(`Item marked ${item.inStock ? 'out of stock' : 'in stock'}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update stock status');
        }
    };

    const handleDelete = async (item: StoreItem) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        try {
            await storeApi.deleteItem(item.id);
            toast.success('Item deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Store Management</h1>
                    <p className="text-muted-foreground">Manage temple store catalog with images</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="h-8 px-3"
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-8 px-3"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={openCreateDialog} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{items.length}</p>
                            <p className="text-xs text-muted-foreground">Total Items</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <ToggleRight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{items.filter(i => i.inStock).length}</p>
                            <p className="text-xs text-muted-foreground">In Stock</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{items.filter(i => i.isFeatured).length}</p>
                            <p className="text-xs text-muted-foreground">Featured</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{items.filter(i => i.imageUrl).length}</p>
                            <p className="text-xs text-muted-foreground">With Images</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-muted-foreground mb-4">No store items yet. Add your first item!</p>
                            <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    ) : viewMode === 'table' ? (
                        /* Table View */
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="hidden md:table-cell">Status</TableHead>
                                        <TableHead className="hidden md:table-cell">Featured</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 overflow-hidden flex items-center justify-center">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-amber-400" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                                    {item.author && <p className="text-xs text-muted-foreground">by {item.author}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    {item.category?.name || 'Uncategorized'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {item.displayPrice ? `₹${item.displayPrice}` : '-'}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant={item.inStock ? 'default' : 'secondary'} className={item.inStock ? 'bg-green-100 text-green-700' : ''}>
                                                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {item.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleStock(item)}
                                                        title={item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                                                    >
                                                        {item.inStock ? (
                                                            <ToggleRight className="h-4 w-4 text-green-600" />
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
                                                        className="text-red-500"
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
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((item) => (
                                <Card key={item.id} className={`overflow-hidden ${!item.inStock ? 'opacity-60' : ''}`}>
                                    <div className="relative h-40 bg-gradient-to-br from-amber-50 to-orange-50">
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="w-12 h-12 text-amber-300" />
                                            </div>
                                        )}
                                        {item.isFeatured && (
                                            <Badge className="absolute top-2 left-2 bg-yellow-500">
                                                <Star className="w-3 h-3 mr-1 fill-white" />
                                                Featured
                                            </Badge>
                                        )}
                                        {!item.inStock && (
                                            <Badge className="absolute top-2 right-2 bg-red-500">
                                                Out of Stock
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {item.category?.name} {item.author && `• ${item.author}`}
                                        </p>
                                        <p className="text-lg font-bold text-amber-600 mt-2">
                                            {item.displayPrice ? `₹${item.displayPrice}` : 'Contact'}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => handleDelete(item)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Store Item' : 'Add Store Item'}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? 'Update the store item details and image.' : 'Add a new item to the temple store with an image.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Item Details</TabsTrigger>
                            <TabsTrigger value="image">Image Upload</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Bhagavad Gita As It Is"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed description of the item..."
                                    className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Reference Price (₹)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.displayPrice}
                                        onChange={(e) => setFormData({ ...formData, displayPrice: e.target.value })}
                                        placeholder="350"
                                    />
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="author">Author (for books)</Label>
                                    <Input
                                        id="author"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        placeholder="Srila Prabhupada"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Input
                                        id="language"
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        placeholder="English"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="material">Material (for artifacts)</Label>
                                <Input
                                    id="material"
                                    value={formData.material}
                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    placeholder="e.g., Brass, Wood, Silver"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="h-4 w-4 text-amber-600 rounded"
                                />
                                <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">
                                    Mark as Featured (shows on homepage)
                                </label>
                            </div>
                        </TabsContent>

                        <TabsContent value="image" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                {/* Current/Preview Image */}
                                {(imagePreview || currentImageUrl) && (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-amber-50">
                                        <Image
                                            src={imagePreview || currentImageUrl}
                                            alt="Preview"
                                            fill
                                            className="object-contain"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={clearImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* File Input */}
                                <div className="space-y-3">
                                    <Label>Upload Image</Label>
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
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                {selectedFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Uploading...</span>
                                    </div>
                                )}

                                {/* Upload Error */}
                                {uploadError && (
                                    <p className="text-sm text-red-500">{uploadError}</p>
                                )}

                                <p className="text-xs text-gray-500">
                                    Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
                                    <br />
                                    Recommended: Square images (1:1 ratio) for best display.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || uploading}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            <Save className="h-4 w-4 mr-2" />
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
