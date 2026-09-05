import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.team_id = req.user.team_id;
    }
    if (req.user?.role === 'EMPLOYEE') {
      where.employee_id = req.user.id;
    }

    const assignments = await prisma.careAssignment.findMany({
      where,
      include: {
        customer: { select: { full_name: true, phone: true, address: true } },
        employee: { select: { full_name: true, phone: true } }
      },
      orderBy: { start_date: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  const { customer_id, employee_id, service_type, start_date, end_date, start_time, end_time, notes } = req.body;
  try {
    const assignment = await prisma.careAssignment.create({
      data: {
        customer_id,
        employee_id,
        service_type,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : undefined,
        start_time,
        end_time,
        notes,
        team_id: req.user?.team_id || req.body.team_id,
        status: 'ASSIGNED'
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ASSIGNMENT_CREATED',
        entity_type: 'CareAssignment',
        entity_id: assignment.id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS'
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'EMPLOYEE') {
      where.employee_id = req.user.id;
    }
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.team_id = req.user.team_id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        employee: { select: { full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'EMPLOYEE') {
      where.employee_id = req.user.id;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { full_name: true } } },
      orderBy: { date: 'desc' },
      take: 30
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const getTeamInvoices = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.customer = { team_id: req.user.team_id };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { full_name: true, phone: true } },
        payments: true
      },
      orderBy: { due_date: 'asc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};
