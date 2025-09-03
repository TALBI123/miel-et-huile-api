-- DropForeignKey
ALTER TABLE "public"."VerificationTokens" DROP CONSTRAINT "VerificationTokens_userId_fkey";

-- AlterTable
ALTER TABLE "public"."VerificationTokens" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."VerificationTokens" ADD CONSTRAINT "VerificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
