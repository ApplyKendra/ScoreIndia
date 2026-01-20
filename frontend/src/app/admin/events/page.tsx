'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Users as UsersIcon, Calendar, MapPin, Star, Image as ImageIcon, X, Save, LayoutGrid, LayoutList, Sparkles } from 'lucide-react';
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
import { youthApi, YouthEvent } from '@/lib/api/youth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EventFormData {
    title: string;
    description: string;
    date: string;
    location: string;
    venue: string;
    maxParticipants: string;
    registrationFee: string;
    isFeatured: boolean;
    preJoinedCount: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    UPCOMING: { bg: 'bg-blue-100', text: 'text-blue-800' },
    ONGOING: { bg: 'bg-green-100', text: 'text-green-800' },
    COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function AdminEventsPage() {
    const [events, setEvents] = useState<YouthEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<YouthEvent | null>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [editingEvent, setEditingEvent] = useState<YouthEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        date: '',
        location: '',
        venue: '',
        maxParticipants: '',
        registrationFee: '',
        isFeatured: false,
        preJoinedCount: '',
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
            const data = await youthApi.getEvents();
            setEvents(data);
        } catch (error) {
            toast.error('Failed to load events');
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
        setEditingEvent(null);
        setFormData({
            title: '',
            description: '',
            date: '',
            location: '',
            venue: '',
            maxParticipants: '',
            registrationFee: '',
            isFeatured: false,
            preJoinedCount: '',
        });
        setSelectedFile(null);
        setImagePreview('');
        setCurrentImageUrl('');
        setUploadError('');
        setDialogOpen(true);
    };

    const openEditDialog = (event: YouthEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            date: event.date.split('T')[0],
            location: event.location,
            venue: event.venue || '',
            maxParticipants: event.maxParticipants ? String(event.maxParticipants) : '',
            registrationFee: event.registrationFee ? String(event.registrationFee) : '',
            isFeatured: event.isFeatured,
            preJoinedCount: event.preJoinedCount ? String(event.preJoinedCount) : '',
        });
        setSelectedFile(null);
        setImagePreview(event.imageUrl || '');
        setCurrentImageUrl(event.imageUrl || '');
        setUploadError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description || !formData.date || !formData.location) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = currentImageUrl;
            if (selectedFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const payload = {
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date).toISOString(),
                location: formData.location,
                venue: formData.venue || undefined,
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
                registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
                isFeatured: formData.isFeatured,
                preJoinedCount: formData.preJoinedCount ? parseInt(formData.preJoinedCount) : 0,
                imageUrl: imageUrl || undefined,
            };

            if (editingEvent) {
                await youthApi.updateEvent(editingEvent.id, payload);
                toast.success('Event updated');
            } else {
                await youthApi.createEvent(payload);
                toast.success('Event created');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (event: YouthEvent, status: YouthEvent['status']) => {
        try {
            await youthApi.updateEventStatus(event.id, status);
            toast.success(`Event status updated to ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (event: YouthEvent) => {
        if (!confirm(`Delete "${event.title}"?`)) return;
        try {
            await youthApi.deleteEvent(event.id);
            toast.success('Event deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const viewRegistrations = async (event: YouthEvent) => {
        setSelectedEvent(event);
        try {
            const regs = await youthApi.getEventRegistrations(event.id);
            setRegistrations(regs);
            setRegistrationsDialogOpen(true);
        } catch (error) {
            toast.error('Failed to load registrations');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Stats
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.status === 'UPCOMING').length;
    const totalRegistrations = events.reduce((sum, e) => sum + (e._count?.registrations || 0), 0);
    const featuredEvents = events.filter(e => e.isFeatured).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Upcoming Events</h1>
                    <p className="text-muted-foreground">Manage events shown on the public Events page</p>
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
                    <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalEvents}</p>
                            <p className="text-xs text-muted-foreground">Total Events</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{upcomingEvents}</p>
                            <p className="text-xs text-muted-foreground">Upcoming</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalRegistrations}</p>
                            <p className="text-xs text-muted-foreground">Registrations</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{featuredEvents}</p>
                            <p className="text-xs text-muted-foreground">Featured</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Registrations Overview Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-purple-600" />
                            <h2 className="text-lg font-semibold">All Registrations by Event</h2>
                        </div>
                        <span className="text-sm text-muted-foreground">{totalRegistrations} total registrations</span>
                    </div>

                    {events.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">No events to show registrations for</p>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div key={event.id} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => viewRegistrations(event)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground">{formatDate(event.date)} • {event.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={event._count?.registrations ? 'default' : 'secondary'} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                <UsersIcon className="w-3 h-3 mr-1" />
                                                {event._count?.registrations || 0} {event._count?.registrations === 1 ? 'person' : 'people'}
                                            </Badge>
                                            <span className="text-muted-foreground text-sm">Click to view →</span>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-muted-foreground mb-4">No events yet. Create your first event!</p>
                            <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Image</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="hidden sm:table-cell">Location</TableHead>
                                        <TableHead>Registrations</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center">
                                                    {event.imageUrl ? (
                                                        <Image
                                                            src={event.imageUrl}
                                                            alt={event.title}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <Calendar className="w-5 h-5 text-emerald-400" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {event.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                    <span className="font-medium">{event.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(event.date)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {event.location}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" onClick={() => viewRegistrations(event)}>
                                                    <UsersIcon className="h-4 w-4 mr-1" />
                                                    {event._count?.registrations || 0}
                                                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={event.status}
                                                    onValueChange={(value) => handleStatusChange(event, value as YouthEvent['status'])}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <Badge className={`${statusColors[event.status].bg} ${statusColors[event.status].text}`}>
                                                            {event.status}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="UPCOMING">Upcoming</SelectItem>
                                                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => viewRegistrations(event)}
                                                        title="View Registrations"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        <UsersIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(event)}
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
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event) => (
                                <Card key={event.id} className="overflow-hidden">
                                    <div className="relative h-36 bg-gradient-to-br from-emerald-100 to-teal-100">
                                        {event.imageUrl ? (
                                            <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-emerald-300" />
                                            </div>
                                        )}
                                        {event.isFeatured && (
                                            <Badge className="absolute top-2 left-2 bg-yellow-500">
                                                <Star className="w-3 h-3 mr-1 fill-white" />Featured
                                            </Badge>
                                        )}
                                        <Badge className={`absolute top-2 right-2 ${statusColors[event.status].bg} ${statusColors[event.status].text}`}>
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{formatDate(event.date)} • {event.location}</p>
                                        <button
                                            onClick={() => viewRegistrations(event)}
                                            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 hover:underline mb-3"
                                        >
                                            <UsersIcon className="w-4 h-4" />
                                            {event._count?.registrations || 0} registered
                                        </button>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                onClick={() => viewRegistrations(event)}
                                            >
                                                <UsersIcon className="h-3 w-3 mr-1" />View
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(event)}>
                                                <Pencil className="h-3 w-3 mr-1" />Edit
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(event)}>
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
                        <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
                        <DialogDescription>
                            {editingEvent ? 'Update the event details and image.' : 'Create a new event to display on the public Events page.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Event Details</TabsTrigger>
                            <TabsTrigger value="image">Event Image</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Sunday Youth Retreat"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed description of the event..."
                                    className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Temple Hall"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxParticipants">Max Participants</Label>
                                    <Input
                                        id="maxParticipants"
                                        type="number"
                                        value={formData.maxParticipants}
                                        onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                        placeholder="50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
                                    <Input
                                        id="registrationFee"
                                        type="number"
                                        value={formData.registrationFee}
                                        onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                                        placeholder="0 for free"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preJoinedCount">Pre-joined Count (for display)</Label>
                                <Input
                                    id="preJoinedCount"
                                    type="number"
                                    value={formData.preJoinedCount}
                                    onChange={(e) => setFormData({ ...formData, preJoinedCount: e.target.value })}
                                    placeholder="e.g., 100 (shows as already joined)"
                                />
                                <p className="text-xs text-gray-500">Initial count to display as &quot;already joined&quot; before real registrations</p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="h-4 w-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">
                                    Mark as Featured (shows prominently on events page)
                                </label>
                            </div>
                        </TabsContent>

                        <TabsContent value="image" className="space-y-4 mt-4">
                            {(imagePreview || currentImageUrl) && (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-emerald-50">
                                    <Image src={imagePreview || currentImageUrl} alt="Preview" fill className="object-contain" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={clearImage}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-3">
                                <Label>Upload Image</Label>
                                <div className="flex items-center gap-3">
                                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()} className="flex-1">
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        {selectedFile ? 'Change Image' : 'Choose Image'}
                                    </Button>
                                    {selectedFile && <span className="text-sm text-gray-600 truncate max-w-[150px]">{selectedFile.name}</span>}
                                </div>
                            </div>
                            {uploading && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Uploading...</span>
                                </div>
                            )}
                            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                            <p className="text-xs text-gray-500">Supported: JPEG, PNG, WebP. Max: 5MB. Recommended: 16:9 ratio.</p>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || uploading} className="bg-emerald-600 hover:bg-emerald-700">
                            {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            <Save className="h-4 w-4 mr-2" />
                            {editingEvent ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Registrations Dialog */}
            <Dialog open={registrationsDialogOpen} onOpenChange={setRegistrationsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registrations for {selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        {registrations.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No registrations yet</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.map((reg) => (
                                        <TableRow key={reg.id}>
                                            <TableCell>{reg.user?.name || reg.guestName || '-'}</TableCell>
                                            <TableCell>{reg.user?.email || reg.guestEmail || '-'}</TableCell>
                                            <TableCell>{reg.phone || reg.user?.phone || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={reg.userId ? 'default' : 'outline'}>
                                                    {reg.userId ? 'Member' : 'Guest'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={reg.isConfirmed ? 'default' : 'secondary'}>
                                                    {reg.isConfirmed ? 'Confirmed' : 'Pending'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
