import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Header />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 min-w-0 flex flex-col w-full">
            <main className="p-2 md:p-2 md:pl-2 bg-sidebar min-h-screen w-full">
              <div className="rounded-xl overflow-hidden shadow-md border min-h-screen bg-background w-full">
                <div className="p-4 md:p-8 w-full">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </QueryProvider>
  );
}
