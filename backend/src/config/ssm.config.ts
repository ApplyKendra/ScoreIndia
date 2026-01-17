import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SSMClient, GetParametersCommand, Parameter } from '@aws-sdk/client-ssm';

@Injectable()
export class SsmConfigService implements OnModuleInit {
    private readonly logger = new Logger(SsmConfigService.name);
    private secrets: Map<string, string> = new Map();
    private ssmClient: SSMClient;
    private initialized = false;

    constructor() {
        this.ssmClient = new SSMClient({
            region: process.env.AWS_REGION || 'ap-south-1',
        });
    }

    async onModuleInit() {
        // In development, use .env; in production, use SSM
        if (process.env.NODE_ENV === 'production') {
            await this.loadSecretsFromSSM();
        } else {
            this.logger.log('Development mode: Using .env variables');
            this.loadSecretsFromEnv();
        }
        this.initialized = true;
    }

    private async loadSecretsFromSSM() {
        const parameterNames = [
            '/iskcon/jwt/secret',
            '/iskcon/jwt/refresh-secret',
            '/iskcon/database/url',
            '/iskcon/2fa/encryption-key',
            '/iskcon/aws/access-key-id',
            '/iskcon/aws/secret-access-key',
            '/iskcon/aws/s3/bucket-name',
            '/iskcon/aws/ses/region',
            '/iskcon/redis/url',
        ];

        try {
            const command = new GetParametersCommand({
                Names: parameterNames,
                WithDecryption: true,
            });

            const response = await this.ssmClient.send(command);

            if (response.Parameters) {
                response.Parameters.forEach((param: Parameter) => {
                    if (param.Name && param.Value) {
                        // Store with simple key (e.g., 'jwt.secret' from '/iskcon/jwt/secret')
                        const key = param.Name.replace('/iskcon/', '').replace(/\//g, '.');
                        this.secrets.set(key, param.Value);
                    }
                });
            }

            if (response.InvalidParameters && response.InvalidParameters.length > 0) {
                this.logger.warn(`Invalid SSM parameters: ${response.InvalidParameters.join(', ')}`);
            }

            this.logger.log(`Loaded ${this.secrets.size} secrets from AWS SSM`);
        } catch (error: any) {
            // For Render/Vercel deployment: fall back to environment variables
            this.logger.warn(`SSM not available (${error.message}), falling back to environment variables`);
            this.loadSecretsFromEnv();
        }
    }

    private loadSecretsFromEnv() {
        // Map .env variables to the same keys as SSM
        const envMappings: Record<string, string> = {
            'jwt.secret': process.env.JWT_SECRET || '',
            'jwt.refresh-secret': process.env.JWT_REFRESH_SECRET || '',
            'database.url': process.env.DATABASE_URL || '',
            '2fa.encryption-key': process.env.TWO_FACTOR_ENCRYPTION_KEY || 'dev-encryption-key-32-bytes-!!',
            'aws.access-key-id': process.env.AWS_ACCESS_KEY_ID || '',
            'aws.secret-access-key': process.env.AWS_SECRET_ACCESS_KEY || '',
            'aws.s3.bucket-name': process.env.AWS_S3_BUCKET_NAME || '',
            'aws.ses.region': process.env.AWS_SES_REGION || 'ap-south-1',
            'redis.url': process.env.REDIS_URL || '',
        };

        Object.entries(envMappings).forEach(([key, value]) => {
            this.secrets.set(key, value);
        });
    }

    /**
     * Get a secret value by key
     * @throws Error if secret is not found
     */
    get(key: string): string {
        const value = this.secrets.get(key);
        if (!value) {
            throw new Error(`Secret '${key}' not found in configuration`);
        }
        return value;
    }

    /**
     * Get a secret value or return default
     */
    getOrDefault(key: string, defaultValue: string): string {
        return this.secrets.get(key) || defaultValue;
    }

    /**
     * Get a secret value or return undefined
     */
    getOptional(key: string): string | undefined {
        return this.secrets.get(key);
    }

    /**
     * Check if service is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Check if running in production mode
     */
    isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    /**
     * Get AWS credentials for services
     */
    getAwsCredentials(): { accessKeyId: string; secretAccessKey: string } | null {
        const accessKeyId = this.getOptional('aws.access-key-id');
        const secretAccessKey = this.getOptional('aws.secret-access-key');

        if (accessKeyId && secretAccessKey) {
            return { accessKeyId, secretAccessKey };
        }
        return null;
    }

    /**
     * Get S3 bucket name
     */
    getS3BucketName(): string {
        return this.getOrDefault('aws.s3.bucket-name', '');
    }

    /**
     * Get SES region
     */
    getSesRegion(): string {
        return this.getOrDefault('aws.ses.region', 'ap-south-1');
    }

    /**
     * Get Redis URL
     */
    getRedisUrl(): string | undefined {
        return this.getOptional('redis.url');
    }
}
