import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surf Simulator",
  description: "Interactive Gerstner wave ocean simulation with bathymetry",
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
