-- CreateTable
CREATE TABLE "DailyInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FreezeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FreezeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '✅',
    "color" TEXT NOT NULL DEFAULT '#000000',
    "category" TEXT NOT NULL DEFAULT 'General',
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "targetDays" INTEGER NOT NULL DEFAULT 7,
    "reminderTime" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT 'anytime',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("archived", "category", "color", "createdAt", "description", "frequency", "icon", "id", "reminderTime", "targetDays", "title", "updatedAt", "userId") SELECT "archived", "category", "color", "createdAt", "description", "frequency", "icon", "id", "reminderTime", "targetDays", "title", "updatedAt", "userId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
CREATE INDEX "Habit_userId_archived_idx" ON "Habit"("userId", "archived");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "freezeTokens" INTEGER NOT NULL DEFAULT 3,
    "lastTokenReset" DATETIME,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "freezeTokens", "id", "image", "level", "name", "password", "updatedAt", "xp") SELECT "createdAt", "email", "emailVerified", "freezeTokens", "id", "image", "level", "name", "password", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DailyInsight_userId_idx" ON "DailyInsight"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInsight_userId_date_key" ON "DailyInsight"("userId", "date");

-- CreateIndex
CREATE INDEX "FreezeEvent_userId_idx" ON "FreezeEvent"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_habitId_idx" ON "JournalEntry"("habitId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_idx" ON "JournalEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_habitId_date_key" ON "JournalEntry"("habitId", "date");
