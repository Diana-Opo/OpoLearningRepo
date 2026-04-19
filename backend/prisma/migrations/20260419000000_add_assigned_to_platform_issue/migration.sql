-- AlterTable
ALTER TABLE "platform_issues" ADD COLUMN "assignedTo" INTEGER;

-- AddForeignKey
ALTER TABLE "platform_issues" ADD CONSTRAINT "platform_issues_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
