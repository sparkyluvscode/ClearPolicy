export function simplify(text: string, level: "5" | "8" | "12") {
  if (!text) return text;
  if (level === "12") return ensurePeriod(text);
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
    const joined = sentences.join(" ");
    const analogy = pickAnalogy(joined);
    out = analogy ? `${joined} ${analogy}` : joined;
    return ensurePeriod(out);
  }
  out = sentences.join(" ");
  return ensurePeriod(out);
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


