-- CreateTable
CREATE TABLE "StreakFreeze" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StreakFreeze_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StreakFreeze_habitId_idx" ON "StreakFreeze"("habitId");

-- CreateIndex
CREATE INDEX "StreakFreeze_userId_idx" ON "StreakFreeze"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakFreeze_habitId_date_key" ON "StreakFreeze"("habitId", "date");
