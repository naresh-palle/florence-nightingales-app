import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, InvoiceStatus, Role, NotificationChannel } from '@prisma/client';
import { NotificationService } from '../services/NotificationService';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Throttling: Do not allow more than 1 reminder per invoice per 24 hours
const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000; 

export const sendPaymentReminder = async (req: Request, res: Response) => {
  const { invoice_id, channel } = req.body;
  const requestedChannel = channel as NotificationChannel || NotificationChannel.SMS;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoice_id },
      include: { 
        customer: true,
        payments: { where: { status: PaymentStatus.CONFIRMED } }
      }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Strict Authorization: Team Leads can only send reminders for their own team's customers
    if (req.user?.role === Role.TEAM_LEAD && invoice.customer.team_id !== req.user.team_id) {
       await prisma.auditLog.create({
          data: { action: 'UNAUTHORIZED_REMINDER_ATTEMPT', entity_type: 'INVOICE', entity_id: invoice_id, actor_user_id: req.user.id, result: 'DENIED' }
       });
       return res.status(403).json({ error: 'Forbidden: Cannot send reminders for another team\'s customer' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ error: 'Cannot send reminder for a fully paid invoice.' });
    }

    // Calculate exact outstanding amount
    const totalPaid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
    const outstandingAmount = invoice.total_amount.sub(totalPaid);

    // Spam Protection / Throttling Check
    const lastReminder = await prisma.paymentReminder.findFirst({
      where: { invoice_id },
      orderBy: { sent_time: 'desc' }
    });

    if (lastReminder && (Date.now() - lastReminder.sent_time.getTime()) < REMINDER_COOLDOWN_MS) {
       // Allow Admin override if necessary, but block Team Leads strictly
       if (req.user?.role !== Role.ADMIN) {
         return res.status(429).json({ error: 'Reminder was already sent recently. Please wait 24 hours.' });
       }
    }

    // Construct message (No sensitive medical info!)
    const message = `Dear ${invoice.customer.full_name}, your Florence Nightingales service payment of ₹${outstandingAmount.toString()} for the current billing period is pending. Please complete the payment at your earliest convenience. Thank you.`;

    // Send through abstraction layer
    const deliveryTarget = requestedChannel === NotificationChannel.EMAIL ? invoice.customer.email : invoice.customer.phone;
    
    if (!deliveryTarget) {
      return res.status(400).json({ error: `Customer is missing contact information for channel: ${requestedChannel}` });
    }

    const success = await NotificationService.send({
      to: deliveryTarget,
      message,
      channel: requestedChannel
    });

    if (success) {
      // Record Audit and Reminder History
      await prisma.paymentReminder.create({
        data: {
          customer_id: invoice.customer_id,
          invoice_id: invoice.id,
          outstanding_at_time: outstandingAmount,
          sender_id: req.user!.id,
          channel: requestedChannel,
          delivery_status: 'SENT'
        }
      });

      await prisma.auditLog.create({
        data: { action: 'PAYMENT_REMINDER_SENT', entity_type: 'INVOICE', entity_id: invoice.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
      });

      return res.json({ message: 'Payment reminder sent successfully.' });
    } else {
      return res.status(500).json({ error: 'Failed to deliver notification.' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment reminder.' });
  }
};
