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
import { Role } from '@prisma/client';
import { StoreService } from './store.service';
import { CreateStoreItemDto, UpdateStoreItemDto, StoreFilterDto } from './dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('store')
export class StoreController {
    constructor(private storeService: StoreService) { }

    // ============================================
    // PUBLIC - CATALOG
    // ============================================

    @Public()
    @Get('categories')
    getCategories() {
        return this.storeService.getCategories();
    }

    @Public()
    @Get('items')
    getItems(@Query() filters: StoreFilterDto) {
        return this.storeService.getItems(filters);
    }

    @Public()
    @Get('items/featured')
    getFeaturedItems() {
        return this.storeService.getFeaturedItems();
    }

    @Public()
    @Get('items/:id')
    getItemById(@Param('id') id: string) {
        return this.storeService.getItemById(id);
    }

    @Public()
    @Get('items/slug/:slug')
    getItemBySlug(@Param('slug') slug: string) {
        return this.storeService.getItemBySlug(slug);
    }

    // ============================================
    // ADMIN
    // ============================================

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Post('admin/items')
    createItem(
        @Body() dto: CreateStoreItemDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.storeService.createItem(dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/items/:id')
    updateItem(
        @Param('id') id: string,
        @Body() dto: UpdateStoreItemDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.storeService.updateItem(id, dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/items/:id/toggle-stock')
    toggleInStock(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.storeService.toggleInStock(id, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('admin/items/:id')
    deleteItem(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.storeService.deleteItem(id, adminId);
    }
}
