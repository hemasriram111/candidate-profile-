ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "verificationOtpHash" TEXT,
ADD COLUMN "verificationOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "verificationOtpLastSentAt" TIMESTAMP(3);