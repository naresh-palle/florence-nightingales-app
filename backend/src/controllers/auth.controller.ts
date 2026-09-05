import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// In production, these should be stored in Redis or DB with an expiration time
const passwordResetTokens = new Map<string, string>(); 

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== UserStatus.ACTIVE || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }

    const isValid = await argon2.verify(user.password_hash, password);
    
    if (!isValid) {
      await prisma.auditLog.create({
        data: { action: 'LOGIN_FAILED', entity_type: 'USER', entity_id: user.id, result: 'FAILED' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
      { expiresIn: '8h' }
    );

    await prisma.auditLog.create({
      data: { action: 'LOGIN', entity_type: 'USER', entity_id: user.id, actor_user_id: user.id, result: 'SUCCESS' }
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      passwordResetTokens.set(resetToken, user.id);
      console.log(`[Email Service Mock] Password reset link for ${email}: http://app/reset?token=${resetToken}`);
    }

    res.json({ message: 'If an account exists for this information, password reset instructions have been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, new_password } = req.body;

  try {
    const userId = passwordResetTokens.get(token);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const password_hash = await argon2.hash(new_password, { type: argon2.argon2id });

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash, status: UserStatus.ACTIVE }
    });

    passwordResetTokens.delete(token);

    await prisma.auditLog.create({
      data: { action: 'PASSWORD_RESET', entity_type: 'USER', entity_id: userId, actor_user_id: userId, result: 'SUCCESS' }
    });

    res.json({ message: 'Password has been securely reset. You may now login.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
