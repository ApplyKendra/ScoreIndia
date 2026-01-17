import { IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreatePrasadamItemDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsString()
    categoryId: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxQuantityPerOrder?: number;

    @IsString()
    @IsOptional()
    slug?: string;
}

export class UpdatePrasadamItemDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxQuantityPerOrder?: number;
}
