/**
 * Document Extraction Utilities
 * 
 * This module handles extracting text content from various input sources:
 * - URLs (fetching and parsing web pages)
 * - PDF files (parsing with pdf-parse)
 * - Raw text (normalization)
 * 
 * Designed as a reusable module that can be extended for new input formats.
 * 
 * @module document-extractor
 */

import type { DocumentInputMethod } from "./un-types";

// pdf-parse type definition for v1.x
type PDFParseResult = { text: string; numpages: number; info: any };
type PDFParseFunction = (dataBuffer: Buffer) => Promise<PDFParseResult>;

/** Maximum document length to process (in characters) */
const MAX_DOCUMENT_LENGTH = 150000; // ~37k tokens

/** Result of document extraction */
export interface ExtractionResult {
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
  /** Original length before any truncation */
  originalLength?: number;
  /** Whether content was truncated */
  wasTruncated?: boolean;
}

/**
 * Extract text content from a URL
 * 
 * Fetches the page and extracts main text content.
 * Works best with text-heavy pages like UN documents.
 * 
 * @param url - The URL to fetch
 * @returns Extraction result with content or error
 */
export async function extractFromUrl(url: string): Promise<ExtractionResult> {
  try {
    // Validate URL
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { success: false, error: "Invalid URL protocol. Use http or https." };
    }

    // Check for known UN document hosts
    const isKnownUNHost = [
      "undocs.org",
      "documents-dds-ny.un.org",
      "www.un.org",
      "sdgs.un.org",
      "unfccc.int",
      "cbd.int",
    ].some(host => parsed.hostname.includes(host));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClearPolicy/1.0; +https://clearpolicy.org)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { 
        success: false, 
        error: `Failed to fetch URL: ${res.status} ${res.statusText}` 
      };
    }

    const contentType = res.headers.get("content-type") || "";
    
    // Handle PDF URLs
    if (contentType.includes("application/pdf")) {
      return {
        success: false,
        error: "This URL points to a PDF. Please download the PDF and upload it, or copy-paste the text content.",
      };
    }

    const html = await res.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : undefined;

    // Extract main content
    let content = extractTextFromHTML(html);
    
    const originalLength = content.length;
    const wasTruncated = content.length > MAX_DOCUMENT_LENGTH;
    
    if (wasTruncated) {
      content = content.slice(0, MAX_DOCUMENT_LENGTH);
      // Try to end at a sentence boundary
      const lastPeriod = content.lastIndexOf(".");
      if (lastPeriod > MAX_DOCUMENT_LENGTH * 0.8) {
        content = content.slice(0, lastPeriod + 1);
      }
    }

    if (content.length < 100) {
      return {
        success: false,
        error: "Could not extract sufficient text from this URL. The page may require JavaScript or be protected. Try copy-pasting the text directly.",
      };
    }

    return {
      success: true,
      content,
      title,
      originalLength,
      wasTruncated,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, error: "Request timed out. The server took too long to respond." };
    }
    console.error("URL extraction error:", error);
    return { 
      success: false, 
      error: `Failed to fetch URL: ${error.message || "Unknown error"}` 
    };
  }
}

/**
 * Extract text from HTML content
 * Removes scripts, styles, and extracts readable text
 */
function extractTextFromHTML(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find main content areas
  const mainContentPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*document[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of mainContentPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > 500) {
      text = match[1];
      break;
    }
  }

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = decodeHTMLEntities(text);
  
  // Normalize whitespace
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

/**
 * Decode common HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&ndash;": "–",
    "&mdash;": "—",
    "&hellip;": "…",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, "gi"), char);
  }
  
  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  result = result.replace(/&#x([a-f0-9]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return result;
}

/**
 * Extract text from a PDF buffer
 * 
 * Uses pdf-parse library to extract text in reading order.
 * Note: pdf-parse should be installed as a dependency.
 * 
 * @param buffer - PDF file as a Buffer
 * @param filename - Original filename for context
 * @returns Extraction result with content or error
 */
