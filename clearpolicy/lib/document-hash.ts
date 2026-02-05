/**
 * Document Fingerprinting Utility
 * 
 * Generates deterministic hashes for UN/international documents
 * to enable caching and avoid re-processing identical content.
 * 
 * Uses SHA-256 over normalized text to ensure:
 * - Identical content always produces the same hash
 * - Minor formatting differences don't affect the hash
 * - Different content produces different hashes
 * 
 * @module document-hash
 */

import crypto from "crypto";

/**
 * Normalize text for hashing
 * 
 * Applies consistent transformations to ensure the same content
 * produces the same hash regardless of formatting differences:
 * - Lowercase
 * - Trim whitespace
 * - Normalize whitespace (multiple spaces/newlines → single space)
 * - Remove common copy-paste artifacts
 * 
 * @param text - Raw text content
 * @returns Normalized text ready for hashing
 */
export function normalizeTextForHash(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    // Convert to lowercase
    .toLowerCase()
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Normalize whitespace
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n +/g, "\n")
    .replace(/ +\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    // Remove common artifacts
    .replace(/page \d+ of \d+/gi, "")
    .replace(/^\d+$/gm, "") // Standalone numbers (page numbers)
    // Final trim
    .trim();
}

/**
 * Compute a deterministic SHA-256 hash for a document
 * 
 * The hash is computed over normalized text content, ensuring:
 * - PDFs, URLs, and pasted text with identical content → same hash
 * - Formatting differences don't affect the hash
 * - Strong cryptographic hash for collision resistance
 * 
 * @param text - Document text content (already extracted from PDF/URL if needed)
 * @returns 64-character hex string (SHA-256 hash)
 */
export function computeDocumentHash(text: string): string {
  const normalized = normalizeTextForHash(text);
  
  if (!normalized) {
    throw new Error("Cannot compute hash of empty content");
  }

  return crypto
    .createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex");
}

/**
 * Compute hash with metadata for logging/debugging
 * 
 * @param text - Document text content
 * @returns Object with hash and metadata
 */
export function computeDocumentHashWithMeta(text: string): {
  hash: string;
  originalLength: number;
  normalizedLength: number;
  preview: string;
} {
  const normalized = normalizeTextForHash(text);
  const hash = crypto
    .createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex");

  return {
    hash,
    originalLength: text.length,
    normalizedLength: normalized.length,
    preview: normalized.slice(0, 100) + (normalized.length > 100 ? "..." : ""),
  };
}

/**
 * Generate a short hash for display purposes
 * 
 * @param text - Document text content
 * @returns 12-character short hash (first 12 chars of SHA-256)
 */
export function computeShortHash(text: string): string {
  return computeDocumentHash(text).slice(0, 12);
}

/**
 * Validate a hash string format
 * 
 * @param hash - Hash string to validate
 * @returns True if valid SHA-256 hex string
 */
export function isValidDocumentHash(hash: string): boolean {
  return typeof hash === "string" && /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Validate a short hash format
 * 
 * @param shortHash - Short hash to validate
 * @returns True if valid short hash format
 */
export function isValidShortHash(shortHash: string): boolean {
  return typeof shortHash === "string" && /^[a-f0-9]{12}$/i.test(shortHash);
}
