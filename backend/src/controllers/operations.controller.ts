import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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

// ── CARE-C WORKFLOW CONTROLLERS ───────────────────────────────────────────────

export const markCareCAttendance = async (req: Request, res: Response) => {
  const { caregiver_id, client_id, assignment_id, status, billing_rule, date } = req.body;
  try {
    const attDate = date ? new Date(date) : new Date();
    attDate.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { employee_id: caregiver_id, date: attDate }
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          location_data: JSON.stringify({ status, billing_rule, assignment_id, client_id })
        }
      });
    } else {
      await prisma.attendance.create({
        data: {
          employee_id: caregiver_id,
          date: attDate,
          check_in: status === 'PRESENT' ? new Date() : null,
          location_data: JSON.stringify({ status, billing_rule, assignment_id, client_id })
        }
      });
    }

    if (status === 'ABSENT' && billing_rule === 'DEDUCT_FROM_BILL' && assignment_id) {
      const assignment = await prisma.careAssignment.findUnique({
        where: { id: assignment_id },
        include: { customer: true }
      });
      if (assignment) {
        const inv = await prisma.invoice.findFirst({
          where: { customer_id: assignment.customer_id, status: { in: ['ISSUED', 'PENDING', 'PARTIALLY_PAID'] } },
          orderBy: { created_at: 'desc' }
        });
        if (inv) {
          const dailyRate = Math.round(Number(inv.total_amount) / 30);
          const newTotal = Math.max(0, Number(inv.total_amount) - dailyRate);
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              total_amount: new Decimal(newTotal),
              notes: `${inv.notes || ''} [Absence deduction 1 day: -₹${dailyRate}]`
            }
          });
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'ATTENDANCE_MARKED',
        entity_type: 'ATTENDANCE',
        entity_id: caregiver_id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ status, billing_rule, date: attDate })
      }
    });

    res.json({ message: 'Attendance recorded successfully', status, billing_rule });
  } catch (error) {
    console.error('Attendance mark error:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
};

export const convertEnquiryToClient = async (req: Request, res: Response) => {
  const { enquiry_id, full_name, phone, email, address, patient_name, patient_age, patient_gender, conditions, family_contact, family_relation, team_id } = req.body;
  try {
    const enq = await prisma.enquiry.findUnique({ where: { id: enquiry_id } });
    if (!enq) return res.status(404).json({ error: 'Enquiry not found' });

    let defaultTeam = await prisma.team.findFirst();
    const finalTeamId = team_id || enq.assigned_team_id || defaultTeam?.id;

    const customer = await prisma.customer.create({
      data: {
        full_name: full_name || enq.customer_name,
        phone: phone || enq.phone,
        email: email || enq.email,
        address: address || enq.location,
        emergency_contact: family_contact ? `${family_contact} (${family_relation || 'Family'})` : null,
        service_type: enq.service_required || 'Home Care',
        customer_number: `CUS-${(phone || enq.phone).slice(-4)}`,
        status: 'ACTIVE',
        team_id: finalTeamId!,
        notes: `Converted from Enquiry #${enq.enquiry_number}`
      }
    });

    const patient = await prisma.patient.create({
      data: {
        patient_number: `PAT-${(phone || enq.phone).slice(-4)}`,
        full_name: patient_name || `${customer.full_name} (Patient)`,
        age: patient_age ? Number(patient_age) : undefined,
        gender: patient_gender,
        care_requirements: conditions || enq.notes,
        address: customer.address,
        customer_id: customer.id
      }
    });

    await prisma.enquiry.update({
      where: { id: enquiry_id },
      data: { status: 'CONVERTED' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ENQUIRY_CONVERTED',
        entity_type: 'CUSTOMER',
        entity_id: customer.id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ enquiry_id, customer_id: customer.id })
      }
    });

    res.status(201).json({ message: 'Enquiry converted to client successfully', customer, patient });
  } catch (error) {
    console.error('Convert enquiry error:', error);
    res.status(500).json({ error: 'Failed to convert enquiry to client' });
  }
};

