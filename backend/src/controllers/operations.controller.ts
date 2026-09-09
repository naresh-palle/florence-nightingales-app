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

export const getShifts = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'EMPLOYEE') {
      where.employee_id = req.user.id;
    } else if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.assignment = { team_id: req.user.team_id };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        assignment: {
          include: { patient: { select: { full_name: true, address: true, care_requirements: true } } }
        },
        employee: { select: { full_name: true } }
      },
      orderBy: { shift_date: 'asc' }
    });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

export const checkInShift = async (req: Request, res: Response) => {
  try {
    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        actual_start: new Date(),
        status: 'IN_PROGRESS'
      }
    });
    
    await prisma.auditLog.create({
      data: { action: 'SHIFT_CHECKIN', entity_type: 'SHIFT', entity_id: shift.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });
    
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
};

export const checkOutShift = async (req: Request, res: Response) => {
  try {
    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        actual_end: new Date(),
        status: 'COMPLETED'
      }
    });
    
    await prisma.attendance.create({
      data: {
        employee_id: req.user!.id,
        date: new Date(),
        check_in: shift.actual_start,
        check_out: shift.actual_end
      }
    });

    await prisma.auditLog.create({
      data: { action: 'SHIFT_CHECKOUT', entity_type: 'SHIFT', entity_id: shift.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });
    
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
};

export const requestLeave = async (req: Request, res: Response) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        employee_id: req.user!.id,
        leave_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        reason
      }
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to request leave' });
  }
};

export const getIncidents = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'EMPLOYEE') {
      where.reported_by_id = req.user.id;
    } else if (req.user?.role === 'TEAM_LEAD' && req.user.team_id) {
      where.assignment = { team_id: req.user.team_id };
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reported_by: { select: { full_name: true } },
        assigned_to: { select: { full_name: true } },
        assignment: { select: { patient: { select: { full_name: true } } } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

export const createIncident = async (req: Request, res: Response) => {
  const { title, description, severity, assignment_id } = req.body;
  try {
    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity: severity || 'LOW',
        reported_by_id: req.user!.id,
        assignment_id
      }
    });

    await prisma.auditLog.create({
      data: { action: 'INCIDENT_CREATED', entity_type: 'INCIDENT', entity_id: incident.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
};

export const getAvailableReplacements = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.id;
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { assignment: { include: { team: true } }, employee: true }
    });

    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    // Find employees in the same team who are active and not currently scheduled for a conflicting shift
    const teamMembers = await prisma.user.findMany({
      where: {
        team_id: shift.assignment.team_id,
        role: shift.employee.role,
        status: 'ACTIVE',
        id: { not: shift.employee_id }
      },
      include: {
        shifts: {
          where: {
            shift_date: shift.shift_date,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
          }
        }
      }
    });

    // Simple conflict check (can be improved with exact time overlaps)
    const available = teamMembers.filter(m => m.shifts.length === 0);
    
    res.json(available.map(u => ({ id: u.id, full_name: u.full_name, phone: u.phone, role: u.role })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to find replacements' });
  }
};

export const reassignShift = async (req: Request, res: Response) => {
  const { new_employee_id } = req.body;
  try {
    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: { employee_id: new_employee_id, status: 'SCHEDULED', actual_start: null, actual_end: null }
    });

    await prisma.auditLog.create({
      data: { action: 'SHIFT_REASSIGNED', entity_type: 'SHIFT', entity_id: shift.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });

    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reassign shift' });
  }
};
