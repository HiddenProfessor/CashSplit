-- Replace email with username on User
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = LOWER(REPLACE("email", '@', '_')) WHERE "username" IS NULL;

-- Drop old email index and column, create new username index
DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" DROP COLUMN "email";

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Add currency to Group
ALTER TABLE "Group" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SEK';

-- Add currency and exchangeRate to Expense
ALTER TABLE "Expense" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SEK';
ALTER TABLE "Expense" ADD COLUMN "exchangeRate" REAL NOT NULL DEFAULT 1.0;
