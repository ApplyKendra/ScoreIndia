import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// About Us DTOs
// ============================================

export class UpdateAboutUsDto {
    @IsOptional()
    @IsString()
    heroTitle?: string;

    @IsOptional()
    @IsString()
    heroSubtitle?: string;

    @IsOptional()
    @IsString()
    heroImage?: string;

    @IsOptional()
    @IsString()
    mission?: string;

    @IsOptional()
    @IsString()
    missionImage?: string;

    @IsOptional()
    @IsString()
    vision?: string;

    @IsOptional()
    @IsString()
    history?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    historyImages?: string[];

    @IsOptional()
    @IsString()
    founderInfo?: string;

    @IsOptional()
    @IsString()
    founderImage?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

// ============================================
// Contact Us DTOs
// ============================================

export class UpdateContactUsDto {
    @IsOptional()
    @IsString()
    heroTitle?: string;

    @IsOptional()
    @IsString()
    heroSubtitle?: string;

    @IsOptional()
    @IsString()
    heroImage?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    phoneNumbers?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    emails?: string[];

    @IsOptional()
    @IsString()
    mapEmbedUrl?: string;

    @IsOptional()
    @IsString()
    timings?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

// ============================================
// Temple Construction DTOs
// ============================================

export class UpdateTempleConstructionDto {
    @IsOptional()
    @IsString()
    heroTitle?: string;

    @IsOptional()
    @IsString()
    heroSubtitle?: string;

    @IsOptional()
    @IsString()
    heroImage?: string;

    @IsOptional()
    @IsString()
    projectDescription?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    targetAmount?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    raisedAmount?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    progressImages?: string[];

    @IsOptional()
    @IsArray()
    phases?: Array<{
        name: string;
        description?: string;
        status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
        order: number;
    }>;

    @IsOptional()
    @IsString()
    donationLink?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

// ============================================
// Seva Opportunity DTOs
// ============================================

export class CreateSevaDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    amount?: number;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    displayOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateSevaDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    amount?: number;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    displayOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// ============================================
// Nitya Sevak DTOs
// ============================================

export class UpdateNityaSevakPageDto {
    @IsOptional()
    @IsString()
    heroTitle?: string;

    @IsOptional()
    @IsString()
    heroSubtitle?: string;

    @IsOptional()
    @IsString()
    heroImage?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    benefits?: string[];

    @IsOptional()
    @IsArray()
    membershipTiers?: Array<{
        name: string;
        amount: number;
        description?: string;
        benefits?: string[];
    }>;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

export class CreateNityaSevakApplicationDto {
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    pincode?: string;

    @IsString()
    selectedTier: string;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    amount: number;

    @IsOptional()
    @IsString()
    panNumber?: string;

    @IsOptional()
    @IsString()
    message?: string;
}

export class UpdateApplicationStatusDto {
    @IsString()
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
