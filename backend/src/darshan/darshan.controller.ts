import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { DarshanService } from './darshan.service';
import {
    CreateAartiDto,
    UpdateAartiDto,
    ReorderAartiDto,
    CreateDarshanImageDto,
    UpdateDarshanImageDto,
    UpdateSettingDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators';

@Controller('darshan')
export class DarshanController {
    constructor(private readonly darshanService: DarshanService) { }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================

    @Public()
    @Get('settings')
    getSettings() {
        return this.darshanService.getSettings();
    }

    @Public()
    @Get('settings/:key')
    getSetting(@Param('key') key: string) {
        return this.darshanService.getSetting(key);
    }

    @Patch('settings/:key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateSetting(
        @Param('key') key: string,
        @Body() dto: UpdateSettingDto,
        @Request() req: any,
    ) {
        return this.darshanService.updateSetting(key, dto, req.user?.id);
    }

    // ============================================
    // AARTI SCHEDULE ENDPOINTS
    // ============================================

    @Public()
    @Get('aarti')
    getAartiSchedule(@Query('includeInactive') includeInactive?: string) {
        return this.darshanService.getAartiSchedule(includeInactive === 'true');
    }

    @Get('aarti/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    getAartiById(@Param('id') id: string) {
        return this.darshanService.getAartiById(id);
    }

    @Post('aarti')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    createAarti(@Body() dto: CreateAartiDto) {
        return this.darshanService.createAarti(dto);
    }

    @Patch('aarti/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateAarti(@Param('id') id: string, @Body() dto: UpdateAartiDto) {
        return this.darshanService.updateAarti(id, dto);
    }

    @Delete('aarti/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    deleteAarti(@Param('id') id: string) {
        return this.darshanService.deleteAarti(id);
    }

    @Post('aarti/reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    reorderAarti(@Body() dto: ReorderAartiDto) {
        return this.darshanService.reorderAarti(dto.ids);
    }

    // ============================================
    // DARSHAN IMAGE ENDPOINTS
    // ============================================

    @Public()
    @Get('images')
    getDarshanImages(@Query('includeInactive') includeInactive?: string) {
        return this.darshanService.getDarshanImages(includeInactive === 'true');
    }

    @Get('images/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    getDarshanImageById(@Param('id') id: string) {
        return this.darshanService.getDarshanImageById(id);
    }

    @Post('images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    createDarshanImage(@Body() dto: CreateDarshanImageDto, @Request() req: any) {
        return this.darshanService.createDarshanImage(dto, req.user?.id);
    }

    @Patch('images/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    updateDarshanImage(@Param('id') id: string, @Body() dto: UpdateDarshanImageDto) {
        return this.darshanService.updateDarshanImage(id, dto);
    }

    @Delete('images/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    deleteDarshanImage(@Param('id') id: string) {
        return this.darshanService.deleteDarshanImage(id);
    }
}
