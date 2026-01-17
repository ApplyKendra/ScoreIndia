import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { authenticator } from '@otplib/preset-default';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
    private readonly logger = new Logger(TwoFactorService.name);
    private readonly encryptionKey: Buffer;
    private readonly algorithm = 'aes-256-gcm';
    private readonly issuer = 'ISKCON Burla';

    constructor(private configService: ConfigService) {
        // Get encryption key from config (32 bytes for AES-256)
        const keyString = this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY') ||
            'dev-encryption-key-32-bytes-!!';
        this.encryptionKey = crypto.scryptSync(keyString, 'salt', 32);

        // Log key status (never log the actual key!)
        const isUsingDefault = keyString === 'dev-encryption-key-32-bytes-!!';
        this.logger.log(`🔐 2FA Service Initialized:`);
        this.logger.log(`   - Encryption key configured: ${!isUsingDefault ? 'YES (custom)' : 'NO (using default - UNSAFE for production!)'}`);
        if (isUsingDefault && process.env.NODE_ENV === 'production') {
            this.logger.error('⚠️ CRITICAL: Using default 2FA encryption key in production! Set TWO_FACTOR_ENCRYPTION_KEY env variable.');
        }
    }

    /**
     * Generate a new TOTP secret for a user
     */
    generateSecret(): string {
        return authenticator.generateSecret();
    }

    /**
     * Generate QR code data URL for Google Authenticator
     */
    async generateQRCode(email: string, secret: string): Promise<string> {
        const otpauthUrl = authenticator.keyuri(email, this.issuer, secret);

        try {
            return await QRCode.toDataURL(otpauthUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#5750F1',
                    light: '#FFFFFF',
                },
            });
        } catch (error: any) {
            this.logger.error(`Failed to generate QR code: ${error.message}`);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify a TOTP token against the secret
     */
    verifyToken(token: string, secret: string): boolean {
        try {
            return authenticator.verify({ token, secret });
        } catch (error) {
            return false;
        }
    }

    /**
     * Encrypt the TOTP secret for database storage
     */
    encryptSecret(secret: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Return IV + AuthTag + Encrypted data
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt the TOTP secret from database
     */
    decryptSecret(encryptedData: string): string {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error: any) {
            this.logger.error(`Failed to decrypt 2FA secret: ${error.message}`);
            throw new Error('Failed to decrypt 2FA secret');
        }
    }

    /**
     * Generate recovery codes for 2FA
     */
    generateRecoveryCodes(count: number = 8): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
        }
        return codes;
    }

    /**
     * Check if 2FA should be mandatory for a role
     */
    isTwoFactorMandatory(role: string): boolean {
        return role === 'SUPER_ADMIN' || role === 'SUB_ADMIN';
    }
}
