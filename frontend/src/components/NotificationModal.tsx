'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationApi, Notification } from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'dismissed_notifications';

export function NotificationModal() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchAndShowNotifications = async (showAll = false) => {
        try {
            const data = await notificationApi.getActive();

            if (data.length === 0) {
                if (showAll) {
                    setNotifications([]);
                    setIsOpen(true);
                }
                return;
            }

            let notificationsToShow = data;

            if (!showAll) {
                let dismissedIds: string[] = [];
                try {
                    const stored = localStorage.getItem(DISMISSED_KEY);
                    if (stored) dismissedIds = JSON.parse(stored);
                } catch (e) {
                    localStorage.removeItem(DISMISSED_KEY);
                }
                notificationsToShow = data.filter((n) => !dismissedIds.includes(n.id));
            }

            if (notificationsToShow.length > 0) {
                // Sort by priority (desc) then date (desc)
                notificationsToShow.sort((a, b) => {
                    if (b.priority !== a.priority) return b.priority - a.priority;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setNotifications(notificationsToShow);
                setIsOpen(true);
            } else if (showAll) {
                // Show history
                setNotifications(data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchAndShowNotifications(false), 1000);

        const handleManualOpen = () => fetchAndShowNotifications(true);
        window.addEventListener('open-notifications', handleManualOpen);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('open-notifications', handleManualOpen);
        };
    }, []);

    const handleDismiss = (id: string) => {
        try {
            const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
            if (!dismissed.includes(id)) {
                dismissed.push(id);
                localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
            }
        } catch (e) {
            localStorage.setItem(DISMISSED_KEY, JSON.stringify([id]));
        }

        // Remove from local state immediately for better UX
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);

        if (updated.length === 0) {
            setIsOpen(false);
        }
    };

    const handleDismissAll = () => {
        const allIds = notifications.map((n) => n.id);
        try {
            const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
            const uniqueIds = Array.from(new Set([...dismissed, ...allIds]));
            localStorage.setItem(DISMISSED_KEY, JSON.stringify(uniqueIds));
        } catch (e) {
            localStorage.setItem(DISMISSED_KEY, JSON.stringify(allIds));
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    // Empty State
    if (notifications.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
                <div className="relative w-full max-w-sm overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 p-8 text-center">
                    <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                        You're all caught up! Check back later for new announcements.
                    </p>
                    <Button
                        onClick={() => setIsOpen(false)}
                        className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal Card - Width adapted for list */}
            <div className="relative w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5750F1]/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#5750F1]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Announcements</h3>
                            <p className="text-xs text-gray-500">{notifications.length} new update{notifications.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* List Content */}
                <div className="overflow-y-auto p-4 space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="group relative p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#5750F1]/30 dark:hover:border-[#5750F1]/30 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {notification.priority > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                                Important
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5">
                                        {notification.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {notification.message}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDismiss(notification.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                    title="Mark as read"
                                >
                                    <Check className="w-4 h-4 text-[#5750F1]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
                    <Button
                        onClick={handleDismissAll}
                        variant="ghost"
                        className="w-full text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                        Mark all as read
                    </Button>
                </div>
            </div>
        </div>
    );
}
