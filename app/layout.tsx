import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Finder",
  description: "Pronađi lokalne biznise kojima potencijalno treba website.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
