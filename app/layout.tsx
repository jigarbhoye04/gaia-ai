import LoginModal from "@/components/Login/LoginModal";
import Providers from "@/redux/providers";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Head from "next/head";
import Script from "next/script";

export const metadata: Metadata = {
  title: "GAIA - Your Personal Assistant",
  description:
    "GAIA is your personal AI assistant designed to help increase your productivity.",
  keywords: [
    "GAIA",
    "Personal AI Assistant",
    "AI",
    "ai assistant",
    "digital assistant",
    "productivity",
    "Hey GAIA",
    "general purpose ai assistant",
    "artificial intelligence",
    "virtual assistant",
    "smart assistant",
    "AI personal assistant",
    "task management",
  ],
  openGraph: {
    title: "GAIA - Your Personal Assistant",
    siteName: "GAIA - Personal Assistant",
    url: "https://heygaia.io/",
    type: "website",
    description:
      "GAIA is your personal AI assistant designed to help increase your productivity.",
    images: ["/landing/screenshot.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GAIA - Your Personal Assistant",
    description:
      "GAIA is your personal AI assistant designed to help increase your productivity.",
    images: ["/landing/screenshot.webp"],
  },
  other: {
    "msapplication-TileColor": "#00bbff",
    "apple-mobile-web-app-capable": "yes",
  },
};

// ✅ Move themeColor to viewport
export const viewport: Viewport = {
  themeColor: "#00bbff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Preload Fonts */}
        <link
          rel="preload"
          href="/fonts/CreatoDisplay-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CreatoDisplay-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CreatoDisplay-ExtraBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preconnect & Prefetch */}
        <link
          rel="preconnect"
          href="https://www.googletagmanager.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link
          rel="preconnect"
          href="https://accounts.google.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
      </Head>
      <body>
        <Providers>
          <LoginModal />
          <Toaster closeButton richColors position="top-right" theme="dark" />
          {children}
        </Providers>

        {/* Google OAuth */}
        <Script async src="https://accounts.google.com/gsi/client" />

        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-R6EGV9FG2Q"
        />
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "G-R6EGV9FG2Q");`}
        </Script>

        {/* JSON-LD Schema */}
        <Script id="json-ld" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "GAIA",
            alternateName: ["G.A.I.A", "General Purpose AI Assistant"],
            url: "https://heygaia.io",
          })}
        </Script>
      </body>
    </html>
  );
}
