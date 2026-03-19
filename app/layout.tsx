import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "fourtwenty.nyc",
  description: "4/20 in NYC. 2026. Something's coming.",
  openGraph: {
    title: "fourtwenty.nyc",
    description: "4/20 in NYC. 2026. Something's coming.",
    url: "https://fourtwenty.nyc",
    siteName: "fourtwenty.nyc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fourtwenty.nyc",
    description: "4/20 in NYC. 2026. Something's coming.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream">
        {children}
        <Script src="https://anipotts.com/brand/header.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