export const createCareCPlacement = async (req: Request, res: Response) => {
  const { customer_id, employee_id, shift_type, client_rate, caregiver_rate, start_date } = req.body;
  try {
    const cust = await prisma.customer.findUnique({
      where: { id: customer_id },
      include: { patients: true }
    });
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = new Date(startDate.getTime() + 30 * 86400000);
    const margin = Number(client_rate) - Number(caregiver_rate);
    const asgNumber = `PLC-${Date.now().toString().slice(-4)}`;

    const assignment = await prisma.careAssignment.create({
      data: {
        assignment_number: asgNumber,
        customer_id: cust.id,
        patient_id: cust.patients[0]?.id || null,
        employee_id,
        service_type: shift_type || '12h day',
        start_date: startDate,
        end_date: endDate,
        status: 'IN_PROGRESS',
        team_id: cust.team_id,
        notes: JSON.stringify({ shift_type, client_rate, caregiver_rate, margin })
      }
    });

    const invNumber = `FN-INV-2026-${Date.now().toString().slice(-4)}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invNumber,
        service_period_start: startDate,
        service_period_end: endDate,
        billing_date: startDate,
        due_date: new Date(startDate.getTime() + 7 * 86400000),
        total_amount: new Decimal(client_rate),
        status: 'ISSUED',
        customer_id: cust.id,
        notes: `Initial invoice for placement ${asgNumber} (${shift_type})`
      }
    });

    res.status(201).json({ message: 'Placement created and initial invoice raised', assignment, invoice });
  } catch (error) {
    console.error('Create placement error:', error);
    res.status(500).json({ error: 'Failed to create placement' });
  }
};

export const replacePlacementCaregiver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_employee_id } = req.body;
  try {
    const placement = await prisma.careAssignment.update({
      where: { id },
      data: { employee_id: new_employee_id }
    });
    res.json({ message: 'Caregiver replaced successfully', placement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to replace caregiver' });
  }
};

export const removePlacementCaregiver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { days_unserved } = req.body;
  try {
    const placement = await prisma.careAssignment.findUnique({
      where: { id },
      include: { customer: true }
    });
    if (!placement) return res.status(404).json({ error: 'Placement not found' });

    await prisma.careAssignment.update({
      where: { id },
      data: { employee_id: null, status: 'COMPLETED' }
    });

    let credit = 0;
    if (days_unserved) {
      const inv = await prisma.invoice.findFirst({
        where: { customer_id: placement.customer_id, status: { in: ['ISSUED', 'PENDING', 'PARTIALLY_PAID'] } },
        orderBy: { created_at: 'desc' }
      });
      if (inv) {
        credit = Math.round((Number(inv.total_amount) / 30) * Number(days_unserved));
        const newTotal = Math.max(0, Number(inv.total_amount) - credit);
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            total_amount: new Decimal(newTotal),
            notes: `${inv.notes || ''} [Pro-rated credit for ${days_unserved} days: -₹${credit}]`
          }
        });
      }
    }

    res.json({ message: 'Caregiver removed and bill adjusted', pro_rated_credit: credit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove caregiver' });
  }
};

export const renewPlacement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { client_rate, caregiver_rate, shift_type } = req.body;
  try {
    const current = await prisma.careAssignment.findUnique({
      where: { id },
      include: { customer: true }
    });
    if (!current) return res.status(404).json({ error: 'Placement not found' });

    const newStart = current.end_date || new Date();
    const newEnd = new Date(newStart.getTime() + 30 * 86400000);

    const renewed = await prisma.careAssignment.update({
      where: { id },
      data: {
        start_date: newStart,
        end_date: newEnd,
        status: 'IN_PROGRESS',
        notes: JSON.stringify({ shift_type: shift_type || current.service_type, client_rate, caregiver_rate })
      }
    });

    const invNumber = `FN-INV-2026-${Date.now().toString().slice(-4)}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invNumber,
        service_period_start: newStart,
        service_period_end: newEnd,
        billing_date: newStart,
        due_date: new Date(newStart.getTime() + 7 * 86400000),
        total_amount: new Decimal(client_rate || 30000),
        status: 'ISSUED',
        customer_id: current.customer_id,
        notes: `Renewal invoice for placement #${current.assignment_number || current.id}`
      }
    });

    res.json({ message: 'Placement renewed into new billing cycle', renewed, invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to renew placement' });
  }
};

export const closePlacementService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, end_date } = req.body;
  try {
    const closed = await prisma.careAssignment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        employee_id: null,
        end_date: end_date ? new Date(end_date) : new Date(),
        notes: `Service closed. Reason: ${reason || 'Contract ended'}`
      }
    });
    res.json({ message: 'Service closed and caregivers freed', closed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close service' });
  }
};

export const getMoneyToCollect = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['ISSUED', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: {
        customer: true,
        payments: { where: { status: 'CONFIRMED' } }
      },
      orderBy: { due_date: 'asc' }
    });

    const now = new Date();
    const result = invoices.map(inv => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const balance = Number(inv.total_amount) - paid;
      const isOverdue = inv.status === 'OVERDUE' || inv.due_date < now;
      const daysOverdue = isOverdue ? Math.max(1, Math.round((now.getTime() - inv.due_date.getTime()) / 86400000)) : 0;
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_id: inv.customer_id,
        customer_name: inv.customer?.full_name,
        customer_phone: inv.customer?.phone,
        total_amount: Number(inv.total_amount),
        paid_amount: paid,
        balance_due: balance,
        due_date: inv.due_date,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
        status: inv.status
      };
    }).filter(i => i.balance_due > 0);

    const totalToCollect = result.reduce((s, i) => s + i.balance_due, 0);
    res.json({ total: totalToCollect, items: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch to-collect balances' });
  }
};

export const getMoneyToPay = async (req: Request, res: Response) => {
  try {
    const caregivers = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', status: 'ACTIVE' },
      include: {
        attendance: true,
        assignments: { where: { status: 'IN_PROGRESS' } }
      }
    });

    const items = caregivers.map(cg => {
      const isPlaced = cg.assignments.length > 0;
      const daysWorked = cg.attendance.length || 22;
      const monthlyRate = 18000;
      const dailyRate = Math.round(monthlyRate / 30);
      const accruedPay = daysWorked * dailyRate;
      return {
        id: cg.id,
        name: cg.full_name,
        phone: cg.phone,
        role: cg.designation || 'Caregiver',
        status: isPlaced ? 'Placed' : 'Free',
        days_worked: daysWorked,
        monthly_rate: monthlyRate,
        payable_amount: accruedPay,
        advance_paid: 3000
      };
    });

    const totalToPay = items.reduce((s, i) => s + i.payable_amount, 0);
    res.json({ total: totalToPay, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch to-pay amounts' });
  }
};

export const recordCaregiverPayout = async (req: Request, res: Response) => {
  const { caregiver_id, amount, method, is_advance, note } = req.body;
  try {
    await prisma.auditLog.create({
      data: {
        action: is_advance ? 'CAREGIVER_ADVANCE_PAID' : 'CAREGIVER_SALARY_PAID',
        entity_type: 'USER',
        entity_id: caregiver_id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ amount, method, note })
      }
    });
    res.json({ message: 'Payout recorded successfully', amount, method });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payout' });
  }
};

