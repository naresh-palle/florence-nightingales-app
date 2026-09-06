import { PrismaClient, Role, UserStatus, InvoiceStatus, CustomerStatus, AssignmentStatus, TaskStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with rich mock data...');

  const defaultPassword = await argon2.hash('password123', { type: argon2.argon2id });

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'mohan@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: defaultPassword },
    create: {
      email: 'mohan@florence.com',
      full_name: 'Mohan Kumar',
      phone: '9000000001',
      password_hash: defaultPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      designation: 'Operations Manager',
    },
  });
  console.log(`✅ Admin: ${admin.full_name}`);

  // ── 2. Team ───────────────────────────────────────────────────────────────
  let team = await prisma.team.findFirst({ where: { name: 'Alpha Nursing Team' } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: 'Alpha Nursing Team', description: 'Primary critical care support team' }
    });
  }

  // ── 3. Team Lead ──────────────────────────────────────────────────────────
  const teamLead = await prisma.user.upsert({
    where: { email: 'prashanth@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: defaultPassword, team_id: team.id },
    create: {
      email: 'prashanth@florence.com',
      full_name: 'Prashanth Reddy',
      phone: '9000000002',
      password_hash: defaultPassword,
      role: Role.TEAM_LEAD,
      status: UserStatus.ACTIVE,
      designation: 'Senior Team Lead',
      team_id: team.id
    },
  });

  await prisma.team.update({
    where: { id: team.id },
    data: { team_lead_id: teamLead.id }
  });
  console.log(`✅ Team Lead: ${teamLead.full_name}`);

  // ── 4. Staff ──────────────────────────────────────────────────────────────
  const staff = await prisma.user.upsert({
    where: { email: 'swetha@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: defaultPassword, team_id: team.id },
    create: {
      email: 'swetha@florence.com',
      full_name: 'Swetha Nair',
      phone: '9000000003',
      password_hash: defaultPassword,
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      designation: 'Staff Nurse',
      qualification: 'B.Sc Nursing',
      experience: '3 years',
      joining_date: new Date('2022-06-01'),
      team_id: team.id
    },
  });
  console.log(`✅ Staff: ${staff.full_name}`);

  // ── 5. Customers ──────────────────────────────────────────────────────────
  let customer1 = await prisma.customer.findFirst({ where: { phone: '9876543210' } });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        full_name: 'Rajesh Patel',
        phone: '9876543210',
        email: 'rajesh.patel@example.com',
        address: '12 Banjara Hills, Hyderabad, Telangana',
        emergency_contact: '9876543299',
        service_type: '24/7 Critical Nursing Support',
        service_start_date: new Date('2026-08-01'),
        status: CustomerStatus.ACTIVE,
        notes: 'Post-surgery care. Requires physiotherapy twice daily.',
        team_id: team.id
      }
    });
  }

  let customer2 = await prisma.customer.findFirst({ where: { phone: '9123456789' } });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        full_name: 'Lakshmi Devi',
        phone: '9123456789',
        address: '45 Jubilee Hills, Hyderabad, Telangana',
        emergency_contact: '9123456700',
        service_type: 'Elderly Day Care',
        service_start_date: new Date('2026-07-15'),
        status: CustomerStatus.ACTIVE,
        notes: 'Diabetic patient. Monitor blood sugar twice daily.',
        team_id: team.id
      }
    });
  }
  console.log(`✅ Customers: ${customer1.full_name}, ${customer2.full_name}`);

  // ── 6. Invoices & Partial Payment ─────────────────────────────────────────
  let invoice1 = await prisma.invoice.findFirst({ where: { customer_id: customer1.id } });
  if (!invoice1) {
    invoice1 = await prisma.invoice.create({
      data: {
        invoice_number: `FN-INV-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        service_period_start: new Date('2026-08-01'),
        service_period_end: new Date('2026-08-31'),
        billing_date: new Date('2026-08-01'),
        due_date: new Date('2026-08-10'),
        total_amount: new Decimal(35000.00),
        status: InvoiceStatus.PARTIALLY_PAID,
        customer_id: customer1.id
      }
    });

    // Partial payment already made
    await prisma.payment.create({
      data: {
        payment_reference: `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        amount: new Decimal(15000.00),
        payment_date: new Date('2026-08-05'),
        payment_method: PaymentMethod.UPI,
        transaction_reference: 'UPI202608051234',
        status: PaymentStatus.CONFIRMED,
        notes: 'First installment paid via Google Pay',
        invoice_id: invoice1.id,
        customer_id: customer1.id,
        received_by_id: teamLead.id
      }
    });
  }

  let invoice2 = await prisma.invoice.findFirst({ where: { customer_id: customer2.id } });
  if (!invoice2) {
    invoice2 = await prisma.invoice.create({
      data: {
        invoice_number: `FN-INV-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        service_period_start: new Date('2026-09-01'),
        service_period_end: new Date('2026-09-15'),
        billing_date: new Date('2026-09-01'),
        due_date: new Date('2026-09-05'),
        total_amount: new Decimal(18000.00),
        status: InvoiceStatus.OVERDUE,
        customer_id: customer2.id
      }
    });
  }
  console.log(`✅ Invoices created with partial payments`);

  // ── 7. Care Assignments ───────────────────────────────────────────────────
  const existingAssignment = await prisma.careAssignment.findFirst({ where: { employee_id: staff.id } });
  if (!existingAssignment) {
    await prisma.careAssignment.create({
      data: {
        service_type: '24/7 Critical Nursing Support',
        start_date: new Date('2026-08-01'),
        start_time: '08:00',
        end_time: '20:00',
        status: AssignmentStatus.IN_PROGRESS,
        notes: 'Primary nurse for Rajesh Patel. Post-surgery monitoring.',
        customer_id: customer1.id,
        employee_id: staff.id,
        team_id: team.id
      }
    });

    await prisma.careAssignment.create({
      data: {
        service_type: 'Elderly Day Care',
        start_date: new Date('2026-09-01'),
        start_time: '09:00',
        end_time: '17:00',
        status: AssignmentStatus.ASSIGNED,
        notes: 'Evening care for Lakshmi Devi. Monitor vitals.',
        customer_id: customer2.id,
        employee_id: staff.id,
        team_id: team.id
      }
    });
  }
  console.log(`✅ Care Assignments created for Swetha`);

  // ── 8. Tasks ──────────────────────────────────────────────────────────────
  const existingTask = await prisma.task.findFirst({ where: { employee_id: staff.id } });
  if (!existingTask) {
    await prisma.task.create({
      data: {
        title: 'Submit monthly patient progress report',
        description: 'Compile vitals, medication logs, and physiotherapy progress for Rajesh Patel for August 2026.',
        priority: 'HIGH',
        due_date: new Date('2026-09-07'),
        status: TaskStatus.TODO,
        employee_id: staff.id,
        team_id: team.id
      }
    });

    await prisma.task.create({
      data: {
        title: 'Collect blood sugar readings for Lakshmi Devi',
        description: 'Record morning and evening blood sugar readings for the week.',
        priority: 'MEDIUM',
        due_date: new Date('2026-09-10'),
        status: TaskStatus.IN_PROGRESS,
        employee_id: staff.id,
        team_id: team.id
      }
    });
  }
  console.log(`✅ Tasks created for Swetha`);

  // ── 9. Attendance ─────────────────────────────────────────────────────────
  const existingAttendance = await prisma.attendance.findFirst({ where: { employee_id: staff.id } });
  if (!existingAttendance) {
    const days = [1, 2, 3, 4, 5];
    for (const day of days) {
      await prisma.attendance.create({
        data: {
          date: new Date(`2026-09-0${day}T00:00:00.000Z`),
          check_in: new Date(`2026-09-0${day}T02:30:00.000Z`),  // 08:00 IST
          check_out: new Date(`2026-09-0${day}T14:30:00.000Z`), // 20:00 IST
          employee_id: staff.id
        }
      });
    }
  }
  console.log(`✅ Attendance records created for Swetha`);

  // ── 10. Audit Log ─────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      action: 'DATABASE_SEEDED',
      entity_type: 'SYSTEM',
      entity_id: 'SEED',
      actor_user_id: admin.id,
      result: 'SUCCESS',
      metadata: JSON.stringify({ seeded_by: 'auto-seed on startup' })
    }
  });

  console.log('\n✅ ─── SEEDING COMPLETE ───');
  console.log('Login credentials (password: password123):');
  console.log('  Admin:     mohan@florence.com');
  console.log('  Team Lead: prashanth@florence.com');
  console.log('  Staff:     swetha@florence.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
