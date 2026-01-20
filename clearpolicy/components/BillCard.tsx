"use client";
import { useMemo, useState } from "react";
import CitedLine from "@/components/CitedLine";
import SourceMeter from "@/components/SourceMeter";
import { annotateClaimsWithEvidence, dedupeCitations, splitIntoClaims, type AnnotatedClaim } from "@/lib/evidence";
import type { Citation } from "@/lib/citations";
import type { SummaryLike } from "@/lib/summary-types";
import { Badge, Button, Card, Disclosure, Tooltip } from "@/components/ui";

const EVIDENCE_THRESHOLD = 0.18;

export default function BillCard({
  data,
  level,
  evidenceMode = false,
}: {
  data: SummaryLike;
  level: "5" | "8" | "12";
  evidenceMode?: boolean;
}) {
  const [showCitations, setShowCitations] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Record<number, boolean>>({});
  const citations = useMemo(
    () => dedupeCitations((data.citations || []).filter(Boolean) as Citation[]),
    [data.citations]
  );
  const firstFor = (loc: Citation["location"]) => citations.find((c) => c.location === loc) || citations[0];
  // Data already comes pre-simplified for the selected level, so we don't need to simplify again
  // Only add "In simple words" prefix for 5th grade
  const simple = (t: string) => (level === "5" && t ? `In simple words: ${t}` : t);
  const tldrText = String(data.tldr || "");

  const annotatedClaims: AnnotatedClaim[] = useMemo(() => {
    if (!evidenceMode) return [];
    const claims = splitIntoClaims(tldrText);
    const annotated = annotateClaimsWithEvidence(claims, citations, EVIDENCE_THRESHOLD);
    return annotated;
  }, [citations, evidenceMode, tldrText]);

  const supportedCount = useMemo(
    () => annotatedClaims.filter((c) => c.status === "supported").length,
    [annotatedClaims]
  );

  return (
    <Card variant="document" className="space-y-6" aria-labelledby="billcard-heading" data-testid="measure-summary">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="billcard-heading" className="text-lg font-semibold text-[var(--cp-text)]">
            Summary
          </h2>
          <p className="mt-1 text-xs text-[var(--cp-muted)]">Plain-English highlights with traceable sources.</p>
        </div>
        <SourceMeter ratio={data.sourceRatio || 0} count={data.sourceCount || 0} total={5} />
      </div>

      <div className="grid grid-cols-1 gap-6 text-sm leading-relaxed">
        <section>
          <h3 className="section-title">TL;DR</h3>
          {!evidenceMode && (
            <>
              <p className="mt-1 text-[var(--cp-text)]">
                {simple(data.tldr || "No TL;DR available; see sources below.")}
              </p>
              {firstFor("tldr") && (
                <div className="mt-1 text-xs text-[var(--cp-muted)]">
                  Source:{" "}
                  {firstFor("tldr")!.url ? (
                    <a
                      href={firstFor("tldr")!.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-link focus-ring rounded"
                    >
                      {firstFor("tldr")!.sourceName}
                    </a>
                  ) : (
                    <span className="text-[var(--cp-text)]">{firstFor("tldr")!.sourceName}</span>
                  )}
                </div>
              )}
            </>
          )}
          {evidenceMode && (
            <div className="mt-3 space-y-3">
              {(() => {
                const hasTldr = tldrText.trim().length > 0;
                return (
                  <>
                    <p className="text-sm text-[var(--cp-muted)]" data-testid="evidence-metric">
                      Supported {supportedCount}/{annotatedClaims.length} claims
                    </p>
                    {!hasTldr && <p className="text-[var(--cp-muted)]">No TL;DR available; see sources below.</p>}
                    {annotatedClaims.length > 0 && supportedCount === 0 && (
                      <p className="text-xs text-[var(--cp-muted)]">
                        No matching evidence found in the available source excerpts.
                      </p>
                    )}
                    {annotatedClaims.length > 0 && supportedCount / annotatedClaims.length < 0.5 && supportedCount > 0 && (
                      <p className="text-xs text-[var(--cp-muted)]">
                        Some claims may be unverified because the available excerpts are limited. Open sources below for full text.
                      </p>
                    )}
                    {hasTldr && (
                      <ul className="space-y-3" aria-label="TLDR claims with evidence" data-testid="evidence-claims">
                        {annotatedClaims.map((item, idx) => {
                          const expanded = !!expandedClaims[idx];
                          const quote = (item.bestCitation?.quote || "").trim();
                          const displayQuote = quote.length > 300 ? `${quote.slice(0, 300)}…` : quote;
                      const badge = item.status === "supported" ? (
                        <Badge variant="supported" data-testid="evidence-badge">Supported</Badge>
                      ) : (
                        <Tooltip label="We couldn’t match this claim to the available source excerpts.">
                          <Badge variant="unverified" data-testid="evidence-badge">Unverified</Badge>
                        </Tooltip>
                      );
                          return (
                            <li
                              key={idx}
                              className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4"
                              data-testid="evidence-claim"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-[var(--cp-text)]">{item.claim}</div>
                                {badge}
                              </div>
                              <Disclosure
                                open={expanded}
                                onToggle={() =>
                                  setExpandedClaims((prev) => ({
                                    ...prev,
                                    [idx]: !expanded,
                                  }))
                                }
                                label={expanded ? (item.status === "supported" ? "Hide evidence" : "Hide details") : (item.status === "supported" ? "Show evidence" : "Why unverified?")}
                                buttonProps={{ "data-testid": "show-evidence" }}
                              >
                                {item.status === "supported" && item.bestCitation ? (
                                  <>
                                    <p className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-quote)] p-3 font-mono text-xs text-[var(--cp-text)]" data-testid="evidence-quote">
                                      “{displayQuote || "No supporting quote found."}”
                                    </p>
                                    <p className="mt-2 text-xs text-[var(--cp-muted)]">
                                      Source:{" "}
                                      {item.bestCitation.url ? (
                                        <a
                                          href={item.bestCitation.url}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          className="inline-link focus-ring rounded"
                                        >
                                          {item.bestCitation.sourceName || item.bestCitation.url}
                                        </a>
                                      ) : (
                                        <span className="text-[var(--cp-text)]">
                                          {item.bestCitation.sourceName || "Source"}
                                        </span>
                                      )}
                                    </p>
                                  </>
                                ) : (
                                  <div className="space-y-1 text-[var(--cp-muted)]">
                                    <p>No supporting quote found in available sources.</p>
                                    <p className="text-xs">
                                      We couldn&apos;t match this claim to the available source excerpts.
                                    </p>
                                    <p className="text-xs">Try opening the official source links or switch reading level.</p>
                                  </div>
                                )}
                              </Disclosure>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">What it does</h3>
          <p className="mt-1 text-[var(--cp-text)]">
            {simple(data.whatItDoes || "No section summary available; see official source.")}{" "}
            {level === "5" && data.example ? `For example: ${data.example}` : ""}
          </p>
          {firstFor("what") && (
            <div className="mt-1 text-xs text-[var(--cp-muted)]">
              Source:{" "}
              {firstFor("what")!.url ? (
                <a
                  href={firstFor("what")!.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-link focus-ring rounded"
                >
                  {firstFor("what")!.sourceName}
                </a>
              ) : (
                <span className="text-[var(--cp-text)]">{firstFor("what")!.sourceName}</span>
              )}
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Who is affected</h3>
          <p className="mt-1 text-[var(--cp-text)]">
            {simple(data.whoAffected || "No audience summary available; see official source.")}
          </p>
          {firstFor("who") && (
            <div className="mt-1 text-xs text-[var(--cp-muted)]">
              Source:{" "}
              {firstFor("who")!.url ? (
                <a
                  href={firstFor("who")!.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-link focus-ring rounded"
                >
                  {firstFor("who")!.sourceName}
                </a>
              ) : (
                <span className="text-[var(--cp-text)]">{firstFor("who")!.sourceName}</span>
              )}
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Pros</h3>
          <p className="mt-1 text-[var(--cp-text)]">
            {simple(data.pros || "No stated benefits available from sources.")}
          </p>
          {firstFor("pros") && (
            <div className="mt-1 text-xs text-[var(--cp-muted)]">
              Source:{" "}
              {firstFor("pros")!.url ? (
                <a
                  href={firstFor("pros")!.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-link focus-ring rounded"
                >
                  {firstFor("pros")!.sourceName}
                </a>
              ) : (
                <span className="text-[var(--cp-text)]">{firstFor("pros")!.sourceName}</span>
              )}
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Cons</h3>
          <p className="mt-1 text-[var(--cp-text)]">
            {simple(data.cons || "No stated drawbacks available from sources.")}
          </p>
          {firstFor("cons") && (
            <div className="mt-1 text-xs text-[var(--cp-muted)]">
              Source:{" "}
              {firstFor("cons")!.url ? (
                <a
                  href={firstFor("cons")!.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-link focus-ring rounded"
                >
                  {firstFor("cons")!.sourceName}
                </a>
              ) : (
                <span className="text-[var(--cp-text)]">{firstFor("cons")!.sourceName}</span>
              )}
            </div>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h3 className="section-title">Sources</h3>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={showCitations}
              title="Show quoted lines from sources where available"
              onClick={() => setShowCitations((v) => !v)}
            >
              {showCitations ? "Hide cited lines" : "Show cited lines"}
            </Button>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-[var(--cp-text)]">
            {[...new Map(citations.map((c, idx) => [c.url || `missing-${idx}`, c])).values()].map((c, i) => {
              let host = "";
              try {
                host = c.url ? new URL(c.url).hostname : "";
              } catch {}
              const officialHosts = [
                "openstates.org",
                "congress.gov",
                "leginfo.legislature.ca.gov",
                "senate.ca.gov",
                "assembly.ca.gov",
                "ca.gov",
              ];
              const isOfficial = host ? officialHosts.some((h) => host.endsWith(h)) : false;
              const badge = c.url ? (isOfficial ? "Official" : host.endsWith("openstates.org") ? "Primary" : "Analysis") : "Source";
              const variant = isOfficial ? "official" : badge === "Primary" ? "primary" : badge === "Source" ? "neutral" : "analysis";
              return (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel={isOfficial ? "noreferrer noopener" : "nofollow noreferrer noopener"}
                      className="inline-link focus-ring rounded"
                      title={host ? host : undefined}
                    >
                      {c.sourceName}
                      {!isOfficial && host ? ` (${host})` : ""}
                    </a>
                  ) : (
                    <span className="text-[var(--cp-text)]">{c.sourceName}</span>
                  )}
                  <Badge variant={variant as any}>{badge}</Badge>
                  {c.location ? <span className="text-xs text-[var(--cp-muted)]">— {c.location}</span> : null}
                </li>
              );
            })}
          </ul>
          {showCitations && (
            <div className="mt-2 space-y-3">
              {citations.length === 0 && (
                <p className="text-sm text-[var(--cp-muted)]">No quoted lines available for this measure.</p>
              )}
              {citations.map((c, i) => (
                <CitedLine key={i} quote={(c.quote || "").trim() || "No direct quote available for this section."} url={c.url} sourceName={c.sourceName} location={c.location} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}


