import { Module } from '@nestjs/common';
import { DarshanController } from './darshan.controller';
import { DarshanService } from './darshan.service';
import { PrismaModule } from '../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [DarshanController],
    providers: [DarshanService],
    exports: [DarshanService],
})
export class DarshanModule { }
