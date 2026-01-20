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
import { Role, EventStatus } from '@prisma/client';
import { YouthService } from './youth.service';
import { CreateEventDto, UpdateEventDto, RegisterEventDto, GuestRegisterEventDto } from './dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('youth')
export class YouthController {
    constructor(private youthService: YouthService) { }

    // ============================================
    // PUBLIC
    // ============================================

    @Public()
    @Get('events')
    getEvents(@Query('status') status?: EventStatus) {
        return this.youthService.getEvents(status);
    }

    @Public()
    @Get('events/featured')
    getFeaturedEvents() {
        return this.youthService.getFeaturedEvents();
    }

    @Public()
    @Get('events/:id')
    getEventById(@Param('id') id: string) {
        return this.youthService.getEventById(id);
    }

    @Public()
    @Get('events/slug/:slug')
    getEventBySlug(@Param('slug') slug: string) {
        return this.youthService.getEventBySlug(slug);
    }

    // Public guest registration (for registering others without login)
    @Public()
    @Post('events/:id/guest-register')
    guestRegisterForEvent(
        @Param('id') eventId: string,
        @Body() dto: GuestRegisterEventDto,
    ) {
        return this.youthService.guestRegisterForEvent(eventId, dto);
    }

    // ============================================
    // USER
    // ============================================

    @Post('events/:id/register')
    registerForEvent(
        @Param('id') eventId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: RegisterEventDto,
    ) {
        return this.youthService.registerForEvent(eventId, userId, dto);
    }

    @Get('registrations/my')
    getUserRegistrations(@CurrentUser('id') userId: string) {
        return this.youthService.getUserRegistrations(userId);
    }

    @Delete('events/:id/registration')
    cancelRegistration(
        @Param('id') eventId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.youthService.cancelRegistration(eventId, userId);
    }

    // ============================================
    // ADMIN
    // ============================================

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Post('admin/events')
    createEvent(
        @Body() dto: CreateEventDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.youthService.createEvent(dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/events/:id')
    updateEvent(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.youthService.updateEvent(id, dto, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Patch('admin/events/:id/status')
    updateEventStatus(
        @Param('id') id: string,
        @Body('status') status: EventStatus,
        @CurrentUser('id') adminId: string,
    ) {
        return this.youthService.updateEventStatus(id, status, adminId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUB_ADMIN, Role.SUPER_ADMIN)
    @Get('admin/events/:id/registrations')
    getEventRegistrations(@Param('id') eventId: string) {
        return this.youthService.getEventRegistrations(eventId);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('admin/events/:id')
    deleteEvent(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.youthService.deleteEvent(id, adminId);
    }
}
