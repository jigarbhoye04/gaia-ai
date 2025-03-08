import LoginModal from "@/components/Login/LoginModal";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import ProvidersLayout from "@/layouts/ProvidersLayout";
import Providers from "@/redux/providers";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://heygaia.io"),
  title: "GAIA - Your Personal Assistant",
  description:
    "GAIA is your personal AI assistant designed to help increase your productivity.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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

export const viewport: Viewport = {
  themeColor: "#00bbff",
};

const creato = localFont({
  src: [
    {
      path: "./fonts/CreatoDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/CreatoDisplay-Bold.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/CreatoDisplay-ExtraBold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  preload: true,
  variable: "--font-creato",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${creato.variable} dark`}>
      <body className="dark">
        <ProvidersLayout>{children}</ProvidersLayout>

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
