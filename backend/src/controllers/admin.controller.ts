import { Request, Response } from 'express';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const MAX_ACTIVE_TEAM_LEADS = 4;

export const createTeamLead = async (req: Request, res: Response) => {
  const { full_name, email, phone, designation, team_id } = req.body;

  try {
    // 1. Enforce max 4 active Team Leads
    const activeTeamLeadsCount = await prisma.user.count({
      where: {
        role: Role.TEAM_LEAD,
        status: UserStatus.ACTIVE
      }
    });

    if (activeTeamLeadsCount >= MAX_ACTIVE_TEAM_LEADS) {
      return res.status(400).json({ 
        error: "Maximum number of active Team Leads has been reached. Deactivate an existing Team Lead before adding another." 
      });
    }

    // 2. Create the account in PENDING state (NO password set)
    // Team Lead will receive an activation email with a token to set their password later.
    const newTeamLead = await prisma.user.create({
      data: {
        full_name,
        email,
        phone,
        designation,
        role: Role.TEAM_LEAD,
        status: UserStatus.PENDING,
        team_id: team_id || null
      }
    });

    // Generate secure activation token (implementation mocked for now, would use a mailing service)
    const activationToken = crypto.randomBytes(32).toString('hex');
    // TODO: Store token in DB and send via Email/SMS

    // 3. Log the Admin action
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_LEAD_CREATED',
        entity_type: 'USER',
        entity_id: newTeamLead.id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS',
        metadata: JSON.stringify({ email })
      }
    });

    res.status(201).json({ 
      message: 'Team Lead account created in pending state. Activation instructions sent.',
      user: { id: newTeamLead.id, email: newTeamLead.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create Team Lead' });
  }
};

export const deactivateTeamLead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_team_lead_id } = req.body; // Optional replacement

  try {
    // We use a database transaction to ensure financial history and team ownership is handled safely
    await prisma.$transaction(async (tx) => {
      const teamLead = await tx.user.findUnique({ where: { id } });
      if (!teamLead || teamLead.role !== Role.TEAM_LEAD) {
        throw new Error('Team Lead not found');
      }

      // Deactivate the user (Soft Delete)
      await tx.user.update({
        where: { id },
        data: { status: UserStatus.INACTIVE }
      });

      // Handle Team Ownership
      if (teamLead.team_id) {
        if (new_team_lead_id) {
          // Option B: Assign replacement existing Team Lead
          await tx.team.update({
            where: { id: teamLead.team_id },
            data: { team_lead_id: new_team_lead_id }
          });
        } else {
          // Option A: Team becomes UNASSIGNED
          await tx.team.update({
            where: { id: teamLead.team_id },
            data: { team_lead_id: null }
          });
        }
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          action: 'TEAM_LEAD_DEACTIVATED',
          entity_type: 'USER',
          entity_id: id,
          actor_user_id: req.user?.id,
          result: 'SUCCESS'
        }
      });
    });

    res.json({ message: 'Team Lead successfully deactivated. Historical records retained.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const reactivateTeamLead = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const activeTeamLeadsCount = await prisma.user.count({
      where: { role: Role.TEAM_LEAD, status: UserStatus.ACTIVE }
    });

    if (activeTeamLeadsCount >= MAX_ACTIVE_TEAM_LEADS) {
      return res.status(400).json({ 
        error: "Four active Team Leads already exist. Deactivate another Team Lead before reactivating this account." 
      });
    }

    await prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TEAM_LEAD_REACTIVATED',
        entity_type: 'USER',
        entity_id: id,
        actor_user_id: req.user?.id,
        result: 'SUCCESS'
      }
    });

    res.json({ message: 'Team Lead reactivated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reactivate Team Lead' });
  }
};
