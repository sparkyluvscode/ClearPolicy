import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload
 *
 * Accepts a file upload (PDF, DOCX, TXT, etc.) and extracts its text content.
 * The extracted text is then returned to the client, which can feed it
 * into the Omni-Search API as `documentText`.
 *
 * For now we handle:
 * - .txt / .md — read directly
 * - .pdf — basic text extraction
 * - .docx — basic text extraction
 * - Other — attempt as text
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
      // Plain text files
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".pdf")) {
      // PDF: try to extract text using a simple approach
      text = extractPdfText(buffer);
    } else if (name.endsWith(".docx")) {
      // DOCX: extract text from XML
      text = await extractDocxText(buffer);
    } else {
      // Attempt as text
      text = buffer.toString("utf-8");
      // Check if it's actually binary
      const nonPrintable = text.slice(0, 500).split("").filter(c => {
        const code = c.charCodeAt(0);
        return code < 32 && code !== 10 && code !== 13 && code !== 9;
      }).length;
      if (nonPrintable > 50) {
        return NextResponse.json(
          { success: false, error: "Unsupported file format. Please upload a PDF, DOCX, or text file." },
          { status: 400 }
        );
      }
    }

    // Trim and limit
    text = text.trim();
    if (text.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from this file. It may be image-based or encrypted." },
        { status: 400 }
      );
    }

    // Limit to ~50k chars for the LLM
    const truncated = text.length > 50000;
    if (truncated) text = text.slice(0, 50000);

    return NextResponse.json({
      success: true,
      filename: file.name,
      textLength: text.length,
      truncated,
      text,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process file." },
      { status: 500 }
    );
  }
}

/**
 * Basic PDF text extraction without external dependencies.
 * Looks for text streams in the PDF binary.
 * Not perfect but handles many simple PDFs.
 */
function extractPdfText(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const texts: string[] = [];

  // Extract text between BT ... ET (text objects)
  const textObjectRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = textObjectRegex.exec(content)) !== null) {
    const block = match[1];
    // Extract text from Tj, TJ, and ' operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      texts.push(decodeEscapes(tjMatch[1]));
    }

    // TJ arrays: [(text) kerning (text) ...]
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const arrContent = tjArrMatch[1];
      const innerRegex = /\(([^)]*)\)/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(arrContent)) !== null) {
        texts.push(decodeEscapes(innerMatch[1]));
      }
    }
  }

  // Also try to find plain text streams
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let streamMatch;
  while ((streamMatch = streamRegex.exec(content)) !== null) {
    const streamContent = streamMatch[1];
    // Only use streams that look like they contain readable text
    const printable = streamContent.replace(/[^\x20-\x7E\n\r]/g, "");
    if (printable.length > 50 && printable.length / streamContent.length > 0.5) {
      // Extract text tokens
      const words = printable.match(/[A-Za-z]{2,}/g);
      if (words && words.length > 5) {
        texts.push(printable.trim());
      }
    }
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}

function decodeEscapes(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/**
 * Basic DOCX text extraction.
 * DOCX files are ZIPs containing XML. We look for word/document.xml.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  // DOCX is a ZIP file. Look for PK signature
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
    return "";
  }

  // Simple approach: find XML text content between <w:t> tags
  const content = buffer.toString("utf-8", 0, buffer.length);
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const texts: string[] = [];
  let match;
  while ((match = textRegex.exec(content)) !== null) {
    texts.push(match[1]);
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
