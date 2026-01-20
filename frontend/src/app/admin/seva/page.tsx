'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Image as ImageIcon, Users, Settings, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SevaOpportunity {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    amount: number | null;
    isRecurring: boolean;
    category: string;
    displayOrder: number;
    isActive: boolean;
}

interface SevaRegistration {
    id: string;
    sevaId: string;
    seva: { id: string; title: string; category: string };
    user: { id: string; name: string; email: string } | null;
    name: string;
    email: string;
    phone: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

const CATEGORIES = ['Daily', 'Festival', 'Special', 'Monthly', 'Annual'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminSevaPage() {
    const [activeTab, setActiveTab] = useState<'manage' | 'registrations'>('manage');

    // Manage Sevas state
    const [items, setItems] = useState<SevaOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SevaOpportunity | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        amount: '',
        isRecurring: false,
        category: 'Daily',
        displayOrder: 0,
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Registrations state
    const [registrations, setRegistrations] = useState<SevaRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sevaFilter, setSevaFilter] = useState<string>('');

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (activeTab === 'registrations') {
            fetchRegistrations();
        }
    }, [activeTab, statusFilter, sevaFilter]);

    const fetchItems = async () => {
        try {
            const res = await fetch(`${API_URL}/pages/seva?includeInactive=true`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        setRegistrationsLoading(true);
        try {
            let url = `${API_URL}/pages/seva/registrations`;
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (sevaFilter) params.append('sevaId', sevaFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data);
            }
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
        } finally {
            setRegistrationsLoading(false);
        }
    };

    const updateRegistrationStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`${API_URL}/pages/seva/registrations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                fetchRegistrations();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!selectedFile) return formData.imageUrl;
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', selectedFile);
            const res = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                credentials: 'include',
                body: formDataUpload,
            });
            if (res.ok) {
                const data = await res.json();
                return data.imageUrl;
            }
            return null;
        } catch (error) {
            console.error('Upload failed:', error);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const openModal = (item?: SevaOpportunity) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl || '',
                amount: item.amount ? String(item.amount) : '',
                isRecurring: item.isRecurring,
                category: item.category || 'Daily',
                displayOrder: item.displayOrder,
                isActive: item.isActive,
            });
            setImagePreview(item.imageUrl || '');
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                description: '',
                imageUrl: '',
                amount: '',
                isRecurring: false,
                category: 'Daily',
                displayOrder: items.length,
                isActive: true,
            });
            setImagePreview('');
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setSelectedFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageUrl = formData.imageUrl;
        if (selectedFile) {
            const uploadedUrl = await uploadImage();
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        try {
            const url = editingItem
                ? `${API_URL}/pages/seva/${editingItem.id}`
                : `${API_URL}/pages/seva`;

            const res = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    imageUrl,
                    amount: formData.amount ? Number(formData.amount) : null,
                }),
            });

            if (res.ok) {
                await fetchItems();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this seva opportunity?')) return;
        try {
            const res = await fetch(`${API_URL}/pages/seva/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) await fetchItems();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const toggleActive = async (item: SevaOpportunity) => {
        try {
            const res = await fetch(`${API_URL}/pages/seva/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ isActive: !item.isActive }),
            });
            if (res.ok) await fetchItems();
        } catch (error) {
            console.error('Failed to toggle:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seva Opportunities</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage sevas and view registrations</p>
                </div>
                {activeTab === 'manage' && (
                    <Button onClick={() => openModal()} className="bg-[#5750F1] hover:bg-[#4a43d6]">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Seva
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'manage'
                            ? 'border-[#5750F1] text-[#5750F1]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Settings className="h-4 w-4" />
                    Manage Sevas
                </button>
                <button
                    onClick={() => setActiveTab('registrations')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'registrations'
                            ? 'border-[#5750F1] text-[#5750F1]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Registrations
                </button>
            </div>

            {/* Manage Sevas Tab */}
            {activeTab === 'manage' && (
                <div className="grid gap-4">
                    {items.length === 0 ? (
                        <Card className="p-12 text-center">
                            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No seva opportunities yet</h3>
                            <p className="text-gray-500 mt-1">Add your first seva option</p>
                            <Button onClick={() => openModal()} className="mt-4 bg-[#5750F1] hover:bg-[#4a43d6]">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Seva
                            </Button>
                        </Card>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className={`p-4 ${!item.isActive ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-white/60" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                            <span className="text-xs px-2 py-0.5 bg-[#5750F1]/10 text-[#5750F1] rounded-full">
                                                {item.category}
                                            </span>
                                            {item.isRecurring && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                                                    Recurring
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                                        {item.amount && (
                                            <p className="text-sm font-medium text-[#5750F1] mt-1">₹{item.amount.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleActive(item)}
                                            className={item.isActive ? 'text-green-500' : 'text-gray-400'}
                                        >
                                            {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openModal(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card className="p-4">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Filter by Seva</label>
                                <select
                                    value={sevaFilter}
                                    onChange={(e) => setSevaFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-w-[200px]"
                                >
                                    <option value="">All Sevas</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>{item.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Filter by Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-w-[150px]"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Registrations Table */}
                    {registrationsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5750F1]"></div>
                        </div>
                    ) : registrations.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No registrations yet</h3>
                            <p className="text-gray-500 mt-1">Registrations will appear here when users sign up for sevas</p>
                        </Card>
                    ) : (
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                        <tr>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Name</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Email</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Phone</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Seva</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Date</th>
                                            <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {registrations.map((reg) => (
                                            <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{reg.name}</div>
                                                    {reg.user && <span className="text-xs text-[#5750F1]">Registered User</span>}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{reg.email}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{reg.phone}</td>
                                                <td className="p-4">
                                                    <span className="text-gray-900 dark:text-white">{reg.seva.title}</span>
                                                    <span className="block text-xs text-gray-500">{reg.seva.category}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[reg.status]}`}>
                                                        {reg.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">
                                                    {formatDate(reg.createdAt)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-1">
                                                        {reg.status === 'PENDING' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-blue-500 hover:text-blue-600"
                                                                onClick={() => updateRegistrationStatus(reg.id, 'CONFIRMED')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {reg.status === 'CONFIRMED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-green-500 hover:text-green-600"
                                                                onClick={() => updateRegistrationStatus(reg.id, 'COMPLETED')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {reg.status !== 'CANCELLED' && reg.status !== 'COMPLETED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-500 hover:text-red-600"
                                                                onClick={() => updateRegistrationStatus(reg.id, 'CANCELLED')}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Seva' : 'Add New Seva'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="e.g., Annadaan Seva"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="Describe the seva opportunity..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <div className="space-y-2">
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" className="h-24 w-36 object-cover rounded-lg" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="text-sm"
                                    />
                                    {uploading && <span className="text-sm text-[#5750F1]">Uploading...</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                        placeholder="1100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="h-4 w-4 text-[#5750F1] rounded"
                                    />
                                    <span className="text-sm">Recurring donation</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-4 w-4 text-[#5750F1] rounded"
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-[#5750F1] hover:bg-[#4a43d6]">
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingItem ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
