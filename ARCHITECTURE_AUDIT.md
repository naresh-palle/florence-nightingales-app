# ARCHITECTURE AUDIT
**Florence Nightingales - Corporate Nursing Service Management Platform**

## 1. Executive Summary
This audit reviews the current state of the Florence Nightingales application against the new corporate platform business objectives. The existing application provides a strong foundation with secure authentication, a functional RBAC model, and isolated team data. However, evolving it into a full-scale corporate nursing-service management platform requires significant structural separation (e.g., separating Customers from Patients) and the introduction of new modules (CRM, HR, Quoting, Shifts, Incidents, Quality Assurance). 

**Conclusion:** The existing project is salvageable and serves as a solid Phase 2/3 baseline. We do NOT need to rewrite the application. Instead, we must perform incremental database migrations to introduce missing entities and extend existing business logic to support the new corporate requirements.

---

## 2. Existing Architecture Assessment

### 2.1 Backend & Database
- **Tech Stack:** Node.js, Express.js, Prisma ORM, PostgreSQL (Supabase).
- **Authentication:** Custom JWT-based auth with `argon2id` password hashing. Includes secure login, forgot-password, and strict rate-limiting considerations. 
- **Authorization:** Middleware-driven RBAC (`requireRole`) and Data-Level Isolation (`enforceTeamScope`). Validates permissions accurately on the server.
- **Finance Engine:** Uses Prisma `$transaction` and exact decimal representations (`@db.Decimal(10, 2)`) for precise financial calculation and concurrency protection.

### 2.2 Frontend (Mobile)
- **Tech Stack:** React Native (Expo), React Navigation.
- **Structure:** Role-specific bottom-tab dashboards (Admin, Team Lead, Employee). 
- **UI/UX:** Uses modern aesthetics, fast tab switching, and pull-to-refresh data loading. Lacks the full "Quick Actions" and "Corporate Home Screen" paradigm.

---

## 3. Gap Analysis vs. Corporate PRD

### 3.1 Roles & Identity (Future-Ready RBAC)
- **Current:** Hardcoded Prisma `enum Role { ADMIN, TEAM_LEAD, EMPLOYEE }`.
- **Target:** Needs to support arbitrary future roles (Super Admin, HR Manager, Finance Manager). 
- **Migration Risk:** Moderate. Enum mapping in Prisma needs to either become flexible (string-based with a permission matrix table) or updated.

### 3.2 CRM & Client Management
- **Current:** Flattened `Customer` model that acts as both the payer and the care recipient.
- **Target:** 
  - Need `Enquiry`/`Lead` tracking.
  - Must explicitly separate `Customer` (the payer/contact) from `Patient` / `CareRecipient` (the clinical recipient).
  - Need `Quotation` and `ServiceAgreement` modules.
- **Migration Risk:** High. The `CareAssignment` and `Invoice` tables currently link directly to `Customer`. Data migration scripts will be needed to duplicate existing `Customer` records into `Patient` records for backwards compatibility during the split.

### 3.3 HR & Employee Master
- **Current:** Basic `User` table fields (designation, qualification, experience).
- **Target:** Complex employee lifecycle requiring `EmployeeDocument`, `Certification`, `EmployeeSkill`, `LeaveRequest`, and `Training` models.
- **Migration Risk:** Low. Additive tables.

### 3.4 Care Delivery & Operations
- **Current:** Basic `CareAssignment` mapped directly to an employee.
- **Target:** 
  - Needs multi-layered operational models: `Assessment` -> `ServicePlan` -> `CareAssignment` -> `Shift` -> `Attendance` -> `DailyCareReport`.
  - Shift management requires its own entity rather than being hardcoded into `CareAssignment`.
  - Needs `Incident` and `Complaint` ticketing systems.
- **Migration Risk:** Moderate. `CareAssignment` schema needs to be transitioned to act as a parent for `Shift` instances.

### 3.5 Billing & Finance
- **Current:** Robust exact-money `Invoice` and `Payment` system with concurrent transactions.
- **Target:** Needs `FinancialAdjustment` (discounts, refunds), `PricingRule` (pricing engine configurations), and statement generation logic.
- **Migration Risk:** Low. The existing core finance logic satisfies the strict concurrency/decimal rules.

### 3.6 Multi-Branch Architecture
- **Current:** Single global organization.
- **Target:** Future-ready `Branch` hierarchy (`Organization` -> `Branch` -> `Team`).
- **Migration Risk:** Moderate. Requires injecting `branch_id` across primary entities.

---

## 4. Reusable Components & Established Patterns

1. **Transaction Wrapping for Finance:** The current payment controller successfully uses Prisma transactions to prevent overpayments. This MUST be preserved.
2. **`enforceTeamScope` Middleware:** Currently prevents IDOR for Team Leads accessing Customer data. This pattern will be replicated for Patients, Invoices, Incidents, etc.
3. **Audit Logging:** The `AuditLog` table currently records actions via the `auditEvents` method. This is highly scalable and will be extended.
4. **Environment Constraints:** Seed scripts execute safely inside the Express `app.listen` callback to comply with Render's rapid-port-binding requirements and bypass Supabase pooler limitations.

---

## 5. Incremental Implementation Strategy

Following the PRD's instruction to not rewrite the project blindly, development will proceed in these exact incremental phases.

*Note: Phase 1 (Audit) is completed by this document.*

* **Phase 2:** Database Refactoring (Separate Customer from Patient, add Lead/Enquiry, Branch structure).
* **Phase 3 & 4:** HR, Skills, Documents & Certifications backend modules.
* **Phase 5:** Quoting, Service Catalog, & Service Plans.
* **Phase 6:** Shift Management, Leave Requests & Roster.
* **Phase 7:** Care Reports, Handovers, Incidents & Complaints.
* **Phase 8:** Extension of Finance (Refunds, Adjustments, Pricing Rules).
* **Phase 9:** Mobile UI updates to map to the new API endpoints.

**Strict Rules for Next Steps:**
- All DB modifications must be additive where possible.
- No historical data destruction.
- Run `tsc` and backend tests after every phase.
- All new routes must explicitly use `authenticate` + `requireRole` + `enforceTeamScope` patterns.
