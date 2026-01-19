import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateDonationDto, UploadPaymentProofDto, VerifyDonationDto } from './dto/donation.dto';
import * as crypto from 'crypto';

// Status type defined locally until Prisma migration is run
type DonationStatusType = 'PENDING' | 'PAYMENT_UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

@Injectable()
export class DonationService {
    constructor(private prisma: PrismaService) { }

    private generateDonationId(): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `DON-${timestamp}${random}`;
    }

    private generateReceiptNumber(): string {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `RCPT-${year}-${random}`;
    }

    async create(dto: CreateDonationDto, userId?: string) {
        const donationId = this.generateDonationId();
        const uploadToken = crypto.randomUUID(); // Security token for guest uploads
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        const donation = await this.prisma.donation.create({
            data: {
                donationId,
                uploadToken: userId ? null : uploadToken, // Only for guests
                userId: userId || null,
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                pan: dto.pan,
                address: dto.address,
                city: dto.city,
                pincode: dto.pincode,
                category: dto.category,
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
                expiresAt,
                status: 'PENDING',
            },
        });

        // Return uploadToken only for guests (for proof upload)
        return {
            ...donation,
            uploadToken: userId ? undefined : uploadToken,
        };
    }

    async uploadPaymentProof(
        donationId: string,
        paymentProofUrl: string,
        dto: UploadPaymentProofDto,
        userId?: string,
    ) {
        const donation = await this.prisma.donation.findUnique({
            where: { donationId },
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        // Check if user owns this donation (if logged in)
        if (userId && donation.userId && donation.userId !== userId) {
            throw new BadRequestException('You do not have permission to update this donation');
        }

        // For guests: require valid uploadToken
        if (!userId && donation.uploadToken) {
            if (!dto.uploadToken || dto.uploadToken !== donation.uploadToken) {
                throw new BadRequestException('Invalid or missing upload token');
            }
        }

        // Check if expired
        if (new Date() > donation.expiresAt && donation.status === 'PENDING') {
            await this.prisma.donation.update({
                where: { donationId },
                data: { status: 'EXPIRED' },
            });
            throw new BadRequestException('Payment window has expired. Please create a new donation.');
        }

        if (donation.status !== 'PENDING') {
            throw new BadRequestException('This donation has already been processed');
        }

        return this.prisma.donation.update({
            where: { donationId },
            data: {
                paymentProofUrl,
                transactionId: dto.transactionId,
                status: 'PAYMENT_UPLOADED',
            },
        });
    }

    async getMyDonations(userId: string, userEmail?: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        // Search by userId OR by email (for guest donations)
        const where = userEmail
            ? { OR: [{ userId }, { email: userEmail }] }
            : { userId };

        const [donations, total] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donation.count({ where }),
        ]);

        return {
            data: donations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getDonationByEmail(email: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [donations, total] = await Promise.all([
            this.prisma.donation.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.donation.count({ where: { email } }),
        ]);

        return {
            data: donations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getDonationById(donationId: string) {
        const donation = await this.prisma.donation.findUnique({
            where: { donationId },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        return donation;
    }

    // Public receipt - returns only safe data (no PII like phone, PAN, address)
    async getPublicReceipt(donationId: string) {
        const donation = await this.prisma.donation.findUnique({
            where: { donationId },
            select: {
                donationId: true,
                name: true,           // Name is ok for receipts
                email: true,          // Email is ok for receipts
                category: true,
                amount: true,
                paymentMethod: true,
                status: true,
                receiptNumber: true,
                transactionId: true,
                createdAt: true,
                verifiedAt: true,
            },
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        // Only return receipt data for VERIFIED donations
        if (donation.status !== 'VERIFIED') {
            throw new BadRequestException('Receipt is only available for verified donations');
        }

        return donation;
    }

    // Admin methods
    async getAllDonations(page = 1, limit = 20, status?: DonationStatusType) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const [donations, total] = await Promise.all([
            this.prisma.donation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { user: { select: { name: true, email: true } } },
            }),
            this.prisma.donation.count({ where }),
        ]);

        return {
            data: donations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async verifyDonation(donationId: string, dto: VerifyDonationDto, adminId: string) {
        const donation = await this.prisma.donation.findUnique({
            where: { donationId },
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        if (donation.status !== 'PAYMENT_UPLOADED') {
            throw new BadRequestException('Only donations with uploaded payment proof can be verified');
        }

        const updateData: any = {
            status: dto.status,
            verifiedAt: new Date(),
            verifiedBy: adminId,
        };

        if (dto.status === 'VERIFIED') {
            updateData.receiptNumber = this.generateReceiptNumber();
        } else if (dto.status === 'REJECTED') {
            updateData.rejectionReason = dto.rejectionReason;
        }

        return this.prisma.donation.update({
            where: { donationId },
            data: updateData,
        });
    }

    async getStats() {
        const [total, verified, pending, uploaded] = await Promise.all([
            this.prisma.donation.count(),
            this.prisma.donation.count({ where: { status: 'VERIFIED' } }),
            this.prisma.donation.count({ where: { status: 'PENDING' } }),
            this.prisma.donation.count({ where: { status: 'PAYMENT_UPLOADED' } }),
        ]);

        const totalAmount = await this.prisma.donation.aggregate({
            where: { status: 'VERIFIED' },
            _sum: { amount: true },
        });

        return {
            total,
            verified,
            pending,
            uploaded,
            totalVerifiedAmount: totalAmount._sum.amount || 0,
        };
    }
}
