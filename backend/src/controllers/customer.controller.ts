import { Request, Response } from 'express';
import { PrismaClient, Role, CustomerStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Add Customer (Team Lead creates for their own team)
export const createCustomer = async (req: Request, res: Response) => {
  const { full_name, phone, email, address, emergency_contact, service_type } = req.body;

  try {
    let targetTeamId = req.user?.team_id;

    if (req.user?.role === Role.ADMIN) {
      targetTeamId = req.body.team_id;
      if (!targetTeamId) {
        return res.status(400).json({ error: 'Admin must specify a team_id when creating a customer' });
      }
    } else if (!targetTeamId) {
       return res.status(400).json({ error: 'Team Lead is not currently assigned to a team' });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        full_name,
        phone,
        email,
        address,
        emergency_contact,
        service_type,
        status: CustomerStatus.ACTIVE,
        team_id: targetTeamId
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_CREATED',
        entity_type: 'CUSTOMER',
        entity_id: newCustomer.id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ team_id: targetTeamId })
      }
    });

    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Customer' });
  }
};

// Get Customers (Scoped by team for Team Leads)
export const getCustomers = async (req: Request, res: Response) => {
  try {
    let whereClause = {};
    
    if (req.user?.role === Role.TEAM_LEAD) {
      whereClause = { team_id: req.user.team_id };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Customer Detail & Service History
export const getCustomerDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({ 
      where: { id },
      include: {
        assignments: {
          include: { employee: { select: { full_name: true } } }
        },
        invoices: true,
        payments: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (req.user?.role === Role.TEAM_LEAD && customer.team_id !== req.user.team_id) {
      // Intentionally log the security violation before denying access
      await prisma.auditLog.create({
        data: { action: 'UNAUTHORIZED_ACCESS_ATTEMPT', entity_type: 'CUSTOMER', entity_id: id, actor_user_id: req.user.id, result: 'DENIED' }
      });
      return res.status(403).json({ error: 'Forbidden: You cannot access customers assigned to another team' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
};
