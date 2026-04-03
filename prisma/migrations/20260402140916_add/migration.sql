-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "settledAt" DATETIME;

-- CreateIndex
CREATE INDEX "Expense_groupId_settledAt_idx" ON "Expense"("groupId", "settledAt");
