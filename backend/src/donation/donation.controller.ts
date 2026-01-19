import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DonationService } from './donation.service';
import { CreateDonationDto, UploadPaymentProofDto, VerifyDonationDto } from './dto/donation.dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { UploadService } from '../upload/upload.service';

@Controller('donations')
export class DonationController {
    constructor(
        private readonly donationService: DonationService,
        private readonly uploadService: UploadService,
    ) { }

    // ============================================
    // PUBLIC ROUTES (no auth required)
    // ============================================

    // Create donation - public (guests can donate)
    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post()
    async create(@Body() dto: CreateDonationDto, @CurrentUser() user?: any) {
        return this.donationService.create(dto, user?.id);
    }

    // Upload payment proof - public
    @Public()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post(':donationId/upload-proof')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProof(
        @Param('donationId') donationId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadPaymentProofDto,
        @CurrentUser() user?: any,
    ) {
        if (!file) {
            throw new BadRequestException('Payment proof file is required');
        }
        const imageUrl = await this.uploadService.uploadImage(file);
        return this.donationService.uploadPaymentProof(donationId, imageUrl, dto, user?.id);
    }

    // Public receipt - returns limited data (no sensitive PII)
    @Public()
    @Get('public/:donationId')
    async getPublicReceipt(@Param('donationId') donationId: string) {
        return this.donationService.getPublicReceipt(donationId);
    }

    // ============================================
    // AUTHENTICATED USER ROUTES
    // ============================================

    // Get my donations (logged-in users only) - MUST BE BEFORE :donationId
    @Get('my')
    async getMyDonations(
        @CurrentUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        if (!user || !user.id) {
            throw new BadRequestException('User not authenticated');
        }
        return this.donationService.getMyDonations(
            user.id,
            user.email,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
        );
    }

    // Get donation by ID (authenticated users only - full data)
    @Get(':donationId')
    async getDonation(
        @Param('donationId') donationId: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new BadRequestException('User not authenticated');
        }
        const donation = await this.donationService.getDonationById(donationId);

        // Only allow access if user owns this donation or is admin
        const isOwner = donation.userId === user.id || donation.email === user.email;
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN';

        if (!isOwner && !isAdmin) {
            throw new BadRequestException('You do not have permission to view this donation');
        }

        return donation;
    }

    // ============================================
    // ADMIN ROUTES
    // ============================================

    // Admin: Get stats - specific route before generic
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    @Get('admin/stats')
    async getStats() {
        return this.donationService.getStats();
    }

    // Admin: Get all donations - generic route LAST
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    @Get()
    async getAllDonations(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.donationService.getAllDonations(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            status as any,
        );
    }

    // Admin: Verify or reject donation
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    @Patch(':donationId/verify')
    async verifyDonation(
        @Param('donationId') donationId: string,
        @Body() dto: VerifyDonationDto,
        @CurrentUser() user: any,
    ) {
        return this.donationService.verifyDonation(donationId, dto, user.id);
    }
}
