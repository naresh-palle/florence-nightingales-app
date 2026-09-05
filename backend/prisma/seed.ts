import { PrismaClient, Role, UserStatus, InvoiceStatus, CustomerStatus } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with mock data...');

  const defaultPassword = await argon2.hash('password123', { type: argon2.argon2id });

  // 1. Create Admin: Mohan
  const admin = await prisma.user.upsert({
    where: { email: 'mohan@florence.com' },
    update: {},
    create: {
      email: 'mohan@florence.com',
      full_name: 'Mohan (Admin)',
      password_hash: defaultPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Created Admin: ${admin.full_name}`);

  // 2. Create Team
  const team = await prisma.team.create({
    data: {
      name: 'Alpha Nursing Team',
      description: 'Primary critical care support team',
    }
  });

  // 3. Create Team Lead: Prashanth
  const teamLead = await prisma.user.upsert({
    where: { email: 'prashanth@florence.com' },
    update: {},
    create: {
      email: 'prashanth@florence.com',
      full_name: 'Prashanth (Team Lead)',
      password_hash: defaultPassword,
      role: Role.TEAM_LEAD,
      status: UserStatus.ACTIVE,
      team_id: team.id
    },
  });
  
  // Assign Team Lead to Team
  await prisma.team.update({
    where: { id: team.id },
    data: { team_lead_id: teamLead.id }
  });
  console.log(`Created Team Lead: ${teamLead.full_name}`);

  // 4. Create Staff: Swetha
  const staff = await prisma.user.upsert({
    where: { email: 'swetha@florence.com' },
    update: {},
    create: {
      email: 'swetha@florence.com',
      full_name: 'Swetha (Staff)',
      password_hash: defaultPassword,
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      team_id: team.id
    },
  });
  console.log(`Created Staff: ${staff.full_name}`);

  // 5. Create Mock Customer
  const customer = await prisma.customer.create({
    data: {
      full_name: 'John Doe (Patient)',
      phone: '9876543210',
      email: 'patient@example.com',
      address: '123 Recovery Lane, Hyderabad',
      service_type: '24/7 Nursing Support',
      status: CustomerStatus.ACTIVE,
      team_id: team.id
    }
  });
  console.log(`Created Customer: ${customer.full_name}`);

  // 6. Create Mock Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoice_number: `FN-INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      service_period_start: new Date(),
      service_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      billing_date: new Date(),
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      total_amount: new Decimal(35000.00),
      status: InvoiceStatus.PENDING,
      customer_id: customer.id
    }
  });
  console.log(`Created Invoice: ${invoice.invoice_number} for ₹35,000`);

  console.log('\n--- SEEDING COMPLETE ---');
  console.log('You can now log in with the following emails and password: password123');
  console.log('1. mohan@florence.com');
  console.log('2. prashanth@florence.com');
  console.log('3. swetha@florence.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
