export default function SearchLoading() {
  return (
    <div className="fixed inset-0 bg-[var(--cp-bg)] flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--cp-muted)]">Loading...</p>
      </div>
    </div>
  );
}
