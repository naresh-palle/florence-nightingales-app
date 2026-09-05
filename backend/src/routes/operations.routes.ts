import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createEmployee, getEmployees, deactivateEmployee } from '../controllers/employee.controller';
import { createCustomer, getCustomers, getCustomerDetail } from '../controllers/customer.controller';
import { getAssignments, createAssignment, getTasks, getAttendance, getTeamInvoices } from '../controllers/operations.controller';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

// Employee Routes (Admin + Team Lead)
router.post('/employees', requireRole([Role.ADMIN, Role.TEAM_LEAD]), createEmployee);
router.get('/employees', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getEmployees);
router.delete('/employees/:id', requireRole([Role.ADMIN, Role.TEAM_LEAD]), deactivateEmployee);

// Customer Routes (Admin + Team Lead)
router.post('/customers', requireRole([Role.ADMIN, Role.TEAM_LEAD]), createCustomer);
router.get('/customers', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getCustomers);
router.get('/customers/:id', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getCustomerDetail);

// Assignment Routes (All roles, scoped by role)
router.post('/assignments', requireRole([Role.ADMIN, Role.TEAM_LEAD]), createAssignment);
router.get('/assignments', requireRole([Role.ADMIN, Role.TEAM_LEAD, Role.EMPLOYEE]), getAssignments);

// Task Routes (All roles, scoped by role)
router.get('/tasks', requireRole([Role.ADMIN, Role.TEAM_LEAD, Role.EMPLOYEE]), getTasks);

// Attendance Routes (All roles, scoped by role)
router.get('/attendance', requireRole([Role.ADMIN, Role.TEAM_LEAD, Role.EMPLOYEE]), getAttendance);

// Finance Summary for Team Leads
router.get('/invoices', requireRole([Role.ADMIN, Role.TEAM_LEAD]), getTeamInvoices);

export default router;
