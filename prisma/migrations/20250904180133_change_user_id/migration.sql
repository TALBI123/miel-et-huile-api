/*
  Warnings:

  - Made the column `userId` on table `VerificationTokens` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."VerificationTokens" DROP CONSTRAINT "VerificationTokens_userId_fkey";

-- AlterTable
ALTER TABLE "public"."VerificationTokens" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."VerificationTokens" ADD CONSTRAINT "VerificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
