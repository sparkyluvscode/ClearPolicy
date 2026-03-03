import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg",
]);
const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
};

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm", ".log", ".rtf"]);

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function isImageFile(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Use OpenAI vision to extract and analyze content from an image.
 * Works for screenshots, photos of documents, tables, charts, infographics, etc.
 */
async function extractWithVision(buffer: Buffer, filename: string, ext: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI service unavailable. Please try again later.");

  const client = new OpenAI({ apiKey });
  const mime = IMAGE_MIME[ext] || "image/png";
  const base64 = buffer.toString("base64");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a document analysis assistant. Extract ALL text, data, numbers, and information visible in this image. If it contains a table, reproduce it in a readable text format. If it contains a chart or graph, describe the data it represents with specific numbers. If it's a photo of a document, transcribe it fully. Be thorough and precise — do not skip any visible text or data.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all text and data from this image (${filename}). Include every detail: headings, body text, tables, numbers, labels, captions, and footnotes.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${base64}`, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text || text.length < 10) {
    throw new Error("Could not extract meaningful content from this image.");
  }
  return text;
}

/**
 * Use OpenAI vision to extract text from a scanned/image-based PDF.
 * Converts the first page to an image and sends it to vision.
 * For multi-page PDFs, the text-based extraction should be tried first.
 */
async function extractPdfWithVision(buffer: Buffer, filename: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI service unavailable.");

  const client = new OpenAI({ apiKey });
  const base64 = buffer.toString("base64");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a document analysis assistant. The user has uploaded a PDF that may contain scanned images, tables, charts, or text. Extract ALL readable content. For tables, reproduce them in text format. For charts, describe the data with specific numbers. Be thorough.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all text and data from this PDF document (${filename}). Include headings, body text, tables, numbers, and any other visible content.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:application/pdf;base64,${base64}`, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text || text.length < 10) {
    throw new Error("Could not extract meaningful content from this PDF.");
  }
  return text;
}

function extractPdfText(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const texts: string[] = [];

  const textObjectRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = textObjectRegex.exec(content)) !== null) {
    const block = match[1];
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      texts.push(decodeEscapes(tjMatch[1]));
    }
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

  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let streamMatch;
  while ((streamMatch = streamRegex.exec(content)) !== null) {
    const streamContent = streamMatch[1];
    const printable = streamContent.replace(/[^\x20-\x7E\n\r]/g, "");
    if (printable.length > 50 && printable.length / streamContent.length > 0.5) {
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

async function extractDocxText(buffer: Buffer): Promise<string> {
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) return "";
  const content = buffer.toString("utf-8", 0, buffer.length);
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const texts: string[] = [];
  let match;
  while ((match = textRegex.exec(content)) !== null) {
    texts.push(match[1]);
  }
  return texts.join(" ").replace(/\s+/g, " ").trim();
}

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

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (isImageFile(ext)) {
      // Images: use OpenAI vision to extract text and analyze content
      text = await extractWithVision(buffer, file.name, ext);
    } else if (ext === ".pdf") {
      // PDF: try text extraction first, fall back to vision for scanned docs
      text = extractPdfText(buffer);
      if (text.length < 100) {
        try {
          text = await extractPdfWithVision(buffer, file.name);
        } catch (visionErr) {
          if (text.length === 0) {
            return NextResponse.json(
              { success: false, error: "Could not extract text from this PDF. It may be image-based or encrypted. Try a screenshot of the relevant pages instead." },
              { status: 400 }
            );
          }
        }
      }
    } else if (ext === ".docx") {
      text = await extractDocxText(buffer);
    } else if (TEXT_EXTENSIONS.has(ext)) {
      text = buffer.toString("utf-8");
    } else {
      // Unknown format: try as text, then fall back to vision
      text = buffer.toString("utf-8");
      const nonPrintable = text.slice(0, 500).split("").filter(c => {
        const code = c.charCodeAt(0);
        return code < 32 && code !== 10 && code !== 13 && code !== 9;
      }).length;
      if (nonPrintable > 50) {
        return NextResponse.json(
          { success: false, error: `Unsupported format (${ext || "unknown"}). Supported: images (PNG, JPG, etc.), PDF, DOCX, TXT, CSV, and MD files.` },
          { status: 400 }
        );
      }
    }

    text = text.trim();
    if (text.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not extract content from this file. Try a different format or paste the text directly." },
        { status: 400 }
      );
    }

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
    const message = error instanceof Error ? error.message : "Failed to process file.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
