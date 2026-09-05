import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createEmployee, getEmployees, deactivateEmployee } from '../controllers/employee.controller';
import { createCustomer, getCustomers, getCustomerDetail } from '../controllers/customer.controller';
import { Role } from '@prisma/client';

const router = Router();

// All routes here require authentication
router.use(authenticate);

// Employee Routes (Admin + Team Lead)
router.post('/employees', requireRole([Role.ADMIN, Role.TEAM_LEAD]), createEmployee);
router.get('/employees', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getEmployees);
router.delete('/employees/:id', requireRole([Role.ADMIN, Role.TEAM_LEAD]), deactivateEmployee);

// Customer Routes (Admin + Team Lead)
router.post('/customers', requireRole([Role.ADMIN, Role.TEAM_LEAD]), createCustomer);
router.get('/customers', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getCustomers);
router.get('/customers/:id', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getCustomerDetail);

export default router;
