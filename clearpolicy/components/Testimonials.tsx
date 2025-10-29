export default function Testimonials() {
  return (
    <section className="glass-card p-6" aria-labelledby="testimonials-title">
      <h2 id="testimonials-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">What people say</h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <blockquote className="glass-panel p-4 lift">
          <p className="text-sm text-gray-800 dark:text-gray-200">“ClearPolicy made my ballot research take minutes instead of hours.”</p>
          <footer className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent">SR</span>
            <span>Student voter</span>
          </footer>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <p className="text-sm text-gray-800 dark:text-gray-200">“The reading-level switch helps me teach the same measure to different grades.”</p>
          <footer className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent">TM</span>
            <span>Teacher</span>
          </footer>
        </blockquote>
        <blockquote className="glass-panel p-4 lift">
          <p className="text-sm text-gray-800 dark:text-gray-200">“Sources right next to the summary makes it easy to verify.”</p>
          <footer className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent">KP</span>
            <span>Parent</span>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}


