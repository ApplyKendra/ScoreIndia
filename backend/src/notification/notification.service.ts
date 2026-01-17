import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.notification.findMany({
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findActive() {
        return this.prisma.notification.findMany({
            where: { isActive: true },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findOne(id: string) {
        return this.prisma.notification.findUnique({
            where: { id },
        });
    }

    async create(data: {
        title: string;
        message: string;
        isActive?: boolean;
        priority?: number;
        createdBy?: string;
    }) {
        return this.prisma.notification.create({
            data,
        });
    }

    async update(
        id: string,
        data: {
            title?: string;
            message?: string;
            isActive?: boolean;
            priority?: number;
        },
    ) {
        return this.prisma.notification.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.notification.delete({
            where: { id },
        });
    }
}
