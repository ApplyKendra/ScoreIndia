import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// @ts-ignore - Prisma v7 types may not match runtime
const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
    console.log('🌱 Seeding database...');

    // SECURITY: Get seed password from environment variable
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) {
        console.error('❌ SEED_ADMIN_PASSWORD environment variable is required for seeding');
        console.error('   Set it before running: export SEED_ADMIN_PASSWORD="YourSecurePassword123!"');
        process.exit(1);
    }

    if (seedPassword.length < 12) {
        console.error('❌ SEED_ADMIN_PASSWORD must be at least 12 characters');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(seedPassword, BCRYPT_ROUNDS);

    // Create or update SUPER_ADMIN account
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@iskconburla.com' },
        update: {
            role: Role.SUPER_ADMIN,
        },
        create: {
            email: 'admin@iskconburla.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: Role.SUPER_ADMIN,
            isEmailVerified: true,
            isActive: true,
        },
    });
    console.log(`✅ SUPER_ADMIN: ${superAdmin.email}`);

    // Create or update SUB_ADMIN account
    const subAdmin = await prisma.user.upsert({
        where: { email: 'manager@iskconburla.com' },
        update: {
            role: Role.SUB_ADMIN,
        },
        create: {
            email: 'manager@iskconburla.com',
            password: hashedPassword,
            name: 'Manager',
            role: Role.SUB_ADMIN,
            isEmailVerified: true,
            isActive: true,
        },
    });
    console.log(`✅ SUB_ADMIN: ${subAdmin.email}`);

    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   Password was set from SEED_ADMIN_PASSWORD environment variable.');
    console.log('   Admin accounts MUST change their password on first login.');
    console.log('   2FA setup will be required for admin access.');
    console.log('');
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
