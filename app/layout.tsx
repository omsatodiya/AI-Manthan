import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConnectIQ",
  description: "ConnectIQ is a platform for connecting business with AI.",
  icons: {
    icon: "/images/logo.svg",
  },
};

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${sans.variable} ${serif.variable} ${mono.variable}`}
      >
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-20">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
