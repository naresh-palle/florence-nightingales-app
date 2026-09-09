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
    console.error('Stats error:', error);
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

export const seedMockData = async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findFirst() || await prisma.team.create({ data: { name: 'Mock Team' } });
    const cust = await prisma.customer.findFirst() || await prisma.customer.create({ data: { full_name: 'Mock Customer', phone: '123', email: 'c@m.com', address: '123 Main', team_id: team.id }});
    await prisma.invoice.createMany({
      data: [
        { customer_id: cust.id, invoice_number: 'INV-' + Date.now(), total_amount: 15000, status: 'PENDING', due_date: new Date(Date.now() + 86400000), service_period_start: new Date(), service_period_end: new Date(), billing_date: new Date() },
        { customer_id: cust.id, invoice_number: 'INV-' + (Date.now()+1), total_amount: 25000, status: 'PAID', due_date: new Date(Date.now() - 86400000), service_period_start: new Date(), service_period_end: new Date(), billing_date: new Date() }
      ]
    });
    await prisma.auditLog.createMany({
      data: [
        { action: 'LOGIN', entity_type: 'SYSTEM', entity_id: 'sys', actor_user_id: req.user?.id, result: 'SUCCESS' },
        { action: 'CREATE_INVOICE', entity_type: 'INVOICE', entity_id: 'inv1', actor_user_id: req.user?.id, result: 'SUCCESS' }
      ]
    });
    res.json({ message: 'Mock data seeded successfully! Please refresh the app.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed data', details: error });
  }
};
