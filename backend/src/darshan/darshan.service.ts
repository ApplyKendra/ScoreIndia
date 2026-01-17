import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateAartiDto,
    UpdateAartiDto,
    CreateDarshanImageDto,
    UpdateDarshanImageDto,
    UpdateSettingDto,
} from './dto';

// Default aarti schedule for seeding
const DEFAULT_AARTI_SCHEDULE = [
    { name: 'Mangala Aarti', time: '04:30 AM', description: 'Morning wake-up ceremony', displayOrder: 0 },
    { name: 'Tulsi Puja', time: '05:00 AM', description: 'Worship of sacred Tulsi', displayOrder: 1 },
    { name: 'Sringara Aarti', time: '07:15 AM', description: 'Deity dressing ceremony', displayOrder: 2 },
    { name: 'Guru Puja', time: '07:30 AM', description: 'Worship of spiritual master', displayOrder: 3 },
    { name: 'Raj Bhog Aarti', time: '12:30 PM', description: 'Midday offering', displayOrder: 4 },
    { name: 'Usthapan Aarti', time: '04:00 PM', description: 'Evening ceremony', displayOrder: 5 },
    { name: 'Sandhya Aarti', time: '07:00 PM', description: 'Evening prayers', displayOrder: 6 },
    { name: 'Shayan Aarti', time: '08:30 PM', description: 'Night rest ceremony', displayOrder: 7 },
];

// Default settings
const DEFAULT_SETTINGS = [
    { key: 'youtube_link', value: 'https://youtube.com' },
    { key: 'temple_open', value: '4:30 AM' },
    { key: 'temple_close', value: '9:00 PM' },
];

@Injectable()
export class DarshanService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // SETTINGS
    // ============================================

    async getSettings() {
        let settings = await this.prisma.darshanSetting.findMany();

        // Seed default settings if empty
        if (settings.length === 0) {
            await this.prisma.darshanSetting.createMany({
                data: DEFAULT_SETTINGS,
            });
            settings = await this.prisma.darshanSetting.findMany();
        }

        return settings;
    }

    async getSetting(key: string) {
        const setting = await this.prisma.darshanSetting.findUnique({
            where: { key },
        });
        if (!setting) {
            throw new NotFoundException(`Setting ${key} not found`);
        }
        return setting;
    }

    async updateSetting(key: string, dto: UpdateSettingDto, userId?: string) {
        return this.prisma.darshanSetting.upsert({
            where: { key },
            update: { value: dto.value, updatedBy: userId },
            create: { key, value: dto.value, updatedBy: userId },
        });
    }

    // ============================================
    // AARTI SCHEDULE
    // ============================================

    async getAartiSchedule(includeInactive = false) {
        let schedule = await this.prisma.aartiSchedule.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });

        // Seed default schedule if empty
        if (schedule.length === 0) {
            await this.prisma.aartiSchedule.createMany({
                data: DEFAULT_AARTI_SCHEDULE,
            });
            schedule = await this.prisma.aartiSchedule.findMany({
                where: includeInactive ? {} : { isActive: true },
                orderBy: { displayOrder: 'asc' },
            });
        }

        return schedule;
    }

    async getAartiById(id: string) {
        const aarti = await this.prisma.aartiSchedule.findUnique({
            where: { id },
        });
        if (!aarti) {
            throw new NotFoundException(`Aarti with ID ${id} not found`);
        }
        return aarti;
    }

    async createAarti(dto: CreateAartiDto) {
        // Get max display order
        const maxOrder = await this.prisma.aartiSchedule.aggregate({
            _max: { displayOrder: true },
        });
        const displayOrder = dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1;

        return this.prisma.aartiSchedule.create({
            data: {
                ...dto,
                displayOrder,
            },
        });
    }

    async updateAarti(id: string, dto: UpdateAartiDto) {
        await this.getAartiById(id);
        return this.prisma.aartiSchedule.update({
            where: { id },
            data: dto,
        });
    }

    async deleteAarti(id: string) {
        await this.getAartiById(id);
        return this.prisma.aartiSchedule.delete({
            where: { id },
        });
    }

    async reorderAarti(ids: string[]) {
        const updates = ids.map((id, index) =>
            this.prisma.aartiSchedule.update({
                where: { id },
                data: { displayOrder: index },
            })
        );
        await this.prisma.$transaction(updates);
        return { success: true };
    }

    // ============================================
    // DARSHAN IMAGES
    // ============================================

    async getDarshanImages(includeInactive = false) {
        return this.prisma.darshanImage.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: [{ date: 'desc' }, { displayOrder: 'asc' }],
        });
    }

    async getDarshanImageById(id: string) {
        const image = await this.prisma.darshanImage.findUnique({
            where: { id },
        });
        if (!image) {
            throw new NotFoundException(`Darshan image with ID ${id} not found`);
        }
        return image;
    }

    async createDarshanImage(dto: CreateDarshanImageDto, userId?: string) {
        // Get max display order
        const maxOrder = await this.prisma.darshanImage.aggregate({
            _max: { displayOrder: true },
        });
        const displayOrder = dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1;

        return this.prisma.darshanImage.create({
            data: {
                ...dto,
                displayOrder,
                createdBy: userId,
            },
        });
    }

    async updateDarshanImage(id: string, dto: UpdateDarshanImageDto) {
        await this.getDarshanImageById(id);
        return this.prisma.darshanImage.update({
            where: { id },
            data: dto,
        });
    }

    async deleteDarshanImage(id: string) {
        await this.getDarshanImageById(id);
        return this.prisma.darshanImage.delete({
            where: { id },
        });
    }
}
