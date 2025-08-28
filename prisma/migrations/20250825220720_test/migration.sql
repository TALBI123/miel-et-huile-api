/*
  Warnings:

  - You are about to drop the `emp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."emp";

-- CreateTable
CREATE TABLE "public"."Emp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Emp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Emp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
