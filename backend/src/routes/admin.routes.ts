import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { getTeamLeads, getAuditLogs, getOrganizationStats, getAllInvoices, seedMockData } from '../controllers/admin.controller';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

router.get('/stats', getOrganizationStats);
router.get('/team-leads', getTeamLeads);
router.get('/audit-logs', getAuditLogs);
router.get('/invoices', getAllInvoices);

router.get('/seed', seedMockData);

export default router;
