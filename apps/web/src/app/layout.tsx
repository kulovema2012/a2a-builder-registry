import type { Metadata } from "next";
import { Sidebar } from "@/components/shared/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "A2A Builder & Registry",
  description: "Create, validate, register, and discover A2A-compatible agent services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <div className="p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
