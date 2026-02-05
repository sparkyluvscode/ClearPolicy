import { NextRequest, NextResponse } from "next/server";
import { extractDocument, extractFromText, extractFromUrl } from "@/lib/document-extractor";
import { analyzeUNDocument, estimateTokens } from "@/lib/un-ai";
import { computeDocumentHash, isValidDocumentHash } from "@/lib/document-hash";
import { prisma } from "@/lib/prisma";
import type { DocumentInputMethod, UNDocumentRequest, UNAnalysisResponse, UNDocumentAnalysis } from "@/lib/un-types";

/**
 * API Route: POST /api/un/analyze
 * 
 * Analyzes a UN/international policy document and returns structured analysis.
 * 
 * CACHING BEHAVIOR:
 * - Computes a deterministic hash of the document content
 * - Checks database for existing analysis with the same hash
 * - If found, returns cached result immediately (no AI call)
 * - If not found, performs AI analysis and caches the result
 * 
 * Accepts FormData with:
 * - inputMethod: "url" | "upload" | "text"
 * - url: string (if inputMethod === "url")
 * - file: File (if inputMethod === "upload")
 * - text: string (if inputMethod === "text")
 * 
 * Returns: UNAnalysisResponse with additional `cached` and `documentHash` fields
 * 
 * @module api/un/analyze
 */

// Extended response type with caching metadata
interface CachedUNAnalysisResponse extends UNAnalysisResponse {
  cached?: boolean;
  documentHash?: string;
}

