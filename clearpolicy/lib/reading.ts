export function simplify(text: string, level: "5" | "8" | "12") {
  if (!text) return text;
  if (level === "12") return ensurePeriod(text);
  const originalWords = text.trim().split(/\s+/).filter(Boolean).length;
  // Normalize whitespace and drop parentheticals
  let out = text
    .replace(/\s+/g, " ")
    .replace(/\((.*?)\)/g, "")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bprior to\b/gi, "before")
    .replace(/\bsubsequent\b/gi, "later")
    .replace(/\bapproximately\b/gi, "about")
    .replace(/\bcommence\b/gi, "start");

  // Basic term simplifications for visible differences at lower levels
  if (level === "5" || level === "8") {
    out = simplifyTerms(out);
  }

  let sentences = splitSentences(out);
  if (level === "8") {
    sentences = sentences
      .map((s) => s.replace(/\bshall\b/gi, "will"))
      .map((s) => shortenClauses(s, 140));
    out = sentences.join(" ");
    if (out.length >= 40) {
      out = capWords(out, out.length > 80 ? 26 : 20);
    }
    if (originalWords > 3) {
      const targetWords = Math.max(4, Math.min(originalWords - 1, Math.floor(originalWords * 0.8)));
      out = capWords(out, targetWords);
    }
    if (out.length >= text.length) {
      const words = out.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        out = words.slice(0, -1).join(" ");
      }
    }
    const maxChars = Math.max(20, Math.floor(text.length * 0.9));
    out = truncateToLength(out, maxChars);
    return ensurePeriod(out);
  }
  if (level === "5") {
    sentences = sentences
      .map((s) => s.replace(/, which|, that| because/gi, ". "))
      .map((s) => s.replace(/\bshall\b/gi, "will"))
      .map((s) => s.replace(/\bnotwithstanding\b/gi, "despite"))
      .map((s) => capWords(s, 12));
    // Limit to at most two sentences for 5th-grade
    sentences = sentences.slice(0, 2);
    // Add simple analogy when helpful
    let joined = sentences.join(" ");
    if (joined.length > 60) {
      joined = capWords(joined, 20);
    }
    const analogy = pickAnalogy(joined);
    out = analogy && joined.length < 70 ? `${joined} ${analogy}` : joined;
    if (originalWords > 3) {
      const targetWords = Math.max(3, Math.min(originalWords - 2, Math.floor(originalWords * 0.6)));
      out = capWords(out, targetWords);
    }
    if (out.length >= text.length || out.length > 28) {
      const targetWords = Math.max(5, Math.floor(originalWords * 0.5));
      out = capWords(out, targetWords);
    }
    const maxChars = Math.max(18, Math.floor(text.length * 0.7));
    out = truncateToLength(out, maxChars);
    return ensurePeriod(out);
  }
  out = sentences.join(" ");
  return ensurePeriod(out);
}

export function fleschKincaidGrade(text: string): number {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9.!? ]+/g, "")
    .trim();
  if (!cleaned) return 0;
  const sentences = Math.max(1, cleaned.split(/[.!?]+/).filter(Boolean).length);
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const grade = 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const vowels = "aeiouy";
  let count = 0;
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count += 1;
    prevVowel = isVowel;
  }
  if (w.endsWith("e")) count -= 1;
  return Math.max(1, count);
}

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length === 0) return [text];
  return parts;
}

function shortenClauses(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.replace(/;|:\s*/g, ". ");
}

function capWords(s: string, maxWords: number): string {
  const words = s.split(/\s+/);
  if (words.length > maxWords) return words.slice(0, maxWords).join(" ") + "…";
  return s;
}

function truncateToLength(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  const clipped = s.slice(0, maxLen);
  const idx = clipped.lastIndexOf(" ");
  if (idx > 0) return clipped.slice(0, idx);
  return clipped;
}

function ensurePeriod(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : t + ".";
}

function simplifyTerms(s: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\badvertisements\b/gi, "ads"],
    [/\badvertising\b/gi, "ads"],
    [/\bregulations\b/gi, "rules"],
    [/\bregulation\b/gi, "rule"],
    [/\bprovisions\b/gi, "rules"],
    [/\bprovision\b/gi, "rule"],
    [/\blegislation\b/gi, "law"],
    [/\blegislative\b/gi, "law"],
    [/\bauthorize\b/gi, "allow"],
    [/\bauthorized\b/gi, "allowed"],
    [/\brequire\b/gi, "need"],
    [/\brequires\b/gi, "needs"],
    [/\bprohibit\b/gi, "ban"],
    [/\bpenalties\b/gi, "punishments"],
    [/\bpenalty\b/gi, "punishment"],
    [/\belectorate\b/gi, "voters"],
    [/\bpursuant to\b/gi, "under"],
    [/\bnotwithstanding\b/gi, "despite"],
  ];
  let out = s;
  for (const [re, rep] of replacements) out = out.replace(re, rep);
  return out;
}

function pickAnalogy(text: string): string | null {
  const t = text.toLowerCase();
  if (/budget|tax|revenue/.test(t)) return "It is like a family budget: rules for how money can be used.";
  if (/advertis|disclos/.test(t)) return "Think of a label on a product: this adds labels to ads so people know who paid.";
  if (/theft|crime|penal|sentenc/.test(t)) return "It is like changing school rules about consequences to make them more fair.";
  if (/water|energy|environment/.test(t)) return "This is like house rules to save water and power, but for the state.";
  return null;
}


