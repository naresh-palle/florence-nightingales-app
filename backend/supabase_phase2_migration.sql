-- Phase 2 Database Migration

-- CREATE ENUM TYPES IF NOT EXISTS
DO $$ BEGIN
    CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'ASSESSMENT_PENDING', 'QUOTATION_SENT', 'CONVERTED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable "Organization"
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Branch"
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- AlterTable "Team"
ALTER TABLE "Team" ADD COLUMN "branch_id" TEXT;

-- CreateTable "Enquiry"
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "enquiry_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "service_required" TEXT,
    "location" TEXT,
    "preferred_start_date" TIMESTAMP(3),
    "expected_duration" TEXT,
    "lead_source" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assigned_team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- AlterTable "Customer"
ALTER TABLE "Customer" ADD COLUMN "customer_number" TEXT;

-- CreateTable "Patient"
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "patient_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "address" TEXT,
    "emergency_contact" TEXT,
    "care_requirements" TEXT,
    "mobility_info" TEXT,
    "allergies" TEXT,
    "notes" TEXT,
    "customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- AlterTable "CareAssignment"
ALTER TABLE "CareAssignment" ADD COLUMN "patient_id" TEXT;
ALTER TABLE "CareAssignment" ADD COLUMN "assignment_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_enquiry_number_key" ON "Enquiry"("enquiry_number");
CREATE UNIQUE INDEX "Customer_customer_number_key" ON "Customer"("customer_number");
CREATE UNIQUE INDEX "Patient_patient_number_key" ON "Patient"("patient_number");
CREATE UNIQUE INDEX "CareAssignment_assignment_number_key" ON "CareAssignment"("assignment_number");

-- AddForeignKey "Branch" -> "Organization"
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey "Team" -> "Branch"
ALTER TABLE "Team" ADD CONSTRAINT "Team_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey "Enquiry" -> "Team"
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey "Patient" -> "Customer"
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey "CareAssignment" -> "Patient"
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
