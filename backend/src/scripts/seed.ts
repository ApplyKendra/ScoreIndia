import 'dotenv/config';
import { PrismaClient, Role, DeliveryType, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create Users (Super Admin, Sub Admin, User)
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Password123!', salt);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@iskcon.org' },
        update: {},
        create: {
            email: 'admin@iskcon.org',
            name: 'Super Admin',
            password,
            role: Role.SUPER_ADMIN,
            phone: '9999999999',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log(`Created Super Admin: ${superAdmin.email}`);

    const subAdmin = await prisma.user.upsert({
        where: { email: 'manager@iskcon.org' },
        update: {},
        create: {
            email: 'manager@iskcon.org',
            name: 'Temple Manager',
            password,
            role: Role.SUB_ADMIN,
            phone: '8888888888',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log(`Created Sub Admin: ${subAdmin.email}`);

    const user = await prisma.user.upsert({
        where: { email: 'devotee@iskcon.org' },
        update: {},
        create: {
            email: 'devotee@iskcon.org',
            name: 'Ram Das',
            password,
            role: Role.USER,
            phone: '7777777777',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log(`Created User: ${user.email}`);

    // 2. Create Prasadam Categories & Items
    const breakfastCat = await prisma.prasadamCategory.upsert({
        where: { name: 'Breakfast' },
        update: {},
        create: {
            name: 'Breakfast',
            description: 'Morning prasadam to start your day',
            displayOrder: 1,
            imageUrl: 'https://images.unsplash.com/photo-1595460592815-565c40134421?q=80&w=300&auto=format&fit=crop',
        },
    });

    const lunchCat = await prisma.prasadamCategory.upsert({
        where: { name: 'Govinda\'s Thali' },
        update: {},
        create: {
            name: 'Govinda\'s Thali',
            description: 'Full wholesome meal with rice, dal, sabji, roti, and sweet',
            displayOrder: 2,
            imageUrl: 'https://images.unsplash.com/photo-1626202158863-7e452932dc23?q=80&w=300&auto=format&fit=crop',
        },
    });

    // Items
    await prisma.prasadamItem.upsert({
        where: { slug: 'masala-dosa' },
        update: {},
        create: {
            name: 'Masala Dosa',
            description: 'Crispy rice crepe filled with spiced potato',
            price: 120,
            categoryId: breakfastCat.id,
            slug: 'masala-dosa',
            imageUrl: 'https://images.unsplash.com/photo-1589301760014-d9296897fba9?q=80&w=300&auto=format&fit=crop',
            maxQuantityPerOrder: 5,
        },
    });

    await prisma.prasadamItem.upsert({
        where: { slug: 'raj-bhog-thali' },
        update: {},
        create: {
            name: 'Raj Bhog Thali',
            description: 'Standard thali with Paneer Sabji, Dal Fry, Jeera Rice, 2 Rotis, Salad, and Gulab Jamun',
            price: 250,
            categoryId: lunchCat.id,
            slug: 'raj-bhog-thali',
            imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f5816029bd?q=80&w=300&auto=format&fit=crop',
            maxQuantityPerOrder: 10,
        },
    });
    console.log('Created Prasadam Menu');

    // 3. Create Store Categories & Items
    const booksCat = await prisma.storeCategory.upsert({
        where: { name: 'Books' },
        update: {},
        create: { name: 'Books', description: 'Transcendental literature by Srila Prabhupada' },
    });

    await prisma.storeItem.upsert({
        where: { slug: 'bhagavad-gita-as-it-is' },
        update: {},
        create: {
            name: 'Bhagavad Gita As It Is',
            description: 'The world\'s most popular edition of the Gita.',
            displayPrice: 350,
            categoryId: booksCat.id,
            slug: 'bhagavad-gita-as-it-is',
            inStock: true,
            isFeatured: true,
            author: 'A.C. Bhaktivedanta Swami Prabhupada',
            language: 'English',
        },
    });
    console.log('Created Store Items');

    // 4. Create Youth Event
    await prisma.youthEvent.create({
        data: {
            title: 'Sunday Youth Retreat',
            description: 'A day of kirtan, philosophy, and prasadam for youth.',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
            location: 'Temple Hall',
            status: 'UPCOMING',
            isFeatured: true,
            slug: `sunday-retreat-${Date.now()}`, // Unique slug
        },
    });
    console.log('Created Youth Event');

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
