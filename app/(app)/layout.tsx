import { Header, Sidebar } from "@/components/fitdenik/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
