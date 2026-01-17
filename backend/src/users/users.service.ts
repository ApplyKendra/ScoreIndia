import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

// Only this email can be SUPER_ADMIN
const SUPER_ADMIN_EMAIL = 'admin@iskconburla.com';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private prisma: PrismaService) { }

    async getAllUsers(role?: Role, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = role ? { role } : undefined;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    isEmailVerified: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                isEmailVerified: true,
                createdAt: true,
                lastLoginAt: true,
                addresses: true,
                _count: {
                    select: {
                        orders: true,
                        registrations: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async createAdmin(dto: CreateUserDto, creatorId: string) {
        // SUPER_ADMIN restriction: Only admin@iskconburla.com can be SUPER_ADMIN
        if (dto.role === Role.SUPER_ADMIN && dto.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
            throw new ForbiddenException(`SUPER_ADMIN role is reserved for ${SUPER_ADMIN_EMAIL}`);
        }

        // Cannot create SUPER_ADMIN through this endpoint
        if (dto.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot create new SUPER_ADMIN. Only one SUPER_ADMIN is allowed.');
        }

        // Check if email already exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                password: hashedPassword,
                name: dto.name,
                phone: dto.phone,
                role: Role.SUB_ADMIN, // Always create as SUB_ADMIN
                createdBy: creatorId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        this.logger.log(
            `Sub-admin user ${user.email} created by ${creatorId}`,
        );

        return user;
    }

    async updateUser(id: string, dto: UpdateUserDto, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent changing SUPER_ADMIN role by non-SUPER_ADMIN
        if (dto.role && user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN role');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });

        this.logger.log(`User ${user.email} updated by admin ${adminId}`);

        return updated;
    }

    async toggleUserActive(id: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent deactivating SUPER_ADMIN
        if (user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot deactivate SUPER_ADMIN');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
            },
        });

        this.logger.log(
            `User ${user.email} ${updated.isActive ? 'activated' : 'deactivated'} by admin ${adminId}`,
        );

        return updated;
    }

    async deleteUser(id: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent deleting SUPER_ADMIN
        if (user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete SUPER_ADMIN');
        }

        await this.prisma.user.delete({ where: { id } });

        this.logger.log(`User ${user.email} deleted by admin ${adminId}`);

        return { message: 'User deleted successfully' };
    }

    async getDashboardStats() {
        const [
            totalUsers,
            totalOrders,
            pendingOrders,
            totalEvents,
            totalRegistrations,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: Role.USER } }),
            this.prisma.prasadamOrder.count(),
            this.prisma.prasadamOrder.count({ where: { status: 'PENDING' } }),
            this.prisma.youthEvent.count(),
            this.prisma.youthEventRegistration.count(),
        ]);

        return {
            totalUsers,
            totalOrders,
            pendingOrders,
            totalEvents,
            totalRegistrations,
        };
    }
}
