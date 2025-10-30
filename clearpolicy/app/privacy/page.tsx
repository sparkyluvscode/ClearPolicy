export default function PrivacyPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">Privacy</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">We do not sell personal data. Preferences like theme may be stored in your browser.</p>
      </header>
      <section className="card p-6">
        <h2 className="section-title">Data practices</h2>
        <ul className="mt-2 list-disc list-inside text-sm text-gray-300 dark:text-gray-700">
          <li>No sale of personal data.</li>
          <li>Local storage for theme and basic UI preferences.</li>
          <li>Third‑party civic data sources credited and linked.</li>
        </ul>
      </section>
      <section className="card p-6">
        <h2 className="section-title">Contact</h2>
        <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">Questions? Email <a className="text-accent hover:underline" href="mailto:pranil.raichura@gmail.com">pranil.raichura@gmail.com</a> for any inquiries.</p>
      </section>
    </div>
  );
}


