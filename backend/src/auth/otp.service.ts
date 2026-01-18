import { Injectable, Logger, BadRequestException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis';
import * as crypto from 'crypto';

type OtpType = 'login' | 'password_change' | 'password_verified';

interface OtpEntry {
    otp: string;
    expiresAt: Date;
    type: OtpType;
}

// OTP rate limiting constants
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const MAX_OTP_VERIFICATION_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class OtpService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OtpService.name);

    // In-memory OTP storage (fallback when Redis unavailable)
    private otpStore = new Map<string, OtpEntry>();
    private otpRequestCounts = new Map<string, { count: number; resetAt: Date }>();
    private otpAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

    // Cleanup interval for in-memory store
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // Run cleanup every 60 seconds

    // OTP expiry in milliseconds (5 minutes)
    private readonly OTP_EXPIRY_MS = 5 * 60 * 1000;

    // Password verified session expiry (3 minutes)
    private readonly PASSWORD_VERIFIED_EXPIRY_MS = 3 * 60 * 1000;

    constructor(private redisService: RedisService) { }

    /**
     * LIFECYCLE: Start scheduled cleanup on module init
     */
    onModuleInit() {
        this.logger.log('Starting OTP cleanup scheduler (every 60s)');
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredOtps();
            this.cleanupExpiredRateLimits();
        }, this.CLEANUP_INTERVAL_MS);
    }

    /**
     * LIFECYCLE: Stop scheduled cleanup on module destroy
     */
    onModuleDestroy() {
        if (this.cleanupInterval) {
            this.logger.log('Stopping OTP cleanup scheduler');
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Generate a 6-digit numeric OTP
     */
    generateOtp(): string {
        const buffer = crypto.randomBytes(4);
        const number = buffer.readUInt32BE(0) % 1000000;
        return number.toString().padStart(6, '0');
    }

    /**
     * Generate a secure token
     */
    generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Check if user can request another OTP (rate limiting)
     */
    async canRequestOtp(userId: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
        const key = `otp_rate:${userId}`;

        if (this.redisService.isAvailable()) {
            const attempts = await this.redisService.getOtpAttempts(userId, 'request');
            if (attempts >= MAX_OTP_REQUESTS_PER_HOUR) {
                const ttl = await this.redisService.ttl(`otp_attempts:${userId}:request`);
                return { allowed: false, waitSeconds: ttl > 0 ? ttl : 3600 };
            }
            return { allowed: true };
        }

        // Fallback to in-memory
        const entry = this.otpRequestCounts.get(userId);
        const now = new Date();

        if (entry && entry.resetAt > now) {
            if (entry.count >= MAX_OTP_REQUESTS_PER_HOUR) {
                const waitSeconds = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
                return { allowed: false, waitSeconds };
            }
        }

        return { allowed: true };
    }

    /**
     * Record OTP request for rate limiting
     */
    async recordOtpRequest(userId: string): Promise<void> {
        if (this.redisService.isAvailable()) {
            await this.redisService.incrementOtpAttempts(userId, 'request', 3600); // 1 hour TTL
            return;
        }

        // Fallback to in-memory
        const entry = this.otpRequestCounts.get(userId);
        const now = new Date();
        const resetAt = new Date(Date.now() + 3600000); // 1 hour

        if (entry && entry.resetAt > now) {
            entry.count++;
        } else {
            this.otpRequestCounts.set(userId, { count: 1, resetAt });
        }
    }

    /**
     * Check if OTP verification is locked (too many failed attempts)
     */
    async isVerificationLocked(userId: string, type: OtpType): Promise<{ locked: boolean; waitSeconds?: number }> {
        const key = `otp_locked:${userId}:${type}`;

        if (this.redisService.isAvailable()) {
            const attempts = await this.redisService.getOtpAttempts(userId, `verify_${type}`);
            if (attempts >= MAX_OTP_VERIFICATION_ATTEMPTS) {
                const ttl = await this.redisService.ttl(`otp_attempts:${userId}:verify_${type}`);
                return { locked: true, waitSeconds: ttl > 0 ? ttl : LOCKOUT_DURATION_MS / 1000 };
            }
            return { locked: false };
        }

        // Fallback to in-memory
        const entry = this.otpAttempts.get(`${userId}:${type}`);
        const now = new Date();

        if (entry?.lockedUntil && entry.lockedUntil > now) {
            const waitSeconds = Math.ceil((entry.lockedUntil.getTime() - now.getTime()) / 1000);
            return { locked: true, waitSeconds };
        }

        return { locked: false };
    }

    /**
     * Record failed OTP verification attempt
     */
    async recordFailedAttempt(userId: string, type: OtpType): Promise<void> {
        if (this.redisService.isAvailable()) {
            await this.redisService.incrementOtpAttempts(userId, `verify_${type}`, LOCKOUT_DURATION_MS / 1000);
            return;
        }

        // Fallback to in-memory
        const key = `${userId}:${type}`;
        const entry = this.otpAttempts.get(key) || { count: 0 };
        entry.count++;

        if (entry.count >= MAX_OTP_VERIFICATION_ATTEMPTS) {
            entry.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            this.logger.warn(`OTP verification locked for user ${userId}, type: ${type}`);
        }

        this.otpAttempts.set(key, entry);
    }

    /**
     * Reset failed attempts after successful verification
     */
    async resetFailedAttempts(userId: string, type: OtpType): Promise<void> {
        if (this.redisService.isAvailable()) {
            await this.redisService.resetOtpAttempts(userId, `verify_${type}`);
            return;
        }

        // Fallback to in-memory
        this.otpAttempts.delete(`${userId}:${type}`);
    }

    /**
     * Save OTP for a user
     */
    async saveOtp(userId: string, type: OtpType): Promise<string> {
        // Check rate limit
        const rateCheck = await this.canRequestOtp(userId);
        if (!rateCheck.allowed) {
            throw new BadRequestException(`Too many OTP requests. Please wait ${rateCheck.waitSeconds} seconds.`);
        }

        const otp = this.generateOtp();
        const expiry = type === 'password_verified' ? this.PASSWORD_VERIFIED_EXPIRY_MS : this.OTP_EXPIRY_MS;
        const expiresAt = new Date(Date.now() + expiry);

        // Record the OTP request for rate limiting
        await this.recordOtpRequest(userId);

        // Store in Redis if available
        if (this.redisService.isAvailable()) {
            await this.redisService.setOtp(userId, type, otp, expiry / 1000);
        } else {
            // Fallback to in-memory
            const key = `${userId}:${type}`;
            this.otpStore.set(key, { otp, expiresAt, type });
        }

        this.logger.log(`OTP generated for user ${userId}, type: ${type}`);
        this.cleanupExpiredOtps();

        return otp;
    }

    /**
     * Save a verification token (for password change window)
     */
    async saveVerificationToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + this.PASSWORD_VERIFIED_EXPIRY_MS);

        if (this.redisService.isAvailable()) {
            await this.redisService.setSessionToken(userId, token, this.PASSWORD_VERIFIED_EXPIRY_MS / 1000);
        } else {
            const key = `${userId}:password_verified`;
            this.otpStore.set(key, { otp: token, expiresAt, type: 'password_verified' });
        }

        this.logger.log(`Verification token generated for user ${userId}`);
        return { token, expiresAt };
    }

    /**
     * Verify a verification token
     */
    async verifyToken(userId: string, token: string): Promise<boolean> {
        if (this.redisService.isAvailable()) {
            const storedToken = await this.redisService.getSessionToken(userId);
            return storedToken === token;
        }

        // Fallback to in-memory
        const key = `${userId}:password_verified`;
        const entry = this.otpStore.get(key);

        if (!entry || entry.type !== 'password_verified') {
            return false;
        }

        if (new Date() > entry.expiresAt) {
            this.otpStore.delete(key);
            return false;
        }

        return entry.otp === token;
    }

    /**
     * Clear verification token after password change
     */
    async clearVerificationToken(userId: string): Promise<void> {
        if (this.redisService.isAvailable()) {
            await this.redisService.deleteSessionToken(userId);
        } else {
            const key = `${userId}:password_verified`;
            this.otpStore.delete(key);
        }
    }

    /**
     * Verify OTP for a user
     */
    async verifyOtp(userId: string, otp: string, type: 'login' | 'password_change'): Promise<boolean> {
        this.logger.log(`🔑 [verifyOtp] START - userId: ${userId}, type: ${type}`);
        this.logger.log(`🔑 [verifyOtp] Redis available: ${this.redisService.isAvailable()}`);
        this.logger.log(`🔑 [verifyOtp] In-memory OTP store size: ${this.otpStore.size}`);

        // Check if locked
        const lockCheck = await this.isVerificationLocked(userId, type);
        if (lockCheck.locked) {
            throw new BadRequestException(`Too many failed attempts. Please wait ${lockCheck.waitSeconds} seconds.`);
        }

        let storedOtp: string | null = null;
        let isValid = false;

        // SECURITY: Use atomic get-and-delete to prevent race conditions
        // This ensures OTP can only be verified once, even with concurrent requests
        if (this.redisService.isAvailable()) {
            this.logger.log(`🔑 [verifyOtp] Looking up OTP in Redis...`);
            storedOtp = await this.redisService.getAndDeleteOtp(userId, type);
            this.logger.log(`🔑 [verifyOtp] Redis returned: ${storedOtp ? 'OTP found' : 'NOT FOUND'}`);
        } else {
            // In-memory fallback: get and delete atomically
            const key = `${userId}:${type}`;
            this.logger.log(`🔑 [verifyOtp] Looking up OTP in memory with key: ${key}`);

            // Debug: log all keys in store
            const allKeys = Array.from(this.otpStore.keys());
            this.logger.log(`🔑 [verifyOtp] All OTP keys in memory: ${JSON.stringify(allKeys)}`);

            const entry = this.otpStore.get(key);
            if (entry) {
                this.logger.log(`🔑 [verifyOtp] Found entry, expires at: ${entry.expiresAt}, now: ${new Date()}`);
                if (new Date() <= entry.expiresAt) {
                    storedOtp = entry.otp;
                    this.otpStore.delete(key); // Delete immediately (single-threaded, so atomic)
                    this.logger.log(`🔑 [verifyOtp] OTP retrieved and deleted from memory`);
                } else {
                    this.logger.warn(`🔑 [verifyOtp] OTP expired!`);
                }
            } else {
                this.logger.warn(`🔑 [verifyOtp] No entry found for key: ${key}`);
            }
        }

        if (!storedOtp) {
            this.logger.warn(`❌ [verifyOtp] No OTP found for user ${userId}, type: ${type}`);
            await this.recordFailedAttempt(userId, type);
            return false;
        }

        // Verify OTP (constant-time comparison)
        try {
            isValid = crypto.timingSafeEqual(
                Buffer.from(otp.padEnd(6, '0')),
                Buffer.from(storedOtp.padEnd(6, '0'))
            );
        } catch {
            isValid = false;
        }

        if (isValid) {
            // OTP already deleted atomically above - just reset attempts
            await this.resetFailedAttempts(userId, type);
            this.logger.log(`OTP verified successfully for user ${userId}, type: ${type}`);
        } else {
            this.logger.warn(`Invalid OTP for user ${userId}, type: ${type}`);
            await this.recordFailedAttempt(userId, type);
        }

        return isValid;
    }

    /**
     * Clean up expired OTPs (in-memory only)
     */
    private cleanupExpiredOtps(): void {
        const now = new Date();
        let cleanedCount = 0;
        for (const [key, entry] of this.otpStore.entries()) {
            if (now > entry.expiresAt) {
                this.otpStore.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned up ${cleanedCount} expired OTP entries`);
        }
    }

    /**
     * Clean up expired rate limit entries (in-memory only)
     */
    private cleanupExpiredRateLimits(): void {
        const now = new Date();
        let cleanedCount = 0;

        // Clean up OTP request counts
        for (const [key, entry] of this.otpRequestCounts.entries()) {
            if (now > entry.resetAt) {
                this.otpRequestCounts.delete(key);
                cleanedCount++;
            }
        }

        // Clean up OTP attempt tracking
        for (const [key, entry] of this.otpAttempts.entries()) {
            if (entry.lockedUntil && now > entry.lockedUntil) {
                this.otpAttempts.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
        }
    }

    /**
     * Get remaining time for OTP (in seconds)
     */
    async getRemainingTime(userId: string, type: 'login' | 'password_change'): Promise<number | null> {
        if (this.redisService.isAvailable()) {
            const ttl = await this.redisService.ttl(`otp:${userId}:${type}`);
            return ttl > 0 ? ttl : null;
        }

        const key = `${userId}:${type}`;
        const entry = this.otpStore.get(key);

        if (!entry) return null;

        const remainingMs = entry.expiresAt.getTime() - Date.now();
        return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : null;
    }
}
