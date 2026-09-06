import { PrismaClient, Role, UserStatus, InvoiceStatus, CustomerStatus, AssignmentStatus, TaskStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich financial and operations data...');
  const pw = await argon2.hash('password123', { type: argon2.argon2id });

  // ── Users ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'mohan@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw },
    create: { email: 'mohan@florence.com', full_name: 'Mohan Kumar', phone: '9000000001', password_hash: pw, role: Role.ADMIN, status: UserStatus.ACTIVE, designation: 'Operations Manager' },
  });

  let team1 = await prisma.team.findFirst({ where: { name: 'Alpha Nursing Team' } });
  if (!team1) team1 = await prisma.team.create({ data: { name: 'Alpha Nursing Team', description: 'Critical care support - Hyderabad West' } });

  let team2 = await prisma.team.findFirst({ where: { name: 'Beta Home Care Team' } });
  if (!team2) team2 = await prisma.team.create({ data: { name: 'Beta Home Care Team', description: 'Elderly and post-surgery home care - Hyderabad East' } });

  const lead1 = await prisma.user.upsert({
    where: { email: 'prashanth@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: team1.id },
    create: { email: 'prashanth@florence.com', full_name: 'Prashanth Reddy', phone: '9000000002', password_hash: pw, role: Role.TEAM_LEAD, status: UserStatus.ACTIVE, designation: 'Senior Team Lead', team_id: team1.id },
  });
  await prisma.team.update({ where: { id: team1.id }, data: { team_lead_id: lead1.id } });

  const lead2 = await prisma.user.upsert({
    where: { email: 'anita@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: team2.id },
    create: { email: 'anita@florence.com', full_name: 'Anita Sharma', phone: '9000000004', password_hash: pw, role: Role.TEAM_LEAD, status: UserStatus.ACTIVE, designation: 'Team Lead', team_id: team2.id },
  });
  await prisma.team.update({ where: { id: team2.id }, data: { team_lead_id: lead2.id } });

  const staff1 = await prisma.user.upsert({
    where: { email: 'swetha@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: team1.id },
    create: { email: 'swetha@florence.com', full_name: 'Swetha Nair', phone: '9000000003', password_hash: pw, role: Role.EMPLOYEE, status: UserStatus.ACTIVE, designation: 'Staff Nurse', qualification: 'B.Sc Nursing', experience: '3 years', joining_date: new Date('2022-06-01'), team_id: team1.id },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'ravi@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: team1.id },
    create: { email: 'ravi@florence.com', full_name: 'Ravi Kumar', phone: '9000000005', password_hash: pw, role: Role.EMPLOYEE, status: UserStatus.ACTIVE, designation: 'Nursing Assistant', qualification: 'GNM', experience: '1 year', joining_date: new Date('2023-01-15'), team_id: team1.id },
  });

  console.log('✅ Users created');

  // ── Customers ──────────────────────────────────────────────────────────────
  const customersData = [
    { phone: '9876543210', full_name: 'Rajesh Patel', email: 'rajesh@example.com', address: '12 Banjara Hills, Hyderabad', service_type: '24/7 Critical Nursing', team_id: team1.id, notes: 'Post-bypass surgery care. Daily vitals monitoring required.' },
    { phone: '9123456789', full_name: 'Lakshmi Devi', email: 'lakshmi@example.com', address: '45 Jubilee Hills, Hyderabad', service_type: 'Elderly Day Care', team_id: team1.id, notes: 'Type-2 Diabetes. Blood sugar monitoring twice daily.' },
    { phone: '9765432100', full_name: 'Suresh Mehta', email: 'suresh@example.com', address: '8 Madhapur, Hyderabad', service_type: 'Post-Surgery Rehabilitation', team_id: team1.id, notes: 'Hip replacement. Physiotherapy sessions 3x per week.' },
    { phone: '9988776655', full_name: 'Kamala Bai', address: '22 Secunderabad, Hyderabad', service_type: 'Palliative Care', team_id: team2.id, notes: 'Requires compassionate end-of-life care. Family support coordination.' },
    { phone: '9112233445', full_name: 'Dr. Venkat Rao', email: 'venkat@example.com', address: '5 Hitech City, Hyderabad', service_type: 'Stroke Recovery Nursing', team_id: team2.id, notes: 'Post-stroke. Speech therapy coordination, mobility exercises.' },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    let cust = await prisma.customer.findFirst({ where: { phone: c.phone } });
    if (!cust) cust = await prisma.customer.create({ data: { ...c, status: CustomerStatus.ACTIVE } });
    customers.push(cust);
  }
  const [c1, c2, c3, c4, c5] = customers;
  console.log('✅ Customers created');

  // ── Invoices & Payments ────────────────────────────────────────────────────
  const invoiceData = [
    // Customer 1 — Rajesh: PARTIALLY_PAID, ₹42,000 billed, ₹18,000 paid
    { customer: c1, total: 42000, status: InvoiceStatus.PARTIALLY_PAID, daysAgo: 20, dueDaysAgo: 10, payments: [
      { amount: 10000, method: PaymentMethod.UPI, daysAgo: 18, ref: 'UPI826351' },
      { amount: 8000, method: PaymentMethod.CASH, daysAgo: 12, ref: 'CASH91234' },
    ]},
    // Customer 2 — Lakshmi: OVERDUE, ₹18,000, no payment
    { customer: c2, total: 18000, status: InvoiceStatus.OVERDUE, daysAgo: 35, dueDaysAgo: 25, payments: [] },
    // Customer 3 — Suresh: PAID fully ₹28,500
    { customer: c3, total: 28500, status: InvoiceStatus.PAID, daysAgo: 40, dueDaysAgo: 30, payments: [
      { amount: 15000, method: PaymentMethod.BANK_TRANSFER, daysAgo: 38, ref: 'NEFT20260801' },
      { amount: 13500, method: PaymentMethod.BANK_TRANSFER, daysAgo: 30, ref: 'NEFT20260810' },
    ]},
    // Customer 4 — Kamala: PENDING ₹22,000
    { customer: c4, total: 22000, status: InvoiceStatus.PENDING, daysAgo: 5, dueDaysAgo: -5, payments: [] },
    // Customer 5 — Dr. Venkat: PARTIALLY_PAID ₹55,000, ₹25,000 paid
    { customer: c5, total: 55000, status: InvoiceStatus.PARTIALLY_PAID, daysAgo: 15, dueDaysAgo: 5, payments: [
      { amount: 25000, method: PaymentMethod.CARD, daysAgo: 13, ref: 'CARD7654321' },
    ]},
    // Customer 1 — second invoice: ISSUED, new billing cycle
    { customer: c1, total: 42000, status: InvoiceStatus.ISSUED, daysAgo: 1, dueDaysAgo: -14, payments: [] },
  ];

  for (const inv of invoiceData) {
    const refId = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existing = await prisma.invoice.findFirst({ where: { customer_id: inv.customer.id, total_amount: new Decimal(inv.total) } });
    if (!existing) {
      const billingDate = new Date(Date.now() - inv.daysAgo * 86400000);
      const dueDate = new Date(Date.now() - inv.dueDaysAgo * 86400000);
      const invoice = await prisma.invoice.create({
        data: {
          invoice_number: `FN-INV-2026-${refId}`,
          service_period_start: billingDate,
          service_period_end: new Date(billingDate.getTime() + 30 * 86400000),
          billing_date: billingDate,
          due_date: dueDate,
          total_amount: new Decimal(inv.total),
          status: inv.status,
          customer_id: inv.customer.id
        }
      });
      for (const p of inv.payments) {
        const payDate = new Date(Date.now() - p.daysAgo * 86400000);
        await prisma.payment.create({
          data: {
            payment_reference: `PAY-${p.ref}`,
            amount: new Decimal(p.amount),
            payment_date: payDate,
            payment_method: p.method,
            transaction_reference: p.ref,
            status: PaymentStatus.CONFIRMED,
            invoice_id: invoice.id,
            customer_id: inv.customer.id,
            received_by_id: lead1.id
          }
        });
      }
    }
  }
  console.log('✅ Invoices + Payments created');

  // ── Assignments ────────────────────────────────────────────────────────────
  const assignmentsData = [
    { customer_id: c1.id, employee_id: staff1.id, service_type: '24/7 Critical Nursing', start_time: '08:00', end_time: '20:00', status: AssignmentStatus.IN_PROGRESS, notes: 'Primary nurse, daily wound dressing and vitals.' },
    { customer_id: c2.id, employee_id: staff1.id, service_type: 'Elderly Day Care', start_time: '09:00', end_time: '17:00', status: AssignmentStatus.ASSIGNED, notes: 'Evening blood sugar check mandatory.' },
    { customer_id: c3.id, employee_id: staff2.id, service_type: 'Post-Surgery Rehab', start_time: '07:00', end_time: '13:00', status: AssignmentStatus.IN_PROGRESS, notes: 'Assist physiotherapist and monitor pain levels.' },
  ];

  for (const a of assignmentsData) {
    const exists = await prisma.careAssignment.findFirst({ where: { customer_id: a.customer_id, employee_id: a.employee_id } });
    if (!exists) {
      await prisma.careAssignment.create({ data: { ...a, start_date: new Date(), team_id: team1.id } });
    }
  }
  console.log('✅ Assignments created');

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasksData = [
    { title: 'Submit August patient progress report', description: 'Compile vitals, medication logs for Rajesh Patel (Aug 2026).', priority: 'HIGH', due_date: new Date('2026-09-07'), status: TaskStatus.TODO, employee_id: staff1.id },
    { title: 'Blood sugar readings — Lakshmi Devi', description: 'Record morning & evening readings for the week.', priority: 'MEDIUM', due_date: new Date('2026-09-10'), status: TaskStatus.IN_PROGRESS, employee_id: staff1.id },
    { title: 'Physiotherapy session coordination', description: 'Book 3 physiotherapy sessions for Suresh Mehta.', priority: 'LOW', due_date: new Date('2026-09-12'), status: TaskStatus.TODO, employee_id: staff2.id },
    { title: 'Medication restock for Rajesh Patel', description: 'Check and reorder prescribed medications from pharmacy.', priority: 'HIGH', due_date: new Date('2026-09-08'), status: TaskStatus.TODO, employee_id: staff2.id },
  ];

  for (const t of tasksData) {
    const exists = await prisma.task.findFirst({ where: { title: t.title, employee_id: t.employee_id } });
    if (!exists) await prisma.task.create({ data: { ...t, team_id: team1.id } });
  }
  console.log('✅ Tasks created');

  // ── Attendance ─────────────────────────────────────────────────────────────
  for (const emp of [staff1, staff2]) {
    for (let d = 1; d <= 7; d++) {
      const dateStr = `2026-09-0${d}`;
      const exists = await prisma.attendance.findFirst({ where: { employee_id: emp.id, date: new Date(`${dateStr}T00:00:00.000Z`) } });
      if (!exists && d <= 5) { // Mon-Fri present
        await prisma.attendance.create({
          data: {
            date: new Date(`${dateStr}T00:00:00.000Z`),
            check_in: new Date(`${dateStr}T02:30:00.000Z`),
            check_out: new Date(`${dateStr}T14:30:00.000Z`),
            employee_id: emp.id
          }
        });
      }
    }
  }
  console.log('✅ Attendance records created');

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const auditEvents = [
    { action: 'LOGIN', entity_type: 'USER', entity_id: admin.id, actor_user_id: admin.id, result: 'SUCCESS' },
    { action: 'LOGIN', entity_type: 'USER', entity_id: lead1.id, actor_user_id: lead1.id, result: 'SUCCESS' },
    { action: 'CUSTOMER_CREATED', entity_type: 'CUSTOMER', entity_id: c1.id, actor_user_id: lead1.id, result: 'SUCCESS', metadata: JSON.stringify({ customer: 'Rajesh Patel' }) },
    { action: 'PAYMENT_RECORDED', entity_type: 'PAYMENT', entity_id: c1.id, actor_user_id: lead1.id, result: 'SUCCESS', metadata: JSON.stringify({ amount: 10000 }) },
    { action: 'LOGIN_FAILED', entity_type: 'USER', entity_id: staff1.id, result: 'FAILED', metadata: JSON.stringify({ reason: 'wrong password' }) },
    { action: 'LOGIN', entity_type: 'USER', entity_id: staff1.id, actor_user_id: staff1.id, result: 'SUCCESS' },
  ];

  const existingLogs = await prisma.auditLog.count();
  if (existingLogs < 3) {
    for (const log of auditEvents) {
      await prisma.auditLog.create({ data: log });
    }
  }
  console.log('✅ Audit logs created');

  console.log('\n🎉 ─── FULL SEED COMPLETE ───');
  console.log('Login with password: password123');
  console.log('  Admin:     mohan@florence.com');
  console.log('  Team Lead: prashanth@florence.com');
  console.log('  Staff:     swetha@florence.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
