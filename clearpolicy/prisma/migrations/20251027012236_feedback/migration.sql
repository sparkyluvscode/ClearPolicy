-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "page" TEXT NOT NULL,
    "measureSlug" TEXT,
    "message" TEXT NOT NULL,
    "contact" TEXT
);
