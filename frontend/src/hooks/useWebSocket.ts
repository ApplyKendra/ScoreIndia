'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// Configuration constants
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const PING_INTERVAL = 25000; // 25 seconds

interface WebSocketMessage {
    event: string;
    data: any;
}

interface UseWebSocketOptions {
    /** Auth token for authenticated connections */
    token?: string | null;
    /** Use public endpoint (no auth required) */
    isPublic?: boolean;
    /** Called when a message is received */
    onMessage?: (event: string, data: any) => void;
    /** Called when connection opens */
    onOpen?: () => void;
    /** Called when connection closes */
    onClose?: () => void;
    /** Called when an error occurs */
    onError?: (error: Event) => void;
    /** Whether the hook should connect (default: true) */
    enabled?: boolean;
}

interface UseWebSocketReturn {
    /** Whether the WebSocket is currently connected */
    isConnected: boolean;
    /** Send a message through the WebSocket */
    sendMessage: (event: string, data?: any) => void;
    /** Manually reconnect (resets attempt counter) */
    reconnect: () => void;
}

/**
 * Production-ready WebSocket hook with:
 * - Connection deduplication (singleton per hook instance)
 * - Exponential backoff with jitter for reconnection
 * - Max reconnection attempts (circuit breaker)
 * - React Strict Mode resilience
 * - Proper cleanup handling
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
    const {
        token,
        isPublic = false,
        onMessage,
        onOpen,
        onClose,
        onError,
        enabled = true,
    } = options;

    // Core refs
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Connection state tracking to prevent duplicates
    const connectionIdRef = useRef(0);
    const connectionStateRef = useRef<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
    const reconnectAttempts = useRef(0);
    const mountedRef = useRef(true);

    const [isConnected, setIsConnected] = useState(false);

    // Stable callback refs to avoid dependency issues
    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);
    const onErrorRef = useRef(onError);

    // Update refs on each render
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;

    // Build WebSocket URL
    const getWsUrl = useCallback(() => {
        if (isPublic) {
            return `${WS_URL}/ws-public`;
        }
        if (token) {
            return `${WS_URL}/ws?token=${token}`;
        }
        // Fallback for cookie-based auth
        return `${WS_URL}/ws`;
    }, [isPublic, token]);

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    }, []);

    // Calculate reconnect delay with exponential backoff and jitter
    const getReconnectDelay = useCallback(() => {
        const baseDelay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
            MAX_RECONNECT_DELAY
        );
        // Add random jitter (0-1000ms) to prevent thundering herd
        const jitter = Math.random() * 1000;
        return baseDelay + jitter;
    }, []);

    // Send message function
    const sendMessage = useCallback((event: string, data?: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event, data }));
        }
    }, []);

    // Connect function with deduplication
    const connect = useCallback(() => {
        const wsUrl = getWsUrl();

        // Guard: Check if already connecting or connected
        if (connectionStateRef.current === 'connecting' || connectionStateRef.current === 'connected') {
            return;
        }

        // Guard: Check if enabled and URL is valid
        if (!enabled || !wsUrl) {
            return;
        }

        // Guard: Max reconnection attempts (circuit breaker)
        if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            console.warn('[WebSocket] Max reconnection attempts reached. Call reconnect() to retry.');
            connectionStateRef.current = 'disconnected';
            return;
        }

        // Increment connection ID for tracking
        const currentConnectionId = ++connectionIdRef.current;
        connectionStateRef.current = 'connecting';

        // Close any existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null; // Prevent triggering reconnect
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                // Verify this is still the current connection
                if (connectionIdRef.current !== currentConnectionId || !mountedRef.current) {
                    ws.close();
                    return;
                }

                connectionStateRef.current = 'connected';
                setIsConnected(true);
                reconnectAttempts.current = 0; // Reset on successful connection
                onOpenRef.current?.();

                // Start ping interval to keep connection alive
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ event: 'ping' }));
                    }
                }, PING_INTERVAL);
            };

            ws.onmessage = (event) => {
                // Verify this is still the current connection
                if (connectionIdRef.current !== currentConnectionId) return;

                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    // Ignore pong messages (heartbeat response)
                    if (message.event !== 'pong') {
                        onMessageRef.current?.(message.event, message.data);
                    }
                } catch {
                    // Silently ignore parse errors
                }
            };

            ws.onclose = (event) => {
                // Verify this is still the current connection
                if (connectionIdRef.current !== currentConnectionId) return;

                connectionStateRef.current = 'disconnected';
                setIsConnected(false);
                onCloseRef.current?.();

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Schedule reconnection with backoff (if still mounted and enabled)
                if (enabled && mountedRef.current) {
                    const delay = getReconnectDelay();
                    reconnectAttempts.current++;

                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (mountedRef.current) {
                            connect();
                        }
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                // Verify this is still the current connection
                if (connectionIdRef.current !== currentConnectionId) return;
                onErrorRef.current?.(error);
            };

        } catch {
            connectionStateRef.current = 'disconnected';
        }
    }, [getWsUrl, enabled, clearTimers, getReconnectDelay]);

    // Manual reconnect function (resets attempt counter)
    const reconnect = useCallback(() => {
        clearTimers();
        reconnectAttempts.current = 0;
        connectionStateRef.current = 'idle';

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }

        connect();
    }, [connect, clearTimers]);

    // Effect: Connect on mount, cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;

        // Small delay to handle React Strict Mode double-mount
        const initTimeout = setTimeout(() => {
            if (mountedRef.current) {
                connect();
            }
        }, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(initTimeout);
            clearTimers();

            // Clean close
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }

            connectionStateRef.current = 'idle';
        };
    }, [connect, clearTimers]);

    return {
        isConnected,
        sendMessage,
        reconnect,
    };
}

export default useWebSocket;
