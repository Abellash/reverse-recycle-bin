import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Desktop",
  description: "A perfectly ordinary desktop with a perfectly ordinary recycle bin.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
