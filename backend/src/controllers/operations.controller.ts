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
        patient: { select: { full_name: true, care_requirements: true } },
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

export const getPatients = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.customer = { team_id: req.user.team_id };
    }
    
    const patients = await prisma.patient.findMany({
      where,
      include: { customer: { select: { full_name: true, phone: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getEnquiries = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.assigned_team_id = req.user.team_id;
    }
    
    const enquiries = await prisma.enquiry.findMany({
      where,
      include: { assigned_team: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const catalog = await prisma.serviceCategory.findMany({
      include: { services: true },
      orderBy: { name: 'asc' }
    });
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service catalog' });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  const { enquiry_id, items, valid_until, notes } = req.body;
  try {
    // Basic calculation
    let total_amount = 0;
    const formattedItems = items.map((item: any) => {
      const lineTotal = item.quantity * item.unit_price;
      total_amount += lineTotal;
      return {
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: lineTotal,
        service_id: item.service_id
      };
    });

    const quotation = await prisma.quotation.create({
      data: {
        quotation_number: `QT-${Date.now()}`,
        total_amount,
        enquiry_id,
        valid_until: valid_until ? new Date(valid_until) : null,
        notes,
        items: {
          create: formattedItems
        }
      },
      include: { items: true }
    });

    await prisma.auditLog.create({
      data: { action: 'QUOTATION_CREATED', entity_type: 'Quotation', entity_id: quotation.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
};

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
       where.enquiry = { assigned_team_id: req.user.team_id };
    }

    const quotes = await prisma.quotation.findMany({
      where,
      include: {
        enquiry: { select: { customer_name: true, phone: true } },
        items: { include: { service: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
};
