import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidDocumentHash } from "@/lib/document-hash";
import { getFriendlyDatabaseErrorMessage, isDatabaseUnavailableError } from "@/lib/db-error";

export const dynamic = "force-dynamic";

/**
 * API Route: GET /api/un/history
 * 
 * Returns list of previously analyzed UN documents.
 * Supports pagination and optional filtering.
 * 
 * Query params:
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - hash: string (optional, get specific document by hash)
 * 
 * @module api/un/history
 */

interface HistoryItem {
  id: string;
  documentHash: string;
  sourceType: string;
  sourceReference: string | null;
  title: string | null;
  documentLength: number;
  createdAt: string;
}

interface HistoryResponse {
  success: boolean;
  items?: HistoryItem[];
  total?: number;
  error?: string;
}

interface SingleDocResponse {
  success: boolean;
  analysis?: any;
  documentHash?: string;
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<HistoryResponse | SingleDocResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("hash");
    
    // If hash is provided, return that specific document's analysis
    if (hash) {
      if (!isValidDocumentHash(hash)) {
        return NextResponse.json({
          success: false,
          error: "Invalid document hash format.",
        }, { status: 400 });
      }

      const doc = await prisma.unDocumentAnalysis.findUnique({
        where: { documentHash: hash },
      });

      if (!doc) {
        return NextResponse.json({
          success: false,
          error: "Document not found.",
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        analysis: JSON.parse(doc.analysisPayload),
        documentHash: doc.documentHash,
      });
    }

    // Otherwise, return paginated list
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [items, total] = await Promise.all([
      prisma.unDocumentAnalysis.findMany({
        select: {
          id: true,
          documentHash: true,
          sourceType: true,
          sourceReference: true,
          title: true,
          documentLength: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.unDocumentAnalysis.count(),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    });
  } catch (error: unknown) {
    console.error("[UN-History] Error:", error);
    const friendlyMessage = getFriendlyDatabaseErrorMessage(error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return NextResponse.json({
      success: false,
      error: friendlyMessage,
    }, { status });
  }
}
