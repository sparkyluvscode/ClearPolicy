-- CreateTable
CREATE TABLE "UnDocumentAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "documentHash" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "title" TEXT,
    "documentLength" INTEGER NOT NULL,
    "analysisPayload" TEXT NOT NULL,
    "userId" TEXT,
    "processingTimeMs" INTEGER,
    "modelUsed" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "UnDocumentAnalysis_documentHash_key" ON "UnDocumentAnalysis"("documentHash");
