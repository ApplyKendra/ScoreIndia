import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEventDto, UpdateEventDto, RegisterEventDto } from './dto';
import { EventStatus } from '@prisma/client';


@Injectable()
export class YouthService {
    private readonly logger = new Logger(YouthService.name);

    constructor(private prisma: PrismaService) { }

    // ============================================
    // PUBLIC - EVENTS
    // ============================================

    async getEvents(status?: EventStatus) {
        return this.prisma.youthEvent.findMany({
            where: status ? { status } : { status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] } },
            orderBy: { date: 'asc' },
        });
    }

    async getEventById(id: string) {
        const event = await this.prisma.youthEvent.findUnique({
            where: { id },
            include: {
                _count: { select: { registrations: true } },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return event;
    }

    async getEventBySlug(slug: string) {
        const event = await this.prisma.youthEvent.findUnique({
            where: { slug },
            include: {
                _count: { select: { registrations: true } },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return event;
    }

    async getFeaturedEvents() {
        return this.prisma.youthEvent.findMany({
            where: {
                isFeatured: true,
                status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] },
            },
            orderBy: { date: 'asc' },
            take: 5,
        });
    }

    // ============================================
    // USER - REGISTRATION
    // ============================================

    async registerForEvent(eventId: string, userId: string, dto: RegisterEventDto) {
        const event = await this.prisma.youthEvent.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if event is still open for registration
        if (event.status !== EventStatus.UPCOMING) {
            throw new BadRequestException('Event is not open for registration');
        }

        if (event.registrationEnd && new Date(event.registrationEnd) < new Date()) {
            throw new BadRequestException('Registration deadline has passed');
        }

        // Check max participants
        if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
            throw new BadRequestException('Event is fully booked');
        }

        // Check if already registered
        const existingReg = await this.prisma.youthEventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (existingReg) {
            throw new ConflictException('Already registered for this event');
        }

        const registration = await this.prisma.youthEventRegistration.create({
            data: {
                eventId,
                userId,
                phone: dto.phone,
                emergencyContact: dto.emergencyContact,
                dietaryReq: dto.dietaryReq,
            },
            include: { event: { select: { title: true, date: true, location: true } } },
        });

        this.logger.log(`User ${userId} registered for event ${event.title}`);

        return registration;
    }

    async getUserRegistrations(userId: string) {
        return this.prisma.youthEventRegistration.findMany({
            where: { userId },
            include: { event: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async cancelRegistration(eventId: string, userId: string) {
        const registration = await this.prisma.youthEventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        await this.prisma.youthEventRegistration.delete({
            where: { id: registration.id },
        });

        this.logger.log(`User ${userId} cancelled registration for event ${eventId}`);

        return { message: 'Registration cancelled successfully' };
    }

    // ============================================
    // ADMIN
    // ============================================

    async createEvent(dto: CreateEventDto, adminId: string) {
        const data: any = {
            ...dto,
            date: new Date(dto.date),
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            registrationEnd: dto.registrationEnd ? new Date(dto.registrationEnd) : undefined,
            createdBy: adminId,
        };

        if (dto.registrationFee !== undefined) {
            data.registrationFee = dto.registrationFee;
        }

        const event = await this.prisma.youthEvent.create({ data });

        this.logger.log(`Event ${event.title} created by admin ${adminId}`);

        return event;
    }

    async updateEvent(id: string, dto: UpdateEventDto, adminId: string) {
        const event = await this.prisma.youthEvent.findUnique({ where: { id } });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const data: any = { ...dto };

        if (dto.date) data.date = new Date(dto.date);
        if (dto.endDate) data.endDate = new Date(dto.endDate);
        if (dto.registrationEnd) data.registrationEnd = new Date(dto.registrationEnd);
        if (dto.registrationFee !== undefined) {
            data.registrationFee = dto.registrationFee;
        }

        const updated = await this.prisma.youthEvent.update({
            where: { id },
            data,
        });

        this.logger.log(`Event ${event.title} updated by admin ${adminId}`);

        return updated;
    }

    async updateEventStatus(id: string, status: EventStatus, adminId: string) {
        const event = await this.prisma.youthEvent.findUnique({ where: { id } });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const updated = await this.prisma.youthEvent.update({
            where: { id },
            data: { status },
        });

        this.logger.log(`Event ${event.title} status updated to ${status} by admin ${adminId}`);

        return updated;
    }

    async getEventRegistrations(eventId: string) {
        return this.prisma.youthEventRegistration.findMany({
            where: { eventId },
            include: { user: { select: { name: true, email: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async deleteEvent(id: string, adminId: string) {
        const event = await this.prisma.youthEvent.findUnique({ where: { id } });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        await this.prisma.youthEvent.delete({ where: { id } });

        this.logger.log(`Event ${event.title} deleted by admin ${adminId}`);

        return { message: 'Event deleted successfully' };
    }
}
