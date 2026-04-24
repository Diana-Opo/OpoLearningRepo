-- CreateTable: permission_groups
CREATE TABLE "permission_groups" (
    "id"             TEXT         NOT NULL,
    "name"           TEXT         NOT NULL,
    "isSystem"       BOOLEAN      NOT NULL DEFAULT false,
    "isAdmin"        BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Page visibility
    "viewDashboard"  BOOLEAN NOT NULL DEFAULT false,
    "viewLivechats"  BOOLEAN NOT NULL DEFAULT false,
    "viewTickets"    BOOLEAN NOT NULL DEFAULT false,
    "viewIssues"     BOOLEAN NOT NULL DEFAULT false,
    "viewAgents"     BOOLEAN NOT NULL DEFAULT false,
    "viewReports"    BOOLEAN NOT NULL DEFAULT false,

    -- Ticket actions
    "ticketsCreate"  BOOLEAN NOT NULL DEFAULT false,
    "ticketsEdit"    BOOLEAN NOT NULL DEFAULT false,
    "ticketsDelete"  BOOLEAN NOT NULL DEFAULT false,
    "ticketsExport"  BOOLEAN NOT NULL DEFAULT false,

    -- Issue actions
    "issuesCreate"   BOOLEAN NOT NULL DEFAULT false,
    "issuesEdit"     BOOLEAN NOT NULL DEFAULT false,
    "issuesDelete"   BOOLEAN NOT NULL DEFAULT false,
    "issuesExport"   BOOLEAN NOT NULL DEFAULT false,

    -- Agent actions
    "agentsCreate"   BOOLEAN NOT NULL DEFAULT false,
    "agentsEdit"     BOOLEAN NOT NULL DEFAULT false,
    "agentsArchive"  BOOLEAN NOT NULL DEFAULT false,
    "agentsExport"   BOOLEAN NOT NULL DEFAULT false,

    -- Reports actions
    "reportsExport"  BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_key" ON "permission_groups"("name");

-- AlterTable: add permissionGroupId to users
ALTER TABLE "users" ADD COLUMN "permissionGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_permissionGroupId_fkey"
    FOREIGN KEY ("permissionGroupId") REFERENCES "permission_groups"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default system groups
INSERT INTO "permission_groups" (
    "id","name","isSystem","isAdmin",
    "viewDashboard","viewLivechats","viewTickets","viewIssues","viewAgents","viewReports",
    "ticketsCreate","ticketsEdit","ticketsDelete","ticketsExport",
    "issuesCreate","issuesEdit","issuesDelete","issuesExport",
    "agentsCreate","agentsEdit","agentsArchive","agentsExport",
    "reportsExport"
) VALUES
-- Admin: everything enabled, locked
('system-admin',   'Admin',   true, true,
  true,true,true,true,true,true,
  true,true,true,true,
  true,true,true,true,
  true,true,true,true,
  true),
-- Manager: full access by default, editable
('system-manager', 'Manager', true, false,
  true,true,true,true,true,true,
  true,true,true,true,
  true,true,true,true,
  true,true,true,true,
  true),
-- Agent: limited access by default, editable
('system-agent',   'Agent',   true, false,
  true,true,true,true,false,false,
  true,true,false,false,
  true,false,false,false,
  false,false,false,false,
  false);
