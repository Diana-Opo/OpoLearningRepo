-- AlterEnum: Replace support/sales/finance/manager with agent/manager
-- Existing rows with support/sales/finance are converted to agent; manager stays manager.
BEGIN;

CREATE TYPE "UserRole_new" AS ENUM ('agent', 'manager');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING CASE
    WHEN "role"::text = 'manager' THEN 'manager'::"UserRole_new"
    ELSE 'agent'::"UserRole_new"
  END;

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'agent';

COMMIT;
