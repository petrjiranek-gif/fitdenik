import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ew-bg p-6">
      <main className="w-full max-w-xl rounded-2xl border border-ew-border bg-ew-panel p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-white">FitDenik</h1>
        <p className="mt-3 text-zinc-400">
          Interaktivní tréninkový, výživový a progress deník s live trackingem.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-ew-blue px-4 py-2 text-white hover:bg-ew-blue-dark"
        >
          Otevřít aplikaci
        </Link>
      </main>
    </div>
  );
}
