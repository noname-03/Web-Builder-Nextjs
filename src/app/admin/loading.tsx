export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
      <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
    </div>
  );
}
