import { Module } from '@nestjs/common';
import { HeroSlidesController } from './hero-slides.controller';
import { HeroSlidesService } from './hero-slides.service';

@Module({
    controllers: [HeroSlidesController],
    providers: [HeroSlidesService],
    exports: [HeroSlidesService],
})
export class HeroSlidesModule { }
