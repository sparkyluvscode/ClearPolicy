"use client";
import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

export default function FeedbackBar({ page, measureSlug }: { page: string; measureSlug?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, measureSlug, message, contact }) });
    if (res.ok) setSent(true);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="feedback-panel">
          Give feedback
        </Button>
      ) : (
        <Card id="feedback-panel" className="w-80">
          {sent ? (
            <div className="text-sm text-[var(--cp-text)]">Thanks! Your feedback helps improve ClearPolicy.</div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <div className="text-sm font-medium text-[var(--cp-text)]">How can we improve?</div>
              <textarea className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] p-2 text-sm text-[var(--cp-text)] focus-ring" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
              <Input placeholder="Your email (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Close</Button>
                <Button type="submit" size="sm">Send</Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}


