/*
  Warnings:

  - You are about to drop the `ShippingMethod` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "discountPercentage" INTEGER DEFAULT 0,
ADD COLUMN     "discountPrice" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "isOnSale" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "publicId" TEXT;

-- DropTable
DROP TABLE "public"."ShippingMethod";

-- CreateTable
CREATE TABLE "public"."NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "public"."NewsletterSubscription"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_email_idx" ON "public"."NewsletterSubscription"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_isActive_idx" ON "public"."NewsletterSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicId_key" ON "public"."User"("publicId");
