import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'SUB_ADMIN')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly uploadService: UploadService) { }

    @Post('image')
    @UseInterceptors(FileInterceptor('image'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        this.logger.log('📸 Image upload request received');

        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file type (MIME type)
        if (!this.uploadService.isImageFile(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
            );
        }

        // Validate file content (magic bytes) - security check
        const magicByteValidation = this.uploadService.validateMagicBytes(file.buffer);
        if (!magicByteValidation.valid) {
            this.logger.warn(`🚨 Magic byte validation failed for ${file.originalname}`);
            throw new BadRequestException(
                'File content does not match its extension. Upload rejected for security.'
            );
        }

        // Validate file size
        if (!this.uploadService.isValidFileSize(file.size)) {
            throw new BadRequestException(
                'File size too large. Maximum size is 5MB.'
            );
        }

        try {
            const imageUrl = await this.uploadService.uploadImage(file);

            return {
                success: true,
                imageUrl,
                message: 'Image uploaded successfully',
            };
        } catch (error: any) {
            // Log error and return user-friendly message
            this.logger.error(`Upload error: ${error.message}`);
            throw new BadRequestException(error.message || 'Failed to upload image to S3');
        }
    }
}
