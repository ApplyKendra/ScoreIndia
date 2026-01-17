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
import { HeroSlidesService } from './hero-slides.service';
import { CreateHeroSlideDto, UpdateHeroSlideDto, ReorderSlidesDto } from './dto/hero-slide.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators';

@Controller('hero-slides')
export class HeroSlidesController {
    constructor(private readonly heroSlidesService: HeroSlidesService) { }

    // Public endpoint - get active slides for homepage
    @Public()
    @Get()
    findAll(@Query('includeInactive') includeInactive?: string) {
        const showInactive = includeInactive === 'true';
        return this.heroSlidesService.findAll(showInactive);
    }

    // Admin only - get single slide
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    findOne(@Param('id') id: string) {
        return this.heroSlidesService.findOne(id);
    }

    // Admin only - create slide
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    create(@Body() createDto: CreateHeroSlideDto, @Request() req: any) {
        return this.heroSlidesService.create(createDto, req.user?.id);
    }

    // Admin only - update slide
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    update(@Param('id') id: string, @Body() updateDto: UpdateHeroSlideDto) {
        return this.heroSlidesService.update(id, updateDto);
    }

    // Admin only - delete slide
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    remove(@Param('id') id: string) {
        return this.heroSlidesService.remove(id);
    }

    // Admin only - reorder slides
    @Post('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'SUB_ADMIN')
    reorder(@Body() reorderDto: ReorderSlidesDto) {
        return this.heroSlidesService.reorder(reorderDto.slideIds);
    }
}
