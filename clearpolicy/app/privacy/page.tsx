import { Card } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <h1 className="page-title">Privacy</h1>
        <p className="page-subtitle">We do not sell personal data. Preferences like theme may be stored in your browser.</p>
      </Card>
      <Card>
        <h2 className="section-heading">Data practices</h2>
        <ul className="mt-2 list-disc list-inside text-sm text-[var(--cp-muted)]">
          <li>No sale of personal data.</li>
          <li>Local storage for theme and basic UI preferences.</li>
          <li>Third‑party civic data sources credited and linked.</li>
        </ul>
      </Card>
      <Card>
        <h2 className="section-heading">Contact</h2>
        <p className="mt-2 text-sm text-[var(--cp-muted)]">Questions? Email <a className="inline-link" href="mailto:pranil.raichura@gmail.com">pranil.raichura@gmail.com</a> for any inquiries.</p>
      </Card>
    </div>
  );
}


