import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    UpdateAboutUsDto,
    UpdateContactUsDto,
    UpdateTempleConstructionDto,
    CreateSevaDto,
    UpdateSevaDto,
    UpdateNityaSevakPageDto,
    CreateNityaSevakApplicationDto,
    UpdateApplicationStatusDto,
} from './dto';

@Injectable()
export class PagesService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // About Us
    // ============================================

    async getAboutUs() {
        let page = await this.prisma.aboutUsPage.findFirst();
        if (!page) {
            // Create default page if not exists
            page = await this.prisma.aboutUsPage.create({
                data: {
                    heroTitle: 'About ISKCON Burla',
                    heroSubtitle: 'Spreading the message of Krishna consciousness',
                    mission: 'To systematically propagate spiritual knowledge to society at large and to educate all people in the techniques of spiritual life.',
                    vision: 'A peaceful and prosperous world through spiritual enlightenment.',
                },
            });
        }
        return page;
    }

    async updateAboutUs(dto: UpdateAboutUsDto, userId?: string) {
        let page = await this.prisma.aboutUsPage.findFirst();
        if (page) {
            return this.prisma.aboutUsPage.update({
                where: { id: page.id },
                data: { ...dto, updatedBy: userId },
            });
        }
        return this.prisma.aboutUsPage.create({
            data: { ...dto, updatedBy: userId },
        });
    }

    // ============================================
    // Contact Us
    // ============================================

    async getContactUs() {
        let page = await this.prisma.contactUsPage.findFirst();
        if (!page) {
            page = await this.prisma.contactUsPage.create({
                data: {
                    heroTitle: 'Contact Us',
                    heroSubtitle: 'We would love to hear from you',
                    address: 'ISKCON Burla, Near VSS University, Burla, Sambalpur, Odisha - 768018',
                    phoneNumbers: ['+91 9876543210'],
                    emails: ['info@iskconburla.org'],
                    timings: 'Temple Open: 4:30 AM - 1:00 PM, 4:00 PM - 8:30 PM',
                },
            });
        }
        return page;
    }

    async updateContactUs(dto: UpdateContactUsDto, userId?: string) {
        let page = await this.prisma.contactUsPage.findFirst();
        if (page) {
            return this.prisma.contactUsPage.update({
                where: { id: page.id },
                data: { ...dto, updatedBy: userId },
            });
        }
        return this.prisma.contactUsPage.create({
            data: { ...dto, updatedBy: userId },
        });
    }

    // ============================================
    // Temple Construction
    // ============================================

    async getTempleConstruction() {
        let page = await this.prisma.templeConstructionPage.findFirst();
        if (!page) {
            page = await this.prisma.templeConstructionPage.create({
                data: {
                    heroTitle: 'New Temple Construction',
                    heroSubtitle: 'Help us build a magnificent temple for Lord Krishna',
                    projectDescription: 'Join us in building a grand temple that will serve as a spiritual haven for generations to come.',
                    targetAmount: 50000000, // 5 Crore
                    raisedAmount: 0,
                    phases: [
                        { name: 'Land Acquisition', status: 'COMPLETED', order: 1 },
                        { name: 'Foundation', status: 'IN_PROGRESS', order: 2 },
                        { name: 'Structure', status: 'PLANNED', order: 3 },
                        { name: 'Interior', status: 'PLANNED', order: 4 },
                    ],
                },
            });
        }
        return page;
    }

    async updateTempleConstruction(dto: UpdateTempleConstructionDto, userId?: string) {
        let page = await this.prisma.templeConstructionPage.findFirst();
        if (page) {
            return this.prisma.templeConstructionPage.update({
                where: { id: page.id },
                data: { ...dto, updatedBy: userId },
            });
        }
        return this.prisma.templeConstructionPage.create({
            data: { ...dto, updatedBy: userId },
        });
    }

    // ============================================
    // Seva Opportunities
    // ============================================

    async getAllSeva(includeInactive = false) {
        return this.prisma.sevaOpportunity.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }

    async getSevaById(id: string) {
        const seva = await this.prisma.sevaOpportunity.findUnique({ where: { id } });
        if (!seva) throw new NotFoundException('Seva opportunity not found');
        return seva;
    }

    async createSeva(dto: CreateSevaDto, userId?: string) {
        return this.prisma.sevaOpportunity.create({
            data: { ...dto, createdBy: userId },
        });
    }

    async updateSeva(id: string, dto: UpdateSevaDto) {
        await this.getSevaById(id);
        return this.prisma.sevaOpportunity.update({
            where: { id },
            data: dto,
        });
    }

    async deleteSeva(id: string) {
        await this.getSevaById(id);
        return this.prisma.sevaOpportunity.delete({ where: { id } });
    }

    // ============================================
    // Nitya Sevak
    // ============================================

    async getNityaSevakPage() {
        let page = await this.prisma.nityaSevakPage.findFirst();
        if (!page) {
            page = await this.prisma.nityaSevakPage.create({
                data: {
                    heroTitle: 'Become a Nitya Sevak',
                    heroSubtitle: 'Life Patron Membership Program',
                    description: 'Join our exclusive life patron program and receive special blessings while supporting the temple\'s activities.',
                    benefits: [
                        'Special darshan during festivals',
                        'Name inscription on temple plaque',
                        'Prasadam distribution on special occasions',
                        'Regular spiritual updates',
                        'Priority seating during programs',
                    ],
                    membershipTiers: [
                        { name: 'Silver', amount: 11000, description: 'Basic membership' },
                        { name: 'Gold', amount: 51000, description: 'Enhanced benefits' },
                        { name: 'Platinum', amount: 101000, description: 'Premium membership' },
                        { name: 'Diamond', amount: 501000, description: 'Exclusive lifetime benefits' },
                    ],
                },
            });
        }
        return page;
    }

    async updateNityaSevakPage(dto: UpdateNityaSevakPageDto, userId?: string) {
        let page = await this.prisma.nityaSevakPage.findFirst();
        if (page) {
            return this.prisma.nityaSevakPage.update({
                where: { id: page.id },
                data: { ...dto, updatedBy: userId },
            });
        }
        return this.prisma.nityaSevakPage.create({
            data: { ...dto, updatedBy: userId },
        });
    }

    async createNityaSevakApplication(dto: CreateNityaSevakApplicationDto) {
        return this.prisma.nityaSevakApplication.create({
            data: dto,
        });
    }

    async getAllApplications(status?: string) {
        return this.prisma.nityaSevakApplication.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
        });
    }

    async getApplicationById(id: string) {
        const app = await this.prisma.nityaSevakApplication.findUnique({ where: { id } });
        if (!app) throw new NotFoundException('Application not found');
        return app;
    }

    async updateApplicationStatus(id: string, dto: UpdateApplicationStatusDto) {
        await this.getApplicationById(id);
        return this.prisma.nityaSevakApplication.update({
            where: { id },
            data: { status: dto.status },
        });
    }
}
