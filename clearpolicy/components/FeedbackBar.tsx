"use client";
import { useState } from "react";

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
        <button className="liquid-button rounded-full px-4 py-2 text-sm font-medium" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="feedback-panel">
          Give feedback
        </button>
      ) : (
        <div id="feedback-panel" className="w-80 glass-popover p-4">
          {sent ? (
            <div className="text-sm text-gray-800">Thanks! Your feedback helps improve ClearPolicy.</div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <div className="text-sm font-medium text-gray-900">How can we improve?</div>
              <textarea className="glass-input w-full p-2 text-sm" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
              <input className="glass-input w-full p-2 text-sm" placeholder="Your email (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button type="button" className="glass-input px-3 py-1.5 text-sm" onClick={() => setOpen(false)}>Close</button>
                <button type="submit" className="liquid-button px-3 py-1.5 text-sm">Send</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}


