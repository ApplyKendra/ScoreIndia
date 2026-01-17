import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    // Public endpoint - get active notifications
    @Public()
    @Get('active')
    async getActiveNotifications() {
        return this.notificationService.findActive();
    }

    // Admin only - get all notifications
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    async getAllNotifications() {
        return this.notificationService.findAll();
    }

    // Admin only - get single notification
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    async getNotification(@Param('id') id: string) {
        return this.notificationService.findOne(id);
    }

    // Admin only - create notification
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    async createNotification(
        @Body()
        body: {
            title: string;
            message: string;
            isActive?: boolean;
            priority?: number;
        },
        @Request() req,
    ) {
        return this.notificationService.create({
            ...body,
            createdBy: req.user?.id,
        });
    }

    // Admin only - update notification
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    async updateNotification(
        @Param('id') id: string,
        @Body()
        body: {
            title?: string;
            message?: string;
            isActive?: boolean;
            priority?: number;
        },
    ) {
        return this.notificationService.update(id, body);
    }

    // Admin only - delete notification
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    async deleteNotification(@Param('id') id: string) {
        return this.notificationService.delete(id);
    }
}
