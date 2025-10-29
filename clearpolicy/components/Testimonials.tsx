export default function Testimonials() {
  return (
    <section className="glass-card p-6" aria-labelledby="testimonials-title">
      <h2 id="testimonials-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">What people say</h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/70 to-cyan-400/50 flex items-center justify-center text-white font-semibold">SR</span>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Student voter</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">San Jose, CA</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-900 dark:text-gray-100">“ClearPolicy made my ballot research take minutes instead of hours.”</p>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-400/60 flex items-center justify-center text-white font-semibold">TM</span>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Teacher</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Fremont, CA</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-900 dark:text-gray-100">“The reading-level switch helps me teach the same measure to different grades.”</p>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/80 to-emerald-400/60 flex items-center justify-center text-white font-semibold">KP</span>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Parent</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Los Angeles, CA</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-gray-900 dark:text-gray-100">“Sources right next to the summary makes it easy to verify.”</p>
        </blockquote>
      </div>
    </section>
  );
}


