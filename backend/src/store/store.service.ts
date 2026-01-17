import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateStoreItemDto, UpdateStoreItemDto, StoreFilterDto } from './dto';


@Injectable()
export class StoreService {
    private readonly logger = new Logger(StoreService.name);

    constructor(private prisma: PrismaService) { }

    // ============================================
    // PUBLIC - CATALOG
    // ============================================

    async getCategories() {
        return this.prisma.storeCategory.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
    }

    async getItems(filters: StoreFilterDto) {
        const where: any = {};

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters.author) {
            where.author = { contains: filters.author, mode: 'insensitive' };
        }

        if (filters.language) {
            where.language = { contains: filters.language, mode: 'insensitive' };
        }

        if (filters.material) {
            where.material = { contains: filters.material, mode: 'insensitive' };
        }

        if (filters.inStock !== undefined) {
            where.inStock = filters.inStock;
        }

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.storeItem.findMany({
            where,
            include: { category: { select: { name: true } } },
            orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        });
    }

    async getItemById(id: string) {
        const item = await this.prisma.storeItem.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!item) {
            throw new NotFoundException('Store item not found');
        }

        return item;
    }

    async getItemBySlug(slug: string) {
        const item = await this.prisma.storeItem.findUnique({
            where: { slug },
            include: { category: true },
        });

        if (!item) {
            throw new NotFoundException('Store item not found');
        }

        return item;
    }

    async getFeaturedItems() {
        return this.prisma.storeItem.findMany({
            where: { isFeatured: true, inStock: true },
            include: { category: { select: { name: true } } },
            take: 10,
        });
    }

    // ============================================
    // ADMIN
    // ============================================

    async createItem(dto: CreateStoreItemDto, adminId: string) {
        // Verify category exists
        const category = await this.prisma.storeCategory.findUnique({
            where: { id: dto.categoryId },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        const data: any = {
            ...dto,
            createdBy: adminId,
        };

        if (dto.displayPrice !== undefined) {
            data.displayPrice = dto.displayPrice;
        }

        const item = await this.prisma.storeItem.create({ data });

        this.logger.log(`Store item ${item.name} created by admin ${adminId}`);

        return item;
    }

    async updateItem(id: string, dto: UpdateStoreItemDto, adminId: string) {
        const item = await this.prisma.storeItem.findUnique({ where: { id } });

        if (!item) {
            throw new NotFoundException('Store item not found');
        }

        const data: any = { ...dto };

        if (dto.displayPrice !== undefined) {
            data.displayPrice = dto.displayPrice;
        }

        const updated = await this.prisma.storeItem.update({
            where: { id },
            data,
        });

        this.logger.log(`Store item ${item.name} updated by admin ${adminId}`);

        return updated;
    }

    async toggleInStock(id: string, adminId: string) {
        const item = await this.prisma.storeItem.findUnique({ where: { id } });

        if (!item) {
            throw new NotFoundException('Store item not found');
        }

        const updated = await this.prisma.storeItem.update({
            where: { id },
            data: { inStock: !item.inStock },
        });

        this.logger.log(
            `Store item ${item.name} stock toggled to ${updated.inStock} by admin ${adminId}`,
        );

        return updated;
    }

    async deleteItem(id: string, adminId: string) {
        const item = await this.prisma.storeItem.findUnique({ where: { id } });

        if (!item) {
            throw new NotFoundException('Store item not found');
        }

        await this.prisma.storeItem.delete({ where: { id } });

        this.logger.log(`Store item ${item.name} deleted by admin ${adminId}`);

        return { message: 'Item deleted successfully' };
    }
}
