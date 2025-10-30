export default function HeroGraphic() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none flex items-center justify-center py-4">
      <div className="flex items-center gap-2">
        {/* Clear button with glossy effect */}
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/95 dark:from-gray-700/90 dark:to-gray-900/95"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/0 via-white/10 to-white/30 opacity-60"></div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/5 to-white/20"></div>
          <span className="relative px-6 py-3 text-2xl font-semibold text-white tracking-tight">Clear</span>
        </div>
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Policy</span>
      </div>
    </div>
  );
}
