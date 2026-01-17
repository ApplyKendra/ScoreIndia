import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';

@Injectable()
export class HeroSlidesService {
    constructor(private prisma: PrismaService) { }

    async findAll(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        return this.prisma.heroSlide.findMany({
            where,
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findOne(id: string) {
        const slide = await this.prisma.heroSlide.findUnique({
            where: { id },
        });
        if (!slide) {
            throw new NotFoundException(`Hero slide with ID ${id} not found`);
        }
        return slide;
    }

    async create(dto: CreateHeroSlideDto, userId?: string) {
        // Get max display order
        const maxOrder = await this.prisma.heroSlide.aggregate({
            _max: { displayOrder: true },
        });
        const displayOrder = dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1;

        return this.prisma.heroSlide.create({
            data: {
                ...dto,
                displayOrder,
                createdBy: userId,
            },
        });
    }

    async update(id: string, dto: UpdateHeroSlideDto) {
        await this.findOne(id); // Ensure exists
        return this.prisma.heroSlide.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists
        return this.prisma.heroSlide.delete({
            where: { id },
        });
    }

    async reorder(slideIds: string[]) {
        // Update display order for each slide
        const updates = slideIds.map((id, index) =>
            this.prisma.heroSlide.update({
                where: { id },
                data: { displayOrder: index },
            })
        );
        await this.prisma.$transaction(updates);
        return { success: true, message: 'Slides reordered successfully' };
    }
}
