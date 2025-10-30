export default function FeatureGrid() {
  const features = [
    {
      title: "Instant Law Summaries",
      desc: "See TL;DR, what it does, who it affects, pros and cons.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4h9l3 3v13H6V4z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 12h6M9 8h6M9 16h6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      title: "Neutral, Trusted Sources",
      desc: "Citations and meter show coverage across sections.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l8 4v6c0 4.418-3.582 8-8 8s-8-3.582-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 12l2 2 5-5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      title: "Local Lens by ZIP",
      desc: "Find your officials and see where to learn more.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      title: "Accessible to All",
      desc: "Reading level toggle and keyboard-friendly navigation.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 21l4-7h8l4 7" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="glass-card p-6" aria-labelledby="features-title">
      <h2 id="features-title" className="text-lg font-semibold text-gray-100 dark:text-gray-900">How ClearPolicy empowers you</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div key={i} className="glass-panel p-4 lift group">
            <div className="flex items-center gap-2 text-accent">
              <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
                <span className="text-accent">{f.icon}</span>
              </div>
              <div className="font-medium text-gray-100 dark:text-gray-900">{f.title}</div>
            </div>
            <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


