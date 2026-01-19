import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { PrismaModule } from '../prisma';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [DonationController],
    providers: [DonationService],
    exports: [DonationService],
})
export class DonationModule { }
