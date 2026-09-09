import { PrismaClient, Role, UserStatus, InvoiceStatus, CustomerStatus, AssignmentStatus, TaskStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export async function runCompleteSeed(forceClean: boolean = true) {
  console.log('🌱 Starting comprehensive database seeding...');

  if (forceClean) {
    console.log('🧹 Clearing old mock operational and financial data...');
    try {
      await prisma.payment.deleteMany({});
      await prisma.paymentReminder.deleteMany({});
      await prisma.invoice.deleteMany({});
      await prisma.attendance.deleteMany({});
      await prisma.task.deleteMany({});
      await prisma.incident.deleteMany({});
      await prisma.leaveRequest.deleteMany({});
      await prisma.shift.deleteMany({});
      await prisma.careAssignment.deleteMany({});
      await prisma.quotationItem.deleteMany({});
      await prisma.quotation.deleteMany({});
      await prisma.patient.deleteMany({});
      await prisma.customer.deleteMany({});
      await prisma.enquiry.deleteMany({});
      await prisma.auditLog.deleteMany({});
      console.log('✅ Old mock data cleared.');
    } catch (e) {
      console.warn('Notice during cleanup:', e);
    }
  }

  const pw = await argon2.hash('password123', { type: argon2.argon2id });

  // 1. Organization & Branch
  let org = await prisma.organization.findFirst({ where: { name: 'Florence Nightingales' } });
  if (!org) {
    org = await prisma.organization.create({ data: { name: 'Florence Nightingales' } });
  }

  let branchHQ = await prisma.branch.findFirst({ where: { name: 'Hyderabad HQ' } });
  if (!branchHQ) {
    branchHQ = await prisma.branch.create({
      data: { name: 'Hyderabad HQ', location: 'Jubilee Hills, Hyderabad', organization_id: org.id }
    });
  }

  // 2. Teams
  const teamsDef = [
    { name: 'Alpha Nursing Team', description: 'Critical & ICU Care Support — West Hyderabad' },
    { name: 'Beta Home Care Team', description: 'Elderly & Post-Operative Recovery — East Hyderabad' },
    { name: 'Gamma Physiotherapy Team', description: 'Specialized Physical Rehabilitation — Secunderabad' },
    { name: 'Delta General Care', description: 'Routine Patient Monitoring & Checkups — Cyberabad' }
  ];

  const teams: any[] = [];
  for (const td of teamsDef) {
    let t = await prisma.team.findFirst({ where: { name: td.name } });
    if (!t) {
      t = await prisma.team.create({
        data: { name: td.name, description: td.description, branch_id: branchHQ.id }
      });
    }
    teams.push(t);
  }
  const [team1, team2, team3, team4] = teams;

  // 3. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'mohan@florence.com' },
    update: { status: UserStatus.ACTIVE, password_hash: pw },
    create: {
      email: 'mohan@florence.com',
      full_name: 'Mohan Kumar',
      phone: '9000000001',
      password_hash: pw,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      designation: 'Operations Director'
    },
  });

  // 4. Team Leads
  const leadsDef = [
    { email: 'prashanth@florence.com', name: 'Prashanth Reddy', phone: '9000000002', desig: 'Senior Critical Care Lead', team: team1 },
    { email: 'anita@florence.com', name: 'Anita Sharma', phone: '9000000004', desig: 'Home Care Team Lead', team: team2 },
    { email: 'vikram@florence.com', name: 'Vikram Singh', phone: '9000000006', desig: 'Rehabilitation Lead', team: team3 },
    { email: 'meera@florence.com', name: 'Meera Das', phone: '9000000007', desig: 'General Nursing Supervisor', team: team4 },
  ];

  const leads: any[] = [];
  for (const ld of leadsDef) {
    const lead = await prisma.user.upsert({
      where: { email: ld.email },
      update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: ld.team.id },
      create: {
        email: ld.email,
        full_name: ld.name,
        phone: ld.phone,
        password_hash: pw,
        role: Role.TEAM_LEAD,
        status: UserStatus.ACTIVE,
        designation: ld.desig,
        team_id: ld.team.id
      },
    });
    await prisma.team.update({ where: { id: ld.team.id }, data: { team_lead_id: lead.id } });
    leads.push(lead);
  }
  const [lead1] = leads;

  // 5. Staff Members
  const staffDef = [
    { email: 'swetha@florence.com', name: 'Swetha Nair', phone: '9000000003', desig: 'ICU Specialist Nurse', qual: 'B.Sc Nursing', exp: '4 years', team: team1 },
    { email: 'ravi@florence.com', name: 'Ravi Kumar', phone: '9000000005', desig: 'Nursing Assistant', qual: 'GNM', exp: '2 years', team: team1 },
    { email: 'arjun@florence.com', name: 'Arjun Menon', phone: '9000000008', desig: 'Home Care Nurse', qual: 'B.Sc Nursing', exp: '3 years', team: team2 },
    { email: 'priya@florence.com', name: 'Priya Iyer', phone: '9000000009', desig: 'Physiotherapist', qual: 'BPT', exp: '5 years', team: team3 },
    { email: 'kiran@florence.com', name: 'Kiran Rao', phone: '9000000010', desig: 'General Duty Nurse', qual: 'GNM', exp: '6 years', team: team4 },
  ];

  const staffList: any[] = [];
  for (const sd of staffDef) {
    const st = await prisma.user.upsert({
      where: { email: sd.email },
      update: { status: UserStatus.ACTIVE, password_hash: pw, team_id: sd.team.id },
      create: {
        email: sd.email,
        full_name: sd.name,
        phone: sd.phone,
        password_hash: pw,
        role: Role.EMPLOYEE,
        status: UserStatus.ACTIVE,
        designation: sd.desig,
        qualification: sd.qual,
        experience: sd.exp,
        team_id: sd.team.id
      },
    });
    staffList.push(st);
  }
  const [staff1, staff2] = staffList;

  // 6. Customers & Patients
  const customersDef = [
    { phone: '9876543210', full_name: 'Rajesh Patel', email: 'rajesh@example.com', address: '12 Banjara Hills, Hyderabad', service_type: '24/7 Critical Nursing', team_id: team1.id, notes: 'Post-bypass cardiac recovery. Vitals tracking mandatory.' },
    { phone: '9123456789', full_name: 'Lakshmi Devi', email: 'lakshmi@example.com', address: '45 Jubilee Hills, Hyderabad', service_type: 'Elderly Home Care', team_id: team1.id, notes: 'Type-2 Diabetes. Blood glucose checks twice daily.' },
    { phone: '9765432100', full_name: 'Suresh Mehta', email: 'suresh@example.com', address: '8 Madhapur, Hyderabad', service_type: 'Post-Surgery Rehab', team_id: team1.id, notes: 'Total knee replacement rehabilitation. Physiotherapy 3x weekly.' },
    { phone: '9988776655', full_name: 'Kamala Bai', email: 'kamala@example.com', address: '22 Secunderabad, Hyderabad', service_type: 'Palliative Care', team_id: team2.id, notes: 'Compassionate care, pain management, oxygen support.' },
    { phone: '9112233445', full_name: 'Dr. Venkat Rao', email: 'venkat@example.com', address: '5 Hitech City, Hyderabad', service_type: 'Stroke Recovery', team_id: team2.id, notes: 'Mobility assistance, daily speech exercises.' },
  ];

  const customers: any[] = [];
  const patients: any[] = [];
  for (const cd of customersDef) {
    let cust = await prisma.customer.findFirst({ where: { phone: cd.phone } });
    if (!cust) {
      cust = await prisma.customer.create({
        data: {
          phone: cd.phone,
          full_name: cd.full_name,
          email: cd.email,
          address: cd.address,
          service_type: cd.service_type,
          customer_number: `CUS-${cd.phone.slice(-4)}`,
          status: CustomerStatus.ACTIVE,
          team_id: cd.team_id
        }
      });
    }
    customers.push(cust);

    let pat = await prisma.patient.findFirst({ where: { customer_id: cust.id } });
    if (!pat) {
      pat = await prisma.patient.create({
        data: {
          patient_number: `PAT-${cd.phone.slice(-4)}`,
          full_name: `${cd.full_name} (Patient)`,
          address: cd.address,
          care_requirements: cd.notes,
          customer_id: cust.id
        }
      });
    }
    patients.push(pat);
  }
  const [c1, c2, c3, c4, c5] = customers;
  const [p1, p2, p3] = patients;

  // 7. Invoices & Payments (Comprehensive Financial Data)
  const invoiceData = [
    {
      customer: c1, total: 42000, status: InvoiceStatus.PARTIALLY_PAID, daysAgo: 20, dueDaysAgo: 10,
      payments: [
        { amount: 10000, method: PaymentMethod.UPI, daysAgo: 18, ref: 'UPI826351' },
        { amount: 8000, method: PaymentMethod.CASH, daysAgo: 12, ref: 'CASH91234' },
      ]
    },
    { customer: c2, total: 18000, status: InvoiceStatus.OVERDUE, daysAgo: 35, dueDaysAgo: 25, payments: [] },
    {
      customer: c3, total: 28500, status: InvoiceStatus.PAID, daysAgo: 40, dueDaysAgo: 30,
      payments: [
        { amount: 15000, method: PaymentMethod.BANK_TRANSFER, daysAgo: 38, ref: 'NEFT20260801' },
        { amount: 13500, method: PaymentMethod.BANK_TRANSFER, daysAgo: 30, ref: 'NEFT20260810' },
      ]
    },
    { customer: c4, total: 22000, status: InvoiceStatus.PENDING, daysAgo: 5, dueDaysAgo: -5, payments: [] },
    {
      customer: c5, total: 55000, status: InvoiceStatus.PARTIALLY_PAID, daysAgo: 15, dueDaysAgo: 5,
      payments: [
        { amount: 25000, method: PaymentMethod.CARD, daysAgo: 13, ref: 'CARD7654321' },
      ]
    },
    { customer: c1, total: 35000, status: InvoiceStatus.ISSUED, daysAgo: 1, dueDaysAgo: -14, payments: [] },
  ];

  for (const inv of invoiceData) {
    const refId = crypto.randomBytes(3).toString('hex').toUpperCase();
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

  // 8. Care Assignments & Shifts
  const asg1 = await prisma.careAssignment.create({
    data: {
      assignment_number: 'ASG-1001',
      customer_id: c1.id,
      patient_id: p1.id,
      employee_id: staff1.id,
      team_id: team1.id,
      service_type: '24/7 Critical Nursing',
      start_date: new Date(),
      start_time: '08:00',
      end_time: '20:00',
      status: AssignmentStatus.IN_PROGRESS,
      notes: 'Primary nurse, daily wound dressing and vitals.'
    }
  });

  const asg2 = await prisma.careAssignment.create({
    data: {
      assignment_number: 'ASG-1002',
      customer_id: c2.id,
      patient_id: p2.id,
      employee_id: staff2.id,
      team_id: team1.id,
      service_type: 'Elderly Home Care',
      start_date: new Date(),
      start_time: '09:00',
      end_time: '17:00',
      status: AssignmentStatus.ASSIGNED,
      notes: 'Evening blood sugar check mandatory.'
    }
  });

  // Shifts for Today & Tomorrow
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  await prisma.shift.create({
    data: {
      assignment_id: asg1.id,
      employee_id: staff1.id,
      shift_date: today,
      start_time: '08:00',
      end_time: '20:00',
      status: 'SCHEDULED'
    }
  });

  await prisma.shift.create({
    data: {
      assignment_id: asg2.id,
      employee_id: staff2.id,
      shift_date: today,
      start_time: '09:00',
      end_time: '17:00',
      status: 'SCHEDULED'
    }
  });

  await prisma.shift.create({
    data: {
      assignment_id: asg1.id,
      employee_id: staff1.id,
      shift_date: tomorrow,
      start_time: '08:00',
      end_time: '20:00',
      status: 'SCHEDULED'
    }
  });

  // 9. Tasks
  await prisma.task.createMany({
    data: [
      { title: 'Submit patient vitals log', description: 'Log blood pressure and blood glucose for Rajesh Patel.', priority: 'HIGH', due_date: new Date(Date.now() + 86400000), status: TaskStatus.TODO, employee_id: staff1.id, team_id: team1.id },
      { title: 'Check oxygen cylinder pressure', description: 'Verify reserve oxygen tank is at 2000 PSI.', priority: 'MEDIUM', due_date: new Date(Date.now() + 172800000), status: TaskStatus.IN_PROGRESS, employee_id: staff1.id, team_id: team1.id },
      { title: 'Coordinate physio appointment', description: 'Confirm next therapy visit for Suresh Mehta.', priority: 'LOW', due_date: new Date(Date.now() + 259200000), status: TaskStatus.TODO, employee_id: staff2.id, team_id: team1.id }
    ]
  });

  // 10. Incidents
  await prisma.incident.createMany({
    data: [
      { title: 'Medication Refill Needed', description: 'Patient running low on anti-hypertensive medication. Prescriptions needed.', severity: 'MEDIUM', status: 'OPEN', reported_by_id: staff1.id, assignment_id: asg1.id },
      { title: 'Suction Machine Noise', description: 'Apparatus vibrating abnormally during routine suction.', severity: 'HIGH', status: 'IN_PROGRESS', reported_by_id: staff1.id, assignment_id: asg1.id }
    ]
  });

  // 11. Attendance
  for (let d = 1; d <= 5; d++) {
    const attDate = new Date(Date.now() - d * 86400000);
    await prisma.attendance.create({
      data: {
        date: attDate,
        check_in: new Date(attDate.getTime() + 8 * 3600000),
        check_out: new Date(attDate.getTime() + 17 * 3600000),
        employee_id: staff1.id
      }
    });
  }

  // 12. Audit Logs (for Audit Tab)
  await prisma.auditLog.createMany({
    data: [
      { action: 'ADMIN_LOGIN', entity_type: 'USER', entity_id: admin.id, actor_user_id: admin.id, result: 'SUCCESS' },
      { action: 'CUSTOMER_CREATED', entity_type: 'CUSTOMER', entity_id: c1.id, actor_user_id: lead1.id, result: 'SUCCESS', metadata: JSON.stringify({ name: c1.full_name }) },
      { action: 'INVOICE_GENERATED', entity_type: 'INVOICE', entity_id: c1.id, actor_user_id: admin.id, result: 'SUCCESS', metadata: JSON.stringify({ amount: 42000 }) },
      { action: 'PAYMENT_RECORDED', entity_type: 'PAYMENT', entity_id: c1.id, actor_user_id: lead1.id, result: 'SUCCESS', metadata: JSON.stringify({ amount: 10000, method: 'UPI' }) },
      { action: 'SHIFT_SCHEDULED', entity_type: 'SHIFT', entity_id: asg1.id, actor_user_id: lead1.id, result: 'SUCCESS' },
      { action: 'INCIDENT_REPORTED', entity_type: 'INCIDENT', entity_id: asg1.id, actor_user_id: staff1.id, result: 'SUCCESS' },
      { action: 'AUDIT_EXPORT', entity_type: 'SYSTEM', entity_id: 'sys', actor_user_id: admin.id, result: 'SUCCESS' },
    ]
  });

  console.log('🎉 Comprehensive database seeding completed successfully!');
  return {
    users: 10,
    teams: 4,
    customers: 5,
    invoices: 6,
    shifts: 3,
    auditLogs: 7
  };
}
