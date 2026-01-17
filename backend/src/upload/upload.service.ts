import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { SsmConfigService } from '../config';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;

    constructor(private readonly ssmConfig: SsmConfigService) {
        this.region = process.env.AWS_REGION || 'ap-south-1';

        // Get credentials from SSM (production) or env (development)
        const credentials = this.ssmConfig.getAwsCredentials();
        this.bucketName = this.ssmConfig.getS3BucketName() || process.env.AWS_S3_BUCKET_NAME || '';

        this.logger.log(`🔧 Initializing S3: region=${this.region}, bucket=${this.bucketName}`);

        if (!credentials) {
            this.logger.warn('⚠️ AWS credentials not found - S3 uploads will fail');
        }

        if (!this.bucketName) {
            this.logger.error('❌ S3 bucket name not configured');
        }

        this.s3Client = new S3Client({
            region: this.region,
            credentials: credentials || undefined,
        });
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        // SECURITY: Validate file size before processing
        if (!this.isValidFileSize(file.size)) {
            this.logger.warn(`Upload rejected: file too large (${file.size} bytes)`);
            throw new BadRequestException('File too large. Maximum 5MB allowed.');
        }

        // SECURITY: Validate file content using magic bytes (not just MIME type)
        // This prevents attackers from renaming malware with image extensions
        const validation = this.validateMagicBytes(file.buffer);
        if (!validation.valid) {
            this.logger.warn(`Upload rejected: invalid magic bytes. Claimed type: ${file.mimetype}`);
            throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
        const key = `hero-slides/${fileName}`;

        this.logger.log(`📤 Uploading: ${file.originalname} → ${key} (validated: ${validation.detectedType})`);

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
            });

            await this.s3Client.send(command);

            const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            this.logger.log(`✅ Upload successful: ${imageUrl}`);
            return imageUrl;
        } catch (error: any) {
            this.logger.error(`❌ Upload failed: ${error.message}`, error.stack);

            // Handle specific AWS errors
            if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
                throw new Error(
                    `AWS Permission Error: IAM user doesn't have permission to upload to '${this.bucketName}'. ` +
                    `Add 's3:PutObject' and 's3:PutObjectAcl' permissions. See AWS_FIX.md for instructions.`
                );
            }

            if (error.name === 'NoSuchBucket') {
                throw new Error(`S3 bucket '${this.bucketName}' does not exist. Please create it in region '${this.region}'.`);
            }

            if (error.name === 'InvalidAccessKeyId') {
                throw new Error(`Invalid AWS Access Key ID. Please check your credentials.`);
            }

            if (error.name === 'SignatureDoesNotMatch') {
                throw new Error(`Invalid AWS Secret Access Key. Please check your credentials.`);
            }

            throw new Error(`S3 Upload Failed: ${error.message}`);
        }
    }

    /**
     * Validate if file is an image (MIME type check)
     */
    isImageFile(mimetype: string): boolean {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return allowedTypes.includes(mimetype);
    }

    /**
     * Validate file size (max 5MB)
     */
    isValidFileSize(size: number): boolean {
        const maxSize = 5 * 1024 * 1024; // 5MB
        return size <= maxSize;
    }

    /**
     * Validate file content using magic bytes (file signature)
     * This prevents attackers from renaming malware with image extensions
     */
    validateMagicBytes(buffer: Buffer): { valid: boolean; detectedType: string | null } {
        // Magic byte signatures for common image types
        const signatures: { [key: string]: number[] } = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP starts with RIFF....WEBP)
            'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF87a or GIF89a
        };

        for (const [mimeType, signature] of Object.entries(signatures)) {
            if (this.bufferStartsWith(buffer, signature)) {
                // Special check for WebP: verify WEBP marker at offset 8
                if (mimeType === 'image/webp') {
                    const webpMarker = [0x57, 0x45, 0x42, 0x50]; // WEBP
                    if (buffer.length >= 12 && this.bufferMatchesAt(buffer, webpMarker, 8)) {
                        return { valid: true, detectedType: mimeType };
                    }
                } else {
                    return { valid: true, detectedType: mimeType };
                }
            }
        }

        return { valid: false, detectedType: null };
    }

    private bufferStartsWith(buffer: Buffer, signature: number[]): boolean {
        if (buffer.length < signature.length) return false;
        for (let i = 0; i < signature.length; i++) {
            if (buffer[i] !== signature[i]) return false;
        }
        return true;
    }

    private bufferMatchesAt(buffer: Buffer, signature: number[], offset: number): boolean {
        if (buffer.length < offset + signature.length) return false;
        for (let i = 0; i < signature.length; i++) {
            if (buffer[offset + i] !== signature[i]) return false;
        }
        return true;
    }
}

