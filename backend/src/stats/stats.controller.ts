import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role, DonationStatus, EventStatus } from '@prisma/client';

@Controller('admin/stats')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.SUB_ADMIN)
export class StatsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getDashboardStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        const weekAgoStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgoStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        // Run all queries in parallel for performance
        const [
            totalUsers,
            usersLastMonth,
            todayOrders,
            yesterdayOrders,
            todayDonations,
            weekAgoDonations,
            activeEvents,
            recentOrders,
            recentDonations,
            recentUsers,
        ] = await Promise.all([
            // Total users count
            this.prisma.user.count({ where: { isActive: true } }),

            // Users created in last month
            this.prisma.user.count({
                where: {
                    isActive: true,
                    createdAt: { gte: monthAgoStart },
                },
            }),

            // Today's prasadam orders
            this.prisma.prasadamOrder.count({
                where: { createdAt: { gte: todayStart } },
            }),

            // Yesterday's orders
            this.prisma.prasadamOrder.count({
                where: {
                    createdAt: {
                        gte: yesterdayStart,
                        lt: todayStart,
                    },
                },
            }),

            // Today's donations total (VERIFIED status)
            this.prisma.donation.aggregate({
                where: {
                    createdAt: { gte: todayStart },
                    status: DonationStatus.VERIFIED,
                },
                _sum: { amount: true },
            }),

            // Last week's donations
            this.prisma.donation.aggregate({
                where: {
                    createdAt: { gte: weekAgoStart },
                    status: DonationStatus.VERIFIED,
                },
                _sum: { amount: true },
            }),

            // Active events (upcoming status)
            this.prisma.youthEvent.count({
                where: {
                    date: { gte: now },
                    status: EventStatus.UPCOMING,
                },
            }),

            // Recent orders (last 5)
            this.prisma.prasadamOrder.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                },
            }),

            // Recent donations (last 5)
            this.prisma.donation.findMany({
                take: 5,
                where: { status: DonationStatus.VERIFIED },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                },
            }),

            // Recent user registrations (last 5)
            this.prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, createdAt: true },
            }),
        ]);

        // Calculate trends
        const ordersTrend = yesterdayOrders > 0
            ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100)
            : todayOrders > 0 ? 100 : 0;

        const todayDonationsAmount = Number(todayDonations._sum?.amount || 0);
        const weekDonationsAmount = Number(weekAgoDonations._sum?.amount || 0);
        const dailyAvgLastWeek = weekDonationsAmount / 7;
        const donationsTrend = dailyAvgLastWeek > 0
            ? Math.round(((todayDonationsAmount - dailyAvgLastWeek) / dailyAvgLastWeek) * 100)
            : todayDonationsAmount > 0 ? 100 : 0;

        // Format recent activities
        const recentActivities = [
            ...recentOrders.map(order => ({
                id: order.id,
                type: 'order' as const,
                title: `Order #${order.id.slice(-6).toUpperCase()}`,
                description: `${order.user?.name || 'Guest'} placed an order`,
                time: order.createdAt,
                status: order.status,
            })),
            ...recentDonations.map(donation => ({
                id: donation.id,
                type: 'donation' as const,
                title: `Donation ₹${donation.amount}`,
                description: `${donation.user?.name || donation.name || 'Anonymous'} donated for ${donation.category || 'General'}`,
                time: donation.createdAt,
                status: 'completed',
            })),
            ...recentUsers.map(user => ({
                id: user.id,
                type: 'registration' as const,
                title: 'New Registration',
                description: `${user.name} joined as a devotee`,
                time: user.createdAt,
                status: 'new',
            })),
        ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10);

        return {
            stats: {
                totalUsers: {
                    value: totalUsers,
                    trend: usersLastMonth > 0 ? `+${usersLastMonth}` : '0',
                    trendLabel: 'new this month',
                },
                todayOrders: {
                    value: todayOrders,
                    trend: ordersTrend > 0 ? `+${ordersTrend}%` : `${ordersTrend}%`,
                    trendLabel: 'from yesterday',
                },
                todayDonations: {
                    value: todayDonationsAmount,
                    trend: donationsTrend > 0 ? `+${donationsTrend}%` : `${donationsTrend}%`,
                    trendLabel: 'vs last week avg',
                },
                activeEvents: {
                    value: activeEvents,
                    trend: activeEvents > 0 ? 'Upcoming' : 'None',
                    trendLabel: 'scheduled',
                },
            },
            recentActivities,
        };
    }
}
