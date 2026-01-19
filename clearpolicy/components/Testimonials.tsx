import { Card } from "@/components/ui";

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title">
      <Card className="space-y-4">
        <h2 id="testimonials-title" className="section-heading">What people say</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <blockquote className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white font-semibold">AR</span>
              <div>
                <div className="text-sm font-medium text-[var(--cp-text)]">Abdiel Rivera, PhD</div>
                <div className="text-xs text-[var(--cp-muted)]">Storrs, CT</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--cp-text)]">&ldquo;The TLDR summaries and plain-English breakdown transform dense policy language into clear, actionable information I can trust.&rdquo;</p>
          </blockquote>
          <blockquote className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">MI</span>
              <div>
                <div className="text-sm font-medium text-[var(--cp-text)]">Marc Imrie — Teacher</div>
                <div className="text-xs text-[var(--cp-muted)]">Granite Bay, California</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--cp-text)]">&ldquo;Finally, a tool that connects local ZIP codes to actual representatives and measures—I can see exactly how policy affects my community.&rdquo;</p>
          </blockquote>
          <blockquote className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white font-semibold">DM</span>
              <div>
                <div className="text-sm font-medium text-[var(--cp-text)]">Daksh Mamnani — 2024 CAC Winner</div>
                <div className="text-xs text-[var(--cp-muted)]">Rancho Cordova, CA</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--cp-text)]">&ldquo;The sources are right there and verified. No agenda, no spin—just the actual facts from official documents. That&apos;s what I need to make informed decisions.&rdquo;</p>
          </blockquote>
        </div>
      </Card>
    </section>
  );
}


