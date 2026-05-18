-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "goal_id" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "financial_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
