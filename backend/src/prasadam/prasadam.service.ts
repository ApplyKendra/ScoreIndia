import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateOrderDto, UpdateOrderStatusDto, CreatePrasadamItemDto, UpdatePrasadamItemDto } from './dto';
import { OrderStatus, DeliveryType } from '@prisma/client';


@Injectable()
export class PrasadamService {
    private readonly logger = new Logger(PrasadamService.name);

    constructor(private prisma: PrismaService) { }

    // ============================================
    // MENU / CATEGORIES
    // ============================================

    async getCategories() {
        return this.prisma.prasadamCategory.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
    }

    async getMenuItems(categoryId?: string) {
        return this.prisma.prasadamItem.findMany({
            where: {
                isAvailable: true,
                ...(categoryId && { categoryId }),
            },
            include: {
                category: {
                    select: { name: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async getMenuItem(id: string) {
        const item = await this.prisma.prasadamItem.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        return item;
    }

    // ============================================
    // ORDERS - USER
    // ============================================

    async createOrder(userId: string, dto: CreateOrderDto) {
        // Validate items exist and are available
        const itemIds = dto.items.map((i) => i.itemId);
        const menuItems = await this.prisma.prasadamItem.findMany({
            where: { id: { in: itemIds }, isAvailable: true },
        });

        if (menuItems.length !== itemIds.length) {
            throw new BadRequestException('One or more items are not available');
        }

        // Validate quantities
        for (const orderItem of dto.items) {
            const menuItem = menuItems.find((m) => m.id === orderItem.itemId);
            if (menuItem && orderItem.quantity > menuItem.maxQuantityPerOrder) {
                throw new BadRequestException(
                    `Maximum quantity for ${menuItem.name} is ${menuItem.maxQuantityPerOrder}`,
                );
            }
        }

        // Calculate totals
        const subtotal = dto.items.reduce((sum, item) => {
            const menuItem = menuItems.find((m) => m.id === item.itemId);
            const price = menuItem ? Number(menuItem.price) : 0;
            return sum + price * item.quantity;
        }, 0);

        const deliveryFee = dto.deliveryType === DeliveryType.DELIVERY ? 50 : 0;
        const totalAmount = subtotal + deliveryFee;

        // Generate order number
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

        // Create order with item snapshot
        const itemsSnapshot = dto.items.map((item) => {
            const menuItem = menuItems.find((m) => m.id === item.itemId);
            return {
                itemId: item.itemId,
                name: menuItem?.name || item.name,
                price: menuItem ? Number(menuItem.price) : item.price,
                quantity: item.quantity,
            };
        });

        const order = await this.prisma.prasadamOrder.create({
            data: {
                orderNumber,
                userId,
                deliveryType: dto.deliveryType,
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                totalAmount: totalAmount,
                deliveryAddress: dto.deliveryAddress,
                deliveryPhone: dto.deliveryPhone,
                instructions: dto.instructions,
                items: itemsSnapshot,
            },
        });

        this.logger.log(`Order ${orderNumber} created by user ${userId}`);

        return order;
    }

    async getUserOrders(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.prasadamOrder.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.prasadamOrder.count({ where: { userId } }),
        ]);
        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getOrderById(orderId: string, userId?: string) {
        const order = await this.prisma.prasadamOrder.findUnique({
            where: { id: orderId },
            include: { user: { select: { name: true, email: true, phone: true } } },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // If userId provided, ensure user owns the order
        if (userId && order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // ============================================
    // ORDERS - ADMIN
    // ============================================

    async getAllOrders(status?: OrderStatus, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : undefined;

        const [orders, total] = await Promise.all([
            this.prisma.prasadamOrder.findMany({
                where,
                include: { user: { select: { name: true, email: true, phone: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.prasadamOrder.count({ where }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateOrderStatus(
        orderId: string,
        dto: UpdateOrderStatusDto,
        adminId: string,
    ) {
        const order = await this.prisma.prasadamOrder.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const updateData: any = { status: dto.status };

        // Set timestamps based on status
        switch (dto.status) {
            case OrderStatus.CONFIRMED:
                updateData.confirmedAt = new Date();
                break;
            case OrderStatus.READY:
                updateData.readyAt = new Date();
                break;
            case OrderStatus.COMPLETED:
                updateData.completedAt = new Date();
                break;
            case OrderStatus.CANCELLED:
                updateData.cancelledAt = new Date();
                updateData.cancelReason = dto.cancelReason;
                break;
        }

        const updated = await this.prisma.prasadamOrder.update({
            where: { id: orderId },
            data: updateData,
        });

        this.logger.log(
            `Order ${order.orderNumber} status updated to ${dto.status} by admin ${adminId}`,
        );

        return updated;
    }

    // ============================================
    // MENU MANAGEMENT - ADMIN
    // ============================================

    async createMenuItem(dto: CreatePrasadamItemDto, adminId: string) {
        // Verify category exists
        const category = await this.prisma.prasadamCategory.findUnique({
            where: { id: dto.categoryId },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        const item = await this.prisma.prasadamItem.create({
            data: {
                ...dto,
                price: dto.price,
                createdBy: adminId,
            },
        });

        this.logger.log(`Menu item ${item.name} created by admin ${adminId}`);

        return item;
    }

    async updateMenuItem(
        itemId: string,
        dto: UpdatePrasadamItemDto,
        adminId: string,
    ) {
        const item = await this.prisma.prasadamItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        const updateData: any = { ...dto };
        if (dto.price !== undefined) {
            updateData.price = dto.price;
        }

        const updated = await this.prisma.prasadamItem.update({
            where: { id: itemId },
            data: updateData,
        });

        this.logger.log(`Menu item ${item.name} updated by admin ${adminId}`);

        return updated;
    }

    async toggleItemAvailability(itemId: string, adminId: string) {
        const item = await this.prisma.prasadamItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        const updated = await this.prisma.prasadamItem.update({
            where: { id: itemId },
            data: { isAvailable: !item.isAvailable },
        });

        this.logger.log(
            `Menu item ${item.name} availability toggled to ${updated.isAvailable} by admin ${adminId}`,
        );

        return updated;
    }

    async deleteMenuItem(itemId: string, adminId: string) {
        const item = await this.prisma.prasadamItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        await this.prisma.prasadamItem.delete({ where: { id: itemId } });

        this.logger.log(`Menu item ${item.name} deleted by admin ${adminId}`);

        return { message: 'Item deleted successfully' };
    }
}
