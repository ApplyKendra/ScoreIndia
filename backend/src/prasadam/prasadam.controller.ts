import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { PrasadamService } from './prasadam.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreatePrasadamItemDto, UpdatePrasadamItemDto } from './dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('prasadam')
export class PrasadamController {
    constructor(private prasadamService: PrasadamService) { }

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    @Public()
    @Get('categories')
    getCategories() {
        return this.prasadamService.getCategories();
    }

    @Public()
    @Get('menu')
    getMenuItems(@Query('categoryId') categoryId?: string) {
        return this.prasadamService.getMenuItems(categoryId);
    }

    @Public()
    @Get('menu/:id')
    getMenuItem(@Param('id') id: string) {
        return this.prasadamService.getMenuItem(id);
    }

    // ============================================
    // USER ENDPOINTS
    // ============================================

    @Post('orders')
    createOrder(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateOrderDto,
    ) {
        return this.prasadamService.createOrder(userId, dto);
    }

    @Get('orders/my')
    getUserOrders(@CurrentUser('id') userId: string) {
        return this.prasadamService.getUserOrders(userId);
    }

    @Get('orders/:id')
    getOrderById(
        @Param('id') orderId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: Role,
    ) {
        // Admins can view any order, users can only view their own
        const userIdForQuery = (role === Role.SUPER_ADMIN || role === Role.SUB_ADMIN)
            ? undefined
            : userId;
        return this.prasadamService.getOrderById(orderId, userIdForQuery);
    }

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Get('admin/orders')
    getAllOrders(@Query('status') status?: OrderStatus) {
        return this.prasadamService.getAllOrders(status);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/orders/:id/status')
    updateOrderStatus(
        @Param('id') orderId: string,
        @Body() dto: UpdateOrderStatusDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.prasadamService.updateOrderStatus(orderId, dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Post('admin/menu')
    createMenuItem(
        @Body() dto: CreatePrasadamItemDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.prasadamService.createMenuItem(dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/menu/:id')
    updateMenuItem(
        @Param('id') itemId: string,
        @Body() dto: UpdatePrasadamItemDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.prasadamService.updateMenuItem(itemId, dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/menu/:id/toggle-availability')
    toggleItemAvailability(
        @Param('id') itemId: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.prasadamService.toggleItemAvailability(itemId, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('admin/menu/:id')
    deleteMenuItem(
        @Param('id') itemId: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.prasadamService.deleteMenuItem(itemId, adminId);
    }
}
