import { IsString, IsOptional, IsBoolean, IsInt, IsUrl, Min } from 'class-validator';

export class CreateHeroSlideDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsString()
    imageUrl: string;

    @IsString()
    @IsOptional()
    buttonText?: string;

    @IsString()
    @IsOptional()
    buttonLink?: string;

    @IsString()
    @IsOptional()
    gradient?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateHeroSlideDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    buttonText?: string;

    @IsString()
    @IsOptional()
    buttonLink?: string;

    @IsString()
    @IsOptional()
    gradient?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ReorderSlidesDto {
    @IsString({ each: true })
    slideIds: string[];
}
