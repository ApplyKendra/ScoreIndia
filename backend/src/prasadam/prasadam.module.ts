import { Module } from '@nestjs/common';
import { PrasadamService } from './prasadam.service';
import { PrasadamController } from './prasadam.controller';

@Module({
    controllers: [PrasadamController],
    providers: [PrasadamService],
    exports: [PrasadamService],
})
export class PrasadamModule { }
