import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }

    next();
  };
};

/**
 * Ensures Team Leads can only access resources belonging to their team.
 * Admin bypasses this check.
 * This must be applied AFTER requireRole middleware.
 */
export const enforceTeamScope = (resourceTeamIdExtractor: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === Role.ADMIN) {
      return next(); // Admins have organization-wide access
    }

    if (req.user.role === Role.TEAM_LEAD) {
      const resourceTeamId = resourceTeamIdExtractor(req);
      if (!resourceTeamId || req.user.team_id !== resourceTeamId) {
        // Log unauthorized attempt as per requirements (handled in Audit logger later)
        return res.status(403).json({ error: 'Forbidden: Cannot access another team\'s data' });
      }
      return next();
    }

    // Employees also restricted to their own assignments (checked further down in specific routes)
    return res.status(403).json({ error: 'Forbidden' });
  };
};