export async function extractFromPDF(buffer: Buffer, filename?: string): Promise<ExtractionResult> {
  try {
    // Import pdf-parse dynamically to avoid the test file loading issue in Next.js
    // The lib/pdf-parse.js file is the actual implementation without test dependencies
    let pdfParse: PDFParseFunction;
    try {
      // Use dynamic import with specific path to avoid test file loading
      const pdfModule = await import("pdf-parse/lib/pdf-parse.js");
      pdfParse = pdfModule.default || pdfModule;
    } catch (importError) {
      console.error("Failed to import pdf-parse:", importError);
      return {
        success: false,
        error: "PDF parsing module failed to load. Please copy-paste the text content instead.",
      };
    }

    // pdf-parse v1.x: simple function call with buffer
    const result = await pdfParse(buffer);

    let content = result?.text || "";
    
    // Normalize whitespace
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    const originalLength = content.length;
    const wasTruncated = content.length > MAX_DOCUMENT_LENGTH;

    if (wasTruncated) {
      content = content.slice(0, MAX_DOCUMENT_LENGTH);
      const lastPeriod = content.lastIndexOf(".");
      if (lastPeriod > MAX_DOCUMENT_LENGTH * 0.8) {
        content = content.slice(0, lastPeriod + 1);
      }
    }

    if (content.length < 100) {
      return {
        success: false,
        error: "Could not extract sufficient text from this PDF. The file may be image-based or protected. Try copy-pasting the text directly.",
      };
    }

    // Try to extract title from first lines
    const lines = content.split("\n").filter((l: string) => l.trim().length > 0);
    const title = lines[0]?.length < 200 ? lines[0].trim() : filename?.replace(/\.pdf$/i, "");

    return {
      success: true,
      content,
      title,
      originalLength,
      wasTruncated,
    };
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    return {
      success: false,
      error: `Failed to parse PDF: ${error.message || "Unknown error"}. Try copy-pasting the text content.`,
    };
  }
}

/**
 * Normalize raw text input
 * 
 * Cleans up pasted text by normalizing whitespace and removing
 * common artifacts from copy-paste.
 * 
 * @param text - Raw text input
 * @returns Extraction result with normalized content
 */
export function extractFromText(text: string): ExtractionResult {
  if (!text || typeof text !== "string") {
    return { success: false, error: "No text provided." };
  }

  let content = text.trim();

  if (content.length < 50) {
    return { 
      success: false, 
      error: "Text is too short. Please provide more content for analysis." 
    };
  }

  // Normalize whitespace
  content = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n +/g, "\n")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  // Remove common copy-paste artifacts
  content = content
    .replace(/^\s*Page \d+ of \d+\s*$/gm, "")
    .replace(/^\s*\d+\s*$/gm, "") // Standalone page numbers
    .replace(/•/g, "-"); // Normalize bullets

  const originalLength = content.length;
  const wasTruncated = content.length > MAX_DOCUMENT_LENGTH;

  if (wasTruncated) {
    content = content.slice(0, MAX_DOCUMENT_LENGTH);
    const lastPeriod = content.lastIndexOf(".");
    if (lastPeriod > MAX_DOCUMENT_LENGTH * 0.8) {
      content = content.slice(0, lastPeriod + 1);
    }
  }

  // Try to extract title from first line
  const firstLine = content.split("\n")[0]?.trim();
  const title = firstLine && firstLine.length < 200 && firstLine.length > 10 
    ? firstLine 
    : undefined;

  return {
    success: true,
    content,
    title,
    originalLength,
    wasTruncated,
  };
}

/**
 * Main extraction function that routes to the appropriate handler
 * 
 * @param method - Input method
 * @param data - URL string, Buffer (for PDF), or text string
 * @param filename - Optional filename for uploads
 * @returns Extraction result
 */
export async function extractDocument(
  method: DocumentInputMethod,
  data: string | Buffer,
  filename?: string
): Promise<ExtractionResult> {
  switch (method) {
    case "url":
      if (typeof data !== "string") {
        return { success: false, error: "URL must be a string." };
      }
      return extractFromUrl(data);

    case "upload":
      if (!(data instanceof Buffer)) {
        return { success: false, error: "Upload data must be a Buffer." };
      }
      return extractFromPDF(data, filename);

    case "text":
      if (typeof data !== "string") {
        return { success: false, error: "Text must be a string." };
      }
      return extractFromText(data);

    default:
      return { success: false, error: `Unknown input method: ${method}` };
  }
}
