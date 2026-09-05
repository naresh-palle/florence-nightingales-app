import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const getTeamLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.user.findMany({
      where: { role: Role.TEAM_LEAD },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team leads' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { full_name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getOrganizationStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalTeams, totalCustomers, totalInvoices, pendingPayments] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.team.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } }
      })
    ]);

    res.json({
      totalUsers,
      totalTeams,
      totalCustomers,
      totalInvoices,
      pendingAmount: pendingPayments._sum.total_amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: { select: { full_name: true, phone: true } },
        payments: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};
