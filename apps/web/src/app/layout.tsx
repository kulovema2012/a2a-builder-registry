import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { Shell } from "@/components/shared/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pier — A2A Registry & Builder",
  description: "Create, validate, register, and discover A2A-compatible agent services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
