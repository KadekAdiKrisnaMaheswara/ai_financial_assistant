/*
  Warnings:

  - The values [completed,cancelled] on the enum `GoalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GoalStatus_new" AS ENUM ('active', 'pending');
ALTER TABLE "financial_goals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "financial_goals" ALTER COLUMN "status" TYPE "GoalStatus_new" USING ("status"::text::"GoalStatus_new");
ALTER TYPE "GoalStatus" RENAME TO "GoalStatus_old";
ALTER TYPE "GoalStatus_new" RENAME TO "GoalStatus";
DROP TYPE "GoalStatus_old";
ALTER TABLE "financial_goals" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;