// Logging utility (basic observability)
function logAnalysis(
  inputMethod: DocumentInputMethod,
  documentLength: number,
  success: boolean,
  options?: {
    error?: string;
    processingTimeMs?: number;
    cached?: boolean;
    documentHash?: string;
  }
) {
  const logData = {
    timestamp: new Date().toISOString(),
    inputMethod,
    documentLength,
    estimatedTokens: Math.ceil(documentLength / 4),
    success,
    cached: options?.cached || false,
    documentHash: options?.documentHash?.slice(0, 12),
    error: options?.error ? options.error.slice(0, 200) : undefined,
    processingTimeMs: options?.processingTimeMs,
  };
  
  if (success) {
    console.log("[UN-API] Analysis completed:", JSON.stringify(logData));
  } else {
    console.error("[UN-API] Analysis failed:", JSON.stringify(logData));
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<CachedUNAnalysisResponse>> {
  const startTime = Date.now();
  let inputMethod: DocumentInputMethod = "text";
  let documentLength = 0;
  let documentHash: string | undefined;

  try {
    const formData = await req.formData();
    inputMethod = (formData.get("inputMethod") as DocumentInputMethod) || "text";

    // Validate input method
    if (!["url", "upload", "text"].includes(inputMethod)) {
      return NextResponse.json({
        success: false,
        error: "Invalid input method. Use 'url', 'upload', or 'text'.",
      }, { status: 400 });
    }

    let content: string = "";
    let title: string | undefined;
    let sourceUrl: string | undefined;
    let sourceFilename: string | undefined;
    let wasTruncated = false;
    let sourceReference: string | undefined;

    // Extract content based on input method
    if (inputMethod === "url") {
      const url = formData.get("url") as string;
      if (!url || typeof url !== "string") {
        return NextResponse.json({
          success: false,
          error: "URL is required for URL input method.",
        }, { status: 400 });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return NextResponse.json({
          success: false,
          error: "Invalid URL format.",
        }, { status: 400 });
      }

      // Sanitize URL - only allow http/https
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({
          success: false,
          error: "Only HTTP and HTTPS URLs are supported.",
        }, { status: 400 });
      }

      const result = await extractFromUrl(url);
      if (!result.success || !result.content) {
        return NextResponse.json({
          success: false,
          error: result.error || "Failed to extract content from URL.",
        }, { status: 400 });
      }

      content = result.content;
      title = result.title;
      sourceUrl = url;
      sourceReference = url;
      wasTruncated = result.wasTruncated || false;
      documentLength = result.originalLength || content.length;

    } else if (inputMethod === "upload") {
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({
          success: false,
          error: "File is required for upload input method.",
        }, { status: 400 });
      }

      // Validate file type
      const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const allowedExtensions = [".pdf", ".docx", ".txt"];
      const hasValidMime = allowedMimeTypes.includes(file.type);
      const hasValidExt = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidMime && !hasValidExt) {
        return NextResponse.json({
          success: false,
          error: "Invalid file type. Please upload a PDF, DOCX, or TXT file.",
        }, { status: 400 });
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: "File is too large. Maximum size is 10MB.",
        }, { status: 400 });
      }

      // Handle different file types
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        // Plain text file
        content = await file.text();
        const normalized = extractFromText(content);
        if (!normalized.success || !normalized.content) {
          return NextResponse.json({
            success: false,
            error: normalized.error || "Failed to process text file.",
          }, { status: 400 });
        }
        content = normalized.content;
        title = normalized.title || file.name.replace(/\.txt$/i, "");
        wasTruncated = normalized.wasTruncated || false;
        documentLength = normalized.originalLength || content.length;
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        // PDF file - need to parse
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await extractDocument("upload", buffer, file.name);
        if (!result.success || !result.content) {
          return NextResponse.json({
            success: false,
            error: result.error || "Failed to extract content from PDF. Try copy-pasting the text instead.",
          }, { status: 400 });
        }
        content = result.content;
        title = result.title;
        wasTruncated = result.wasTruncated || false;
        documentLength = result.originalLength || content.length;
      } else {
        // DOCX - for now, suggest copy-paste
        return NextResponse.json({
          success: false,
          error: "DOCX parsing is not yet supported. Please copy-paste the text content instead.",
        }, { status: 400 });
      }

      sourceFilename = file.name;
      sourceReference = file.name;

    } else if (inputMethod === "text") {
      const text = formData.get("text") as string;
      if (!text || typeof text !== "string") {
        return NextResponse.json({
          success: false,
          error: "Text content is required for text input method.",
        }, { status: 400 });
      }

      const result = extractFromText(text);
      if (!result.success || !result.content) {
        return NextResponse.json({
          success: false,
          error: result.error || "Failed to process text content.",
        }, { status: 400 });
      }

      content = result.content;
      title = result.title;
      sourceReference = title || "Pasted text";
      wasTruncated = result.wasTruncated || false;
      documentLength = result.originalLength || content.length;
    }

    // Validate we have content
    if (!content || content.length < 50) {
      return NextResponse.json({
        success: false,
        error: "Document content is too short for analysis. Please provide more text.",
      }, { status: 400 });
    }

    // Compute document hash for caching
    try {
      documentHash = computeDocumentHash(content);
      console.log(`[UN-API] Document hash: ${documentHash.slice(0, 12)}... (${content.length} chars)`);
    } catch (hashError) {
      console.error("[UN-API] Hash computation failed:", hashError);
      // Continue without caching if hash fails
    }

    // Check for cached analysis
    if (documentHash) {
      try {
        const cached = await prisma.unDocumentAnalysis.findUnique({
          where: { documentHash },
        });

        if (cached) {
          const processingTimeMs = Date.now() - startTime;
          const analysis = JSON.parse(cached.analysisPayload) as UNDocumentAnalysis;

          logAnalysis(inputMethod, documentLength, true, {
            processingTimeMs,
            cached: true,
            documentHash,
          });

          return NextResponse.json({
            success: true,
            analysis,
            cached: true,
            documentHash,
            meta: {
              inputMethod,
              documentLength,
              processingTimeMs,
              modelUsed: cached.modelUsed || "cached",
            },
          });
        }
      } catch (dbError) {
        // Log but continue - DB lookup failure shouldn't block analysis
        console.error("[UN-API] Cache lookup failed:", dbError);
      }
    }

    // Build analysis request
    const analysisRequest: UNDocumentRequest = {
      inputMethod,
      content,
      title,
      url: sourceUrl,
      filename: sourceFilename,
    };

    // Perform AI analysis
    const analysis = await analyzeUNDocument(analysisRequest);

    // Update wasTruncated from analysis if applicable
    if (analysis.wasTruncated) {
      wasTruncated = true;
    }

    const processingTimeMs = Date.now() - startTime;

    // Cache the analysis
    if (documentHash) {
      try {
        await prisma.unDocumentAnalysis.upsert({
          where: { documentHash },
          update: {
            analysisPayload: JSON.stringify(analysis),
            processingTimeMs,
            modelUsed: "gpt-4o-mini",
            updatedAt: new Date(),
          },
          create: {
            documentHash,
            sourceType: inputMethod === "upload" ? "pdf" : inputMethod,
            sourceReference: sourceReference?.slice(0, 500),
            title: analysis.title?.slice(0, 500),
            documentLength,
            analysisPayload: JSON.stringify(analysis),
            processingTimeMs,
            modelUsed: "gpt-4o-mini",
          },
        });
        console.log(`[UN-API] Cached analysis for hash: ${documentHash.slice(0, 12)}...`);
      } catch (dbError) {
        // Log but don't fail - caching is best-effort
        console.error("[UN-API] Failed to cache analysis:", dbError);
      }
    }

    // Log success
    logAnalysis(inputMethod, documentLength, true, {
      processingTimeMs,
      cached: false,
      documentHash,
    });

    return NextResponse.json({
      success: true,
      analysis,
      cached: false,
      documentHash,
      meta: {
        inputMethod,
        documentLength,
        processingTimeMs,
        modelUsed: "gpt-4o-mini",
      },
    });

  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error?.message || "An unexpected error occurred.";

    // Log failure
    logAnalysis(inputMethod, documentLength, false, {
      error: errorMessage,
      processingTimeMs,
      documentHash,
    });

    // Handle specific error types
    if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json({
        success: false,
        error: "Service is temporarily busy. Please try again in a few minutes.",
      }, { status: 503 });
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return NextResponse.json({
        success: false,
        error: "Request timed out. Please try again or use a shorter document.",
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed. Use POST.",
  }, { status: 405 });
}
