-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "session" TEXT,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceDoc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "measureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "docType" TEXT,
    CONSTRAINT "SourceDoc_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "Measure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "measureId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "tldr" TEXT NOT NULL,
    "whatItDoes" TEXT NOT NULL,
    "whoAffected" TEXT NOT NULL,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "sourceRatio" REAL NOT NULL,
    "citations" TEXT NOT NULL,
    CONSTRAINT "Summary_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "Measure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Measure_slug_key" ON "Measure"("slug");
