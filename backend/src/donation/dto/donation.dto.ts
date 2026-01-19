import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum DonationPaymentMethod {
    UPI = 'UPI',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateDonationDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    pan?: string;

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
    category: string;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    amount: number;

    @IsEnum(DonationPaymentMethod)
    paymentMethod: DonationPaymentMethod;
}

export class UploadPaymentProofDto {
    @IsOptional()
    @IsString()
    transactionId?: string;

    @IsOptional()
    @IsString()
    uploadToken?: string;
}

export class VerifyDonationDto {
    @IsEnum(['VERIFIED', 'REJECTED'])
    status: 'VERIFIED' | 'REJECTED';

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
