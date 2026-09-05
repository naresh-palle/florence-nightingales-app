import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createInvoice, recordPayment } from '../controllers/finance.controller';
import { Role } from '@prisma/client';

const router = Router();

// Financial operations require strict authentication
router.use(authenticate);

// Invoicing (Admin only or explicitly authorized Team Leads)
router.post('/invoices', requireRole([Role.ADMIN]), createInvoice);

// Payments (Admin + Team Leads can record payments)
router.post('/payments', requireRole([Role.ADMIN, Role.TEAM_LEAD]), recordPayment);

export default router;
