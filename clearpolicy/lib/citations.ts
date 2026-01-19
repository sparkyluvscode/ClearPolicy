export type Citation = { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons"; badge?: string };
export function sourceRatioFrom(blocks: string[], citations: Citation[]) {
  const total = blocks.filter(Boolean).length;
  if (!total) return 0;
  // Prefer coverage by section location when available
  const locations = new Set((citations || []).map((c) => c.location).filter(Boolean) as string[]);
  if (locations.size > 0) {
    return Math.min(1, locations.size / total);
  }
  // Fallback: unique links across all sections
  const unique = new Set(citations.map((c) => c.url).filter(Boolean)).size;
  return Math.min(1, unique / total);
}


