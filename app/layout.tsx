import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polygon OMS Orchestration Studio",
  description: "Interactive Open Money Stack orchestration studio for launches and migrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
