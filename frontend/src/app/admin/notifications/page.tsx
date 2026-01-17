'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Bell,
    CheckCircle2,
    XCircle,
    ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { notificationApi, Notification } from '@/lib/api/notifications';

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        isActive: true,
        priority: 0,
    });

    const fetchNotifications = async () => {
        try {
            const data = await notificationApi.getAll();
            setNotifications(data);
        } catch (error) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const openCreateDialog = () => {
        setEditingNotification(null);
        setFormData({
            title: '',
            message: '',
            isActive: true,
            priority: 0,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (notification: Notification) => {
        setEditingNotification(notification);
        setFormData({
            title: notification.title,
            message: notification.message,
            isActive: notification.isActive,
            priority: notification.priority,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            if (editingNotification) {
                await notificationApi.update(editingNotification.id, formData);
                toast.success('Notification updated successfully');
            } else {
                await notificationApi.create(formData);
                toast.success('Notification created successfully');
            }
            setIsDialogOpen(false);
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to save notification');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await notificationApi.delete(deletingId);
            toast.success('Notification deleted successfully');
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleToggleActive = async (notification: Notification) => {
        try {
            await notificationApi.update(notification.id, {
                isActive: !notification.isActive,
            });
            toast.success(
                notification.isActive ? 'Notification deactivated' : 'Notification activated'
            );
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to update notification');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage site-wide announcements and notifications
                    </p>
                </div>
                <Button
                    onClick={openCreateDialog}
                    className="bg-[#5750F1] hover:bg-[#4a43d6]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Notification
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#5750F1]/10 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-[#5750F1]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{notifications.length}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {notifications.filter((n) => n.isActive).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {notifications.filter((n) => !n.isActive).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Inactive</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>
                                <span className="flex items-center gap-1">
                                    Priority
                                    <ArrowUpDown className="h-3 w-3" />
                                </span>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="text-muted-foreground">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No notifications yet</p>
                                        <p className="text-sm">Create your first notification to get started</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            notifications.map((notification) => (
                                <TableRow key={notification.id}>
                                    <TableCell className="font-medium max-w-[200px] truncate">
                                        {notification.title}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {notification.message}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{notification.priority}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={notification.isActive}
                                            onCheckedChange={() => handleToggleActive(notification)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(notification)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setDeletingId(notification.id);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingNotification ? 'Edit Notification' : 'Create Notification'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingNotification
                                ? 'Update the notification details below'
                                : 'Fill in the details to create a new notification'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter notification title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter notification message"
                                rows={4}
                                value={formData.message}
                                onChange={(e) =>
                                    setFormData({ ...formData, message: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={formData.priority}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            priority: parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Higher values = more important
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Active</Label>
                                <div className="flex items-center gap-2 pt-2">
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isActive: checked })
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {formData.isActive ? 'Visible to users' : 'Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-[#5750F1] hover:bg-[#4a43d6]"
                        >
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingNotification ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Notification</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this notification? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
