ALTER TABLE "User" ADD COLUMN "sapUserId" TEXT;

CREATE UNIQUE INDEX "User_sapUserId_key" ON "User"("sapUserId");
