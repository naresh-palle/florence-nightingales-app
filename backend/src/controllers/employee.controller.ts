import { Request, Response } from 'express';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Add Employee (Admin or Authorized Team Lead)
export const createEmployee = async (req: Request, res: Response) => {
  const { full_name, email, phone, designation, qualification, experience, joining_date } = req.body;

  try {
    // If the requester is a Team Lead, the employee must be added to their own team.
    // If the requester is an Admin, they must specify a team_id in the body.
    let targetTeamId = req.user?.team_id;

    if (req.user?.role === Role.ADMIN) {
      targetTeamId = req.body.team_id;
      if (!targetTeamId) {
        return res.status(400).json({ error: 'Admin must specify a team_id when creating an employee' });
      }
    } else if (!targetTeamId) {
       return res.status(400).json({ error: 'Team Lead is not currently assigned to a team' });
    }

    const newEmployee = await prisma.user.create({
      data: {
        full_name,
        email,
        phone,
        designation,
        qualification,
        experience,
        joining_date: joining_date ? new Date(joining_date) : null,
        role: Role.EMPLOYEE,
        status: UserStatus.PENDING, // Pending until they set their password
        team_id: targetTeamId
      }
    });

    const activationToken = crypto.randomBytes(32).toString('hex');
    // TODO: Send activation email/SMS

    await prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_CREATED',
        entity_type: 'USER',
        entity_id: newEmployee.id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ team_id: targetTeamId })
      }
    });

    res.status(201).json({ 
      message: 'Employee account created in pending state. Activation instructions sent.',
      employee: { id: newEmployee.id, email: newEmployee.email, team_id: newEmployee.team_id }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Employee' });
  }
};

// Get Employees (Team Leads only see their own)
export const getEmployees = async (req: Request, res: Response) => {
  try {
    let whereClause = {};
    
    // Enforce Team Scope at the database query level
    if (req.user?.role === Role.TEAM_LEAD) {
      whereClause = { team_id: req.user.team_id, role: Role.EMPLOYEE };
    } else if (req.user?.role === Role.ADMIN) {
      whereClause = { role: Role.EMPLOYEE };
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true, full_name: true, email: true, phone: true, designation: true, status: true, team_id: true
      }
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Deactivate Employee (Soft Delete)
export const deactivateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const employee = await prisma.user.findUnique({ where: { id } });

    if (!employee || employee.role !== Role.EMPLOYEE) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Strict Authorization Check: Can this Team Lead deactivate this specific employee?
    if (req.user?.role === Role.TEAM_LEAD && employee.team_id !== req.user.team_id) {
       await prisma.auditLog.create({
        data: { action: 'UNAUTHORIZED_ACCESS_ATTEMPT', entity_type: 'USER', entity_id: id, actor_user_id: req.user.id, result: 'DENIED' }
      });
      return res.status(403).json({ error: 'Forbidden: You can only deactivate employees in your own team' });
    }

    await prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE }
    });

    await prisma.auditLog.create({
      data: { action: 'EMPLOYEE_DEACTIVATED', entity_type: 'USER', entity_id: id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });

    res.json({ message: 'Employee successfully deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
};
