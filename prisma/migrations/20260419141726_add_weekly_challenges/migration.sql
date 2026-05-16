-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDays" INTEGER NOT NULL DEFAULT 5,
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserWeeklyChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "claimedAt" DATETIME,
    CONSTRAINT "UserWeeklyChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "WeeklyChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyChallenge_weekStart_key" ON "WeeklyChallenge"("weekStart");

-- CreateIndex
CREATE INDEX "UserWeeklyChallenge_userId_idx" ON "UserWeeklyChallenge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyChallenge_userId_challengeId_key" ON "UserWeeklyChallenge"("userId", "challengeId");
