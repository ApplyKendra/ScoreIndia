import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @MaxLength(5000)
    description: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsDateString()
    date: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @MaxLength(200)
    location: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    venue?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxParticipants?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    registrationFee?: number;

    @IsDateString()
    @IsOptional()
    registrationEnd?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    preJoinedCount?: number;
}

export class UpdateEventDto {
    @IsString()
    @IsOptional()
    @MaxLength(200)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(5000)
    description?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    location?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    venue?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxParticipants?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    registrationFee?: number;

    @IsDateString()
    @IsOptional()
    registrationEnd?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    preJoinedCount?: number;
}

export class RegisterEventDto {
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    dietaryReq?: string;
}

export class GuestRegisterEventDto {
    @IsString()
    guestName: string;

    @IsString()
    @IsOptional()
    guestEmail?: string;

    @IsString()
    phone: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    dietaryReq?: string;
}
