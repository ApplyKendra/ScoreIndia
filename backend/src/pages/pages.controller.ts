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
    Request,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import {
    UpdateAboutUsDto,
    UpdateContactUsDto,
    UpdateTempleConstructionDto,
    CreateSevaDto,
    UpdateSevaDto,
    UpdateNityaSevakPageDto,
    CreateNityaSevakApplicationDto,
    UpdateApplicationStatusDto,
    CreateSevaRegistrationDto,
    UpdateSevaRegistrationStatusDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators';

@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    // ============================================
    // About Us
    // ============================================

    @Public()
    @Get('about-us')
    getAboutUs() {
        return this.pagesService.getAboutUs();
    }

    @Patch('about-us')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateAboutUs(@Body() dto: UpdateAboutUsDto, @Request() req: any) {
        return this.pagesService.updateAboutUs(dto, req.user?.id);
    }

    // ============================================
    // Contact Us
    // ============================================

    @Public()
    @Get('contact-us')
    getContactUs() {
        return this.pagesService.getContactUs();
    }

    @Patch('contact-us')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateContactUs(@Body() dto: UpdateContactUsDto, @Request() req: any) {
        return this.pagesService.updateContactUs(dto, req.user?.id);
    }

    // ============================================
    // Temple Construction
    // ============================================

    @Public()
    @Get('temple-construction')
    getTempleConstruction() {
        return this.pagesService.getTempleConstruction();
    }

    @Patch('temple-construction')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateTempleConstruction(@Body() dto: UpdateTempleConstructionDto, @Request() req: any) {
        return this.pagesService.updateTempleConstruction(dto, req.user?.id);
    }

    // ============================================
    // Seva Opportunities
    // ============================================

    @Public()
    @Get('seva')
    getAllSeva(@Query('includeInactive') includeInactive?: string) {
        return this.pagesService.getAllSeva(includeInactive === 'true');
    }

    // NOTE: These routes MUST come BEFORE 'seva/:id' to prevent 'registrations' being matched as an ID
    // ============================================
    // Seva Registrations (placed before :id routes)
    // ============================================

    // Admin: Get all registrations with optional filters
    @Get('seva/registrations')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    getSevaRegistrations(
        @Query('sevaId') sevaId?: string,
        @Query('status') status?: string,
    ) {
        return this.pagesService.getSevaRegistrations(sevaId, status);
    }

    // Admin: Update registration status
    @Patch('seva/registrations/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateSevaRegistrationStatus(
        @Param('id') id: string,
        @Body() dto: UpdateSevaRegistrationStatusDto,
    ) {
        return this.pagesService.updateSevaRegistrationStatus(id, dto);
    }

    // ============================================
    // Seva CRUD (with :id param routes)
    // ============================================

    @Get('seva/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    getSevaById(@Param('id') id: string) {
        return this.pagesService.getSevaById(id);
    }

    @Post('seva')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    createSeva(@Body() dto: CreateSevaDto, @Request() req: any) {
        return this.pagesService.createSeva(dto, req.user?.id);
    }

    @Patch('seva/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateSeva(@Param('id') id: string, @Body() dto: UpdateSevaDto) {
        return this.pagesService.updateSeva(id, dto);
    }

    @Delete('seva/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    deleteSeva(@Param('id') id: string) {
        return this.pagesService.deleteSeva(id);
    }

    // Register for a seva - works for both logged-in and guest users
    @Public()
    @Post('seva/:id/register')
    registerForSeva(
        @Param('id') id: string,
        @Body() dto: CreateSevaRegistrationDto,
        @Request() req: any,
    ) {
        // If user is logged in, pass their userId
        const userId = req.user?.id;
        return this.pagesService.registerForSeva(id, dto, userId);
    }

    // ============================================
    // Nitya Sevak
    // ============================================

    @Public()
    @Get('nitya-sevak')
    getNityaSevakPage() {
        return this.pagesService.getNityaSevakPage();
    }

    @Patch('nitya-sevak')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateNityaSevakPage(@Body() dto: UpdateNityaSevakPageDto, @Request() req: any) {
        return this.pagesService.updateNityaSevakPage(dto, req.user?.id);
    }

    @Public()
    @Post('nitya-sevak/apply')
    createNityaSevakApplication(@Body() dto: CreateNityaSevakApplicationDto) {
        return this.pagesService.createNityaSevakApplication(dto);
    }

    @Get('nitya-sevak/applications')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    getAllApplications(@Query('status') status?: string) {
        return this.pagesService.getAllApplications(status);
    }

    @Patch('nitya-sevak/applications/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateApplicationStatus(@Param('id') id: string, @Body() dto: UpdateApplicationStatusDto) {
        return this.pagesService.updateApplicationStatus(id, dto);
    }
}

