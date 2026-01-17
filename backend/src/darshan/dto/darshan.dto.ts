import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

// ============================================
// SETTINGS DTOs
// ============================================

export class UpdateSettingDto {
    @IsString()
    value: string;
}

// ============================================
// AARTI SCHEDULE DTOs
// ============================================

export class CreateAartiDto {
    @IsString()
    name: string;

    @IsString()
    time: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateAartiDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    time?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ReorderAartiDto {
    @IsString({ each: true })
    ids: string[];
}

// ============================================
// DARSHAN IMAGE DTOs
// ============================================

export class CreateDarshanImageDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    url: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateDarshanImageDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    url?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
