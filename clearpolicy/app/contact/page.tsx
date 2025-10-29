export default function ContactPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Contact</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">We'd love to hear your feedback.</p>
      </header>
      <section className="card p-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">Email <a className="text-accent hover:underline" href="mailto:pranil.raichura@gmail.com">pranil.raichura@gmail.com</a> or use the feedback button in the app.</p>
      </section>
    </div>
  );
}


