import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <main className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">FitDenik</h1>
        <p className="mt-3 text-zinc-600">
          Interaktivní tréninkový, výživový a progress deník s live trackingem.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-white">
          Otevřít aplikaci
        </Link>
      </main>
    </div>
  );
}
