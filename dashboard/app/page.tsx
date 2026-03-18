import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <main className="w-full max-w-lg space-y-6 px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Friday Dashboard
        </h1>
        <p className="text-zinc-400">
          Manage your integrations and settings.
        </p>

        <div className="space-y-3">
          <Link
            href="/google-auth"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
          >
            <div>
              <p className="text-sm font-medium text-zinc-50">Google Account</p>
              <p className="text-xs text-zinc-500">Connect Google Tasks</p>
            </div>
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
