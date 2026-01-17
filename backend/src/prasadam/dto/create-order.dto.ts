import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryType } from '@prisma/client';

class OrderItemDto {
    @IsString()
    itemId: string;

    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsString()
    @IsOptional()
    deliveryAddress?: string;

    @IsString()
    @IsOptional()
    deliveryPhone?: string;

    @IsString()
    @IsOptional()
    instructions?: string;
}
