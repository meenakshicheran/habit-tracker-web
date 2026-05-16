-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultCategory" TEXT NOT NULL DEFAULT 'General',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "freezeTokens", "id", "image", "lastTokenReset", "level", "name", "onboardingDone", "password", "reminderTime", "updatedAt", "xp") SELECT "createdAt", "email", "emailVerified", "freezeTokens", "id", "image", "lastTokenReset", "level", "name", "onboardingDone", "password", "reminderTime", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
