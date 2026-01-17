import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, MaxLength, Min } from 'class-validator';

export class CreateStoreItemDto {
    @IsString()
    @MaxLength(200)
    name: string;

    @IsString()
    @MaxLength(2000)
    description: string;

    @IsString()
    categoryId: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayPrice?: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    language?: string;

    @IsString()
    @IsOptional()
    material?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;
}

export class UpdateStoreItemDto {
    @IsString()
    @IsOptional()
    @MaxLength(200)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    displayPrice?: number;

    @IsBoolean()
    @IsOptional()
    inStock?: boolean;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    language?: string;

    @IsString()
    @IsOptional()
    material?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;
}

export class StoreFilterDto {
    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    language?: string;

    @IsString()
    @IsOptional()
    material?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsBoolean()
    @IsOptional()
    inStock?: boolean;
}
