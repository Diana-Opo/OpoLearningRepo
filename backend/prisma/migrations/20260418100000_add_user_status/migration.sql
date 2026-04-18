-- Create UserStatus enum
CREATE TYPE "UserStatus" AS ENUM ('approved', 'pending', 'rejected');

-- Add status column — new sign-ups default to 'pending'
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'pending';

-- All pre-existing users are already approved
UPDATE "users" SET "status" = 'approved';
