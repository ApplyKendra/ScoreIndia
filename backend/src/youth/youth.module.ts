import { Module } from '@nestjs/common';
import { YouthService } from './youth.service';
import { YouthController } from './youth.controller';

@Module({
    controllers: [YouthController],
    providers: [YouthService],
    exports: [YouthService],
})
export class YouthModule { }
