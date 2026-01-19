import { Card } from "@/components/ui";

export default function ContactPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <h1 className="page-title">Contact</h1>
        <p className="page-subtitle">We&apos;d love to hear your feedback.</p>
      </Card>
      <Card>
        <p className="text-sm text-[var(--cp-muted)]">Email <a className="inline-link" href="mailto:pranil.raichura@gmail.com">pranil.raichura@gmail.com</a> for any inquiries.</p>
        <p className="mt-3 text-sm text-[var(--cp-muted)]">LinkedIn: <a className="inline-link" href="https://linkedin.com/in/pranilraichura" target="_blank" rel="noreferrer noopener">linkedin.com/in/pranilraichura</a></p>
      </Card>
    </div>
  );
}


