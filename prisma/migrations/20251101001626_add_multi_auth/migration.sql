-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('OAUTH', 'ENTRA_ID', 'BABSY_APP', 'OTP');

-- CreateEnum
CREATE TYPE "BabsyUserType" AS ENUM ('SITTER', 'PARENT', 'PARTNER', 'MEMBER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "authMethod" "AuthMethod" NOT NULL DEFAULT 'OAUTH',
ADD COLUMN "babsyUserId" TEXT,
ADD COLUMN "babsyUserType" "BabsyUserType";

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_babsyUserId_key" ON "User"("babsyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_token_key" ON "OtpToken"("token");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "OtpToken"("email");

-- CreateIndex
CREATE INDEX "OtpToken_token_idx" ON "OtpToken"("token");

-- CreateIndex
CREATE INDEX "OtpToken_expiresAt_idx" ON "OtpToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "OtpToken" ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
