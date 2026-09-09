-- Phase 6 Shift Management Module Migration

-- CreateTable "Shift"
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey "Shift" -> "CareAssignment"
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "CareAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey "Shift" -> "User"
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
