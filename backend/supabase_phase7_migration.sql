-- Phase 7 Incident Management Module Migration

-- CreateTable "Incident"
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reported_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "assignment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey "Incident" -> "User" (Reporter)
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey "Incident" -> "User" (Assignee)
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey "Incident" -> "CareAssignment"
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "CareAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
