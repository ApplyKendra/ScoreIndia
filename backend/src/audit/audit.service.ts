import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

export interface AuditLogData {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create an audit log entry
     */
    async log(data: AuditLogData): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    oldValue: data.oldValue,
                    newValue: data.newValue,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
        } catch (error: any) {
            // Don't throw - audit logging should not break the main flow
            this.logger.error(`Failed to create audit log: ${error.message}`);
        }
    }

    /**
     * Log authentication events
     */
    async logAuth(
        action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'REGISTER' | '2FA_ENABLED' | '2FA_DISABLED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED' | 'EMAIL_VERIFIED',
        userId: string | undefined,
        email: string,
        ipAddress?: string,
        userAgent?: string,
        additionalData?: any,
    ): Promise<void> {
        await this.log({
            userId,
            action,
            entity: 'User',
            entityId: userId,
            newValue: { email, ...additionalData },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log data changes (create, update, delete)
     */
    async logDataChange(
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        entity: string,
        entityId: string,
        userId: string,
        oldValue?: any,
        newValue?: any,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        await this.log({
            userId,
            action,
            entity,
            entityId,
            oldValue,
            newValue,
            ipAddress,
            userAgent,
        });
    }

    /**
     * Get audit logs for a specific user
     */
    async getUserLogs(userId: string, limit: number = 50) {
        return this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get recent security-related logs
     */
    async getSecurityLogs(hours: number = 24, limit: number = 100) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this.prisma.auditLog.findMany({
            where: {
                action: {
                    in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', '2FA_ENABLED', '2FA_DISABLED', 'PASSWORD_RESET'],
                },
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
