import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edge Demo - Real-time Monitoring",
  description: "Edge computing demo for real-time data inference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
