export default function Testimonials() {
  return (
    <section className="glass-card p-6" aria-labelledby="testimonials-title">
      <h2 id="testimonials-title" className="text-lg font-semibold text-gray-100 dark:text-gray-900">What people say</h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/70 to-cyan-400/50 flex items-center justify-center text-white font-semibold">AR</span>
            <div>
              <div className="text-sm font-medium text-gray-100 dark:text-gray-900">Abdiel Rivera, PhD</div>
              <div className="text-xs text-gray-400 dark:text-gray-600">Storrs, CT</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-100 dark:text-gray-900">"The TLDR summaries and plain-English breakdown transform dense policy language into clear, actionable information I can trust."</p>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-400/60 flex items-center justify-center text-white font-semibold">MI</span>
            <div>
              <div className="text-sm font-medium text-gray-100 dark:text-gray-900">Marc Imrie — Teacher</div>
              <div className="text-xs text-gray-400 dark:text-gray-600">Granite Bay, CA</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-100 dark:text-gray-900">"Finally, a tool that connects local ZIP codes to actual representatives and measures—I can see exactly how policy affects my community."</p>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/80 to-emerald-400/60 flex items-center justify-center text-white font-semibold">DM</span>
            <div>
              <div className="text-sm font-medium text-gray-100 dark:text-gray-900">Daksh Mamnani — 2024 CAC Winner</div>
              <div className="text-xs text-gray-400 dark:text-gray-600">Rancho Cordova, CA</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-100 dark:text-gray-900">"The sources are right there and verified. Only real facts from the official documents. That's what I like to see."</p>
        </blockquote>
      </div>
    </section>
  );
}


