import { Request, Response } from 'express';
import { PrismaClient, Role, InvoiceStatus, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Create a new Invoice
export const createInvoice = async (req: Request, res: Response) => {
  const { customer_id, service_period_start, service_period_end, billing_date, due_date, total_amount, notes } = req.body;

  try {
    // Generate unique invoice number: FN-INV-YYYY-RANDOM
    const invoiceNumber = `FN-INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        customer_id,
        service_period_start: new Date(service_period_start),
        service_period_end: new Date(service_period_end),
        billing_date: new Date(billing_date),
        due_date: new Date(due_date),
        total_amount: new Decimal(total_amount),
        status: InvoiceStatus.PENDING,
        notes
      }
    });

    await prisma.auditLog.create({
      data: { action: 'INVOICE_CREATED', entity_type: 'INVOICE', entity_id: newInvoice.id, actor_user_id: req.user?.id, result: 'SUCCESS' }
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Record a Payment (CRITICAL FINANCIAL TRANSACTION)
export const recordPayment = async (req: Request, res: Response) => {
  const { invoice_id, amount, payment_method, transaction_reference, notes } = req.body;
  const paymentAmount = new Decimal(amount);

  if (paymentAmount.lte(0)) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  try {
    // START STRICT DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch invoice and all its CONFIRMED payments
      const invoice = await tx.invoice.findUnique({
        where: { id: invoice_id },
        include: { payments: { where: { status: PaymentStatus.CONFIRMED } } }
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === InvoiceStatus.CANCELLED) throw new Error('Cannot pay a cancelled invoice');

      // 2. Calculate actual outstanding balance
      const totalPaid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
      const outstandingBalance = invoice.total_amount.sub(totalPaid);

      // 3. Prevent Overpayment
      if (paymentAmount.gt(outstandingBalance)) {
        throw new Error(`Payment amount (₹${paymentAmount.toString()}) cannot exceed the outstanding balance (₹${outstandingBalance.toString()}).`);
      }

      // 4. Create the new payment
      const paymentRef = `FN-PAY-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const newPayment = await tx.payment.create({
        data: {
          payment_reference: paymentRef,
          amount: paymentAmount,
          payment_date: new Date(),
          payment_method,
          transaction_reference,
          status: PaymentStatus.CONFIRMED,
          notes,
          invoice_id,
          customer_id: invoice.customer_id,
          received_by_id: req.user!.id
        }
      });

      // 5. Recalculate balance and determine new Invoice Status
      const newTotalPaid = totalPaid.add(paymentAmount);
      let newInvoiceStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;

      if (newTotalPaid.equals(invoice.total_amount)) {
        newInvoiceStatus = InvoiceStatus.PAID;
      }

      // 6. Update Invoice
      await tx.invoice.update({
        where: { id: invoice_id },
        data: { status: newInvoiceStatus }
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_RECORDED',
          entity_type: 'PAYMENT',
          entity_id: newPayment.id,
          actor_user_id: req.user?.id,
          result: 'SUCCESS',
          metadata: JSON.stringify({ amount: paymentAmount.toString(), new_status: newInvoiceStatus })
        }
      });

      return {
        receipt_number: paymentRef,
        amount_paid: paymentAmount,
        previous_outstanding: outstandingBalance,
        new_outstanding: invoice.total_amount.sub(newTotalPaid),
        invoice_status: newInvoiceStatus
      };
    });
    // END TRANSACTION

    res.status(201).json({
      message: 'Payment successfully recorded.',
      receipt: result
    });

  } catch (error: any) {
    // If ANY step above fails, the entire transaction rolls back automatically
    console.error("Payment Transaction Failed:", error.message);
    res.status(400).json({ error: error.message || 'Payment could not be recorded.' });
  }
};
