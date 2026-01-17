import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        await this.connect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect() {
        const redisUrl = this.configService.get<string>('REDIS_URL');

        // Skip connection if no Redis URL is configured (development mode)
        if (!redisUrl && !this.configService.get<string>('REDIS_HOST')) {
            this.logger.log('⚠️ No Redis configuration found. Using in-memory fallback for OTP/session storage.');
            this.isConnected = false;
            this.client = null;
            return;
        }

        try {
            const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
            const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;
            const redisPassword = this.configService.get<string>('REDIS_PASSWORD') || '';
            const redisTls = this.configService.get<string>('REDIS_TLS') === 'true';

            // Use URL if provided (for cloud Redis like Upstash, Redis Cloud)
            if (redisUrl) {
                this.client = new Redis(redisUrl, {
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                    enableOfflineQueue: false,
                });
            } else {
                // Use individual config (for local/self-hosted Redis)
                this.client = new Redis({
                    host: redisHost,
                    port: redisPort,
                    password: redisPassword || undefined,
                    tls: redisTls ? {} : undefined,
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                    enableOfflineQueue: false,
                });
            }

            // Add error handler to prevent unhandled exceptions
            this.client.on('error', (err) => {
                if (this.isConnected) {
                    this.logger.warn(`Redis error: ${err.message}`);
                }
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                this.logger.log('✅ Redis connected successfully');
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error: any) {
            this.logger.warn(`⚠️ Redis connection failed: ${error.message}. Using in-memory fallback.`);
            this.isConnected = false;
            if (this.client) {
                this.client.disconnect();
            }
            this.client = null;
        }
    }

    private async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            this.logger.log('Redis disconnected');
        }
    }

    isAvailable(): boolean {
        return this.isConnected && this.client !== null;
    }

    // ============================================
    // OTP STORAGE METHODS
    // ============================================

    async setOtp(userId: string, type: string, otp: string, expirySeconds: number = 300): Promise<void> {
        const key = `otp:${userId}:${type}`;
        if (this.isAvailable()) {
            await this.client!.setex(key, expirySeconds, otp);
        }
    }

    async getOtp(userId: string, type: string): Promise<string | null> {
        const key = `otp:${userId}:${type}`;
        if (this.isAvailable()) {
            return await this.client!.get(key);
        }
        return null;
    }

    async deleteOtp(userId: string, type: string): Promise<void> {
        const key = `otp:${userId}:${type}`;
        if (this.isAvailable()) {
            await this.client!.del(key);
        }
    }

    /**
     * Atomic get-and-delete for OTP verification (prevents race conditions)
     * Uses Lua script to ensure atomicity - OTP can only be used once
     */
    async getAndDeleteOtp(userId: string, type: string): Promise<string | null> {
        const key = `otp:${userId}:${type}`;
        if (this.isAvailable()) {
            const luaScript = `
                local value = redis.call('GET', KEYS[1])
                if value then
                    redis.call('DEL', KEYS[1])
                end
                return value
            `;
            return await this.client!.eval(luaScript, 1, key) as string | null;
        }
        return null;
    }

    // ============================================
    // OTP RATE LIMITING METHODS
    // ============================================

    async getOtpAttempts(userId: string, type: string): Promise<number> {
        const key = `otp_attempts:${userId}:${type}`;
        if (this.isAvailable()) {
            const attempts = await this.client!.get(key);
            return attempts ? parseInt(attempts, 10) : 0;
        }
        return 0;
    }

    async incrementOtpAttempts(userId: string, type: string, expirySeconds: number = 300): Promise<number> {
        const key = `otp_attempts:${userId}:${type}`;
        if (this.isAvailable()) {
            const attempts = await this.client!.incr(key);
            if (attempts === 1) {
                await this.client!.expire(key, expirySeconds);
            }
            return attempts;
        }
        return 0;
    }

    async resetOtpAttempts(userId: string, type: string): Promise<void> {
        const key = `otp_attempts:${userId}:${type}`;
        if (this.isAvailable()) {
            await this.client!.del(key);
        }
    }

    // ============================================
    // SESSION TOKEN METHODS
    // ============================================

    async setSessionToken(userId: string, token: string, expirySeconds: number = 180): Promise<void> {
        const key = `session:${userId}`;
        if (this.isAvailable()) {
            await this.client!.setex(key, expirySeconds, token);
        }
    }

    async getSessionToken(userId: string): Promise<string | null> {
        const key = `session:${userId}`;
        if (this.isAvailable()) {
            return await this.client!.get(key);
        }
        return null;
    }

    async deleteSessionToken(userId: string): Promise<void> {
        const key = `session:${userId}`;
        if (this.isAvailable()) {
            await this.client!.del(key);
        }
    }

    // ============================================
    // REFRESH TOKEN METHODS (for multi-device logout)
    // ============================================

    async setRefreshToken(userId: string, deviceId: string, tokenHash: string, expirySeconds: number): Promise<void> {
        const key = `refresh:${userId}:${deviceId}`;
        if (this.isAvailable()) {
            await this.client!.setex(key, expirySeconds, tokenHash);
        }
    }

    async getRefreshToken(userId: string, deviceId: string): Promise<string | null> {
        const key = `refresh:${userId}:${deviceId}`;
        if (this.isAvailable()) {
            return await this.client!.get(key);
        }
        return null;
    }

    async deleteRefreshToken(userId: string, deviceId: string): Promise<void> {
        const key = `refresh:${userId}:${deviceId}`;
        if (this.isAvailable()) {
            await this.client!.del(key);
        }
    }

    async deleteAllRefreshTokens(userId: string): Promise<void> {
        if (this.isAvailable()) {
            const pattern = `refresh:${userId}:*`;
            const keys = await this.client!.keys(pattern);
            if (keys.length > 0) {
                await this.client!.del(...keys);
            }
        }
    }

    // ============================================
    // GENERIC METHODS
    // ============================================

    async set(key: string, value: string, expirySeconds?: number): Promise<void> {
        if (this.isAvailable()) {
            if (expirySeconds) {
                await this.client!.setex(key, expirySeconds, value);
            } else {
                await this.client!.set(key, value);
            }
        }
    }

    async get(key: string): Promise<string | null> {
        if (this.isAvailable()) {
            return await this.client!.get(key);
        }
        return null;
    }

    async del(key: string): Promise<void> {
        if (this.isAvailable()) {
            await this.client!.del(key);
        }
    }

    async ttl(key: string): Promise<number> {
        if (this.isAvailable()) {
            return await this.client!.ttl(key);
        }
        return -1;
    }
}
