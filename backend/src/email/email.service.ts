import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SsmConfigService } from '../config';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private sesClient: SESClient | null = null;
    private readonly senderEmail = 'no-reply@iskconburla.com';
    private readonly senderName = 'ISKCON Burla';
    private readonly isConfigured: boolean;

    constructor(
        private configService: ConfigService,
        private ssmConfig: SsmConfigService,
    ) {
        // Get region and credentials from SSM (production) or env (development)
        const region = this.ssmConfig.getSesRegion();
        const credentials = this.ssmConfig.getAwsCredentials();

        this.logger.log(`🔍 Email Service Initialization:`);
        this.logger.log(`   - Region: ${region}`);
        this.logger.log(`   - Has Credentials: ${credentials ? 'YES' : 'NO'}`);
        this.logger.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);

        if (credentials) {
            this.sesClient = new SESClient({
                region,
                credentials,
            });
            this.isConfigured = true;
            this.logger.log('✅ Email service configured with AWS SES');
            this.logger.log(`   - Access Key ID: ${credentials.accessKeyId.substring(0, 8)}...`);
        } else {
            this.isConfigured = false;
            this.logger.warn('⚠️ Email service not configured (missing AWS credentials) - emails will be logged only');
            this.logger.warn(`   - Check AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
            this.logger.warn(`   - Check AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
        }
    }

    /**
     * Send email verification link
     */
    async sendVerificationEmail(to: string, name: string, verificationToken: string): Promise<void> {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        const html = this.getVerificationEmailHtml(name, verificationUrl);

        await this.sendEmail({
            to,
            subject: 'Verify Your Email - ISKCON Burla',
            html,
            text: `Hare Krishna ${name}! Please verify your email by visiting: ${verificationUrl}`,
        });
    }

    /**
     * Send 2FA setup confirmation
     */
    async send2FAEnabledEmail(to: string, name: string): Promise<void> {
        const html = this.get2FAEnabledEmailHtml(name);

        await this.sendEmail({
            to,
            subject: '2FA Enabled on Your Account - ISKCON Burla',
            html,
            text: `Hare Krishna ${name}! Two-Factor Authentication has been enabled on your account.`,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const html = this.getPasswordResetEmailHtml(name, resetUrl);

        await this.sendEmail({
            to,
            subject: 'Reset Your Password - ISKCON Burla',
            html,
            text: `Hare Krishna ${name}! Reset your password by visiting: ${resetUrl}`,
        });
    }

    /**
     * Send OTP for admin login verification
     */
    async sendLoginOtp(to: string, name: string, otp: string): Promise<void> {
        // Log OTP only in development for debugging (never log actual OTP in production)
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`[DEV ONLY] Login OTP for ${to}: ${otp}`);
        } else {
            this.logger.log(`Login OTP sent to ${to}`);
        }

        const html = this.getOtpEmailHtml(name, otp, 'Login Verification');

        await this.sendEmail({
            to,
            subject: 'Your Login Verification Code - ISKCON Burla',
            html,
            text: `Hare Krishna ${name}! Your login verification code is: ${otp}. Valid for 5 minutes.`,
        });
    }

    /**
     * Send OTP for password change verification
     */
    async sendPasswordChangeOtp(to: string, name: string, otp: string): Promise<void> {
        const html = this.getOtpEmailHtml(name, otp, 'Password Change');

        await this.sendEmail({
            to,
            subject: 'Your Password Change Code - ISKCON Burla',
            html,
            text: `Hare Krishna ${name}! Your password change verification code is: ${otp}. Valid for 5 minutes.`,
        });
    }

    /**
     * Core email sending method - uses AWS SES directly
     */
    private async sendEmail(options: EmailOptions): Promise<void> {
        if (!this.isConfigured || !this.sesClient) {
            // In dev mode without SES, just log the email
            this.logger.log(`📧 [NO SES CONFIG] Email would be sent to: ${options.to}`);
            this.logger.log(`   Subject: ${options.subject}`);
            return;
        }

        try {
            this.logger.log(`📤 Attempting to send email to: ${options.to}`);
            this.logger.log(`   From: ${this.senderName} <${this.senderEmail}>`);

            const command = new SendEmailCommand({
                Destination: {
                    ToAddresses: [options.to],
                },
                Message: {
                    Body: {
                        Html: { Charset: 'UTF-8', Data: options.html },
                        Text: { Charset: 'UTF-8', Data: options.text || '' },
                    },
                    Subject: { Charset: 'UTF-8', Data: options.subject },
                },
                Source: `${this.senderName} <${this.senderEmail}>`,
            });

            const result = await this.sesClient.send(command);
            this.logger.log(`✅ Email sent successfully to ${options.to}`);
            this.logger.log(`   MessageId: ${result.MessageId}`);
        } catch (error: any) {
            this.logger.error(`❌ SES Error sending email to ${options.to}`);
            this.logger.error(`   Error Name: ${error.name}`);
            this.logger.error(`   Error Code: ${error.Code || error.code || 'N/A'}`);
            this.logger.error(`   Error Message: ${error.message}`);

            // Common SES errors:
            // - MessageRejected: Email address not verified (sandbox mode)
            // - AccessDenied: IAM permissions issue
            // - InvalidParameterValue: Invalid sender email

            if (error.name === 'MessageRejected') {
                this.logger.error('   ⚠️ HINT: Your SES might be in sandbox mode. Verify the recipient email or request production access.');
            }
            if (error.name === 'AccessDeniedException' || error.Code === 'AccessDenied') {
                this.logger.error('   ⚠️ HINT: Check IAM permissions for SES. The IAM user needs ses:SendEmail permission.');
            }

            // In production, throw a user-friendly error
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Failed to send email. Please try again later.');
            }
        }
    }

    private getVerificationEmailHtml(name: string, verificationUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #5750F1 0%, #7C3AED 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🙏 Hare Krishna, ${name}!</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for registering with ISKCON Burla. Please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #5750F1 0%, #7C3AED 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This link will expire in 24 hours.
            </p>
        </div>
    </div>
</body>
</html>`;
    }

    private get2FAEnabledEmailHtml(name: string): string {
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 2FA Enabled</h1>
        </div>
        <div style="padding: 30px;">
            <p>Hare Krishna ${name}, Two-Factor Authentication has been enabled on your account.</p>
        </div>
    </div>
</body>
</html>`;
    }

    private getPasswordResetEmailHtml(name: string, resetUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔑 Password Reset</h1>
        </div>
        <div style="padding: 30px;">
            <p>Hare Krishna ${name}, click below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #F59E0B; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Reset Password
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    private getOtpEmailHtml(name: string, otp: string, purpose: string): string {
        return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #5750F1 0%, #7C3AED 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 ${purpose}</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Hare Krishna ${name}! Your verification code is:
            </p>
            <div style="background: #f8f9fa; border: 2px dashed #5750F1; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #5750F1;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
                This code is valid for <strong>5 minutes</strong>.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you did not request this code, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>`;
    }
}

