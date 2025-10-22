import type { Metadata } from "next";
import { Outfit, Lora } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image";
import Link from "next/link";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TourOps Authentication",
  description: "Sign in to your tour operator account",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${lora.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <header className="flex justify-center p-6">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/newlight.png"
                  alt="Tour Operator Logo"
                  width={40}
                  height={40}
                  className="dark:invert"
                />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">TourOps</span>
              </Link>
            </header>

            <main className="flex-grow flex items-center justify-center p-4">
              {children}
            </main>

            <footer className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} TourOps. All rights reserved. |{" "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>{" "}
              |{" "}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}