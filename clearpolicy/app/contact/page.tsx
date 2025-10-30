export default function ContactPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">Contact</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">We'd love to hear your feedback.</p>
      </header>
      <section className="card p-6">
        <p className="text-sm text-gray-300 dark:text-gray-700">Email <a className="text-accent hover:underline" href="mailto:pranil.raichura@gmail.com">pranil.raichura@gmail.com</a> for any inquiries.</p>
        <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">LinkedIn: <a className="text-accent hover:underline" href="https://linkedin.com/in/pranilraichura" target="_blank" rel="noreferrer noopener">linkedin.com/in/pranilraichura</a></p>
      </section>
    </div>
  );
}


