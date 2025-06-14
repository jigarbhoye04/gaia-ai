import "./styles/globals.css";
import "./styles/tailwind.css";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import ProvidersLayout from "@/layouts/ProvidersLayout";

export const metadata: Metadata = {
  metadataBase: new URL("https://heygaia.io"),
  title: { default: "GAIA - Your Personal Assistant", template: "%s | GAIA" },
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
        <main>
          <ProvidersLayout>{children}</ProvidersLayout>
        </main>
        {/* Google OAuth */}
        <Script async src="https://accounts.google.com/gsi/client" />

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

        {/* Better Stack widget for API Uptime */}
        <Script
          src="https://uptime.betterstack.com/widgets/announcement.js"
          data-id="212836"
          async
          type="text/javascript"
        />

        {/* Analytics */}
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="881"
          defer
        />
      </body>
    </html>
  );
}
