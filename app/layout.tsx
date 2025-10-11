import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConnectIQ",
  description: "ConnectIQ is a platform for connecting users and businesses, powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
