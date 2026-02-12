export default function FeatureGrid() {
  const features = [
    {
      title: "Instant Policy Summaries",
      desc: "Get TL;DR, key provisions, who it affects, and pros/cons in plain English.",
    },
    {
      title: "Every Claim Cited",
      desc: "Numbered source citations for every factual claim. Unverified claims are flagged.",
    },
    {
      title: "Local Context by ZIP",
      desc: "See how policies affect your area. Find your officials and local implications.",
    },
    {
      title: "Conversational Depth",
      desc: "Ask follow-ups, change perspectives, and build a personalized policy dossier.",
    },
  ];

  return (
    <section aria-labelledby="features-title">
      <p id="features-title" className="section-label mb-4">How ClearPolicy helps</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {features.map((f, i) => (
          <div key={i} className="glass-card rounded-xl p-5 surface-lift">
            <h3 className="text-sm font-semibold text-[var(--cp-text)] mb-1.5">{f.title}</h3>
            <p className="text-sm text-[var(--cp-muted)] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
