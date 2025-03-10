import { Button } from "@heroui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Need help with GAIA? Contact our support team for assistance and inquiries.",
  openGraph: {
    title: "Contact Us",
    description:
      "Need help with GAIA? Contact our support team for assistance and inquiries.",
    url: "https://heygaia.io/contact",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - Your Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us",
    description:
      "Need help with GAIA? Contact our support team for assistance and inquiries.",
    images: ["/landing/screenshot.webp"],
  },
};

export default function ContactPage() {
  return (
    <div className="flex items-center justify-center min-h-screen w-screen p-6 bg-custom-gradient">
      <div className="max-w-lg w-full bg-zinc-900 rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold">Need Help?</h1>
        <p className="mt-2 text-zinc-300">
          For any assistance or inquiries, feel free to reach out to us.
        </p>
        <a
          href="mailto:support@heygaia.io"
          className="inline-block mt-4"
          aria-label="Email GAIA Support"
        >
          <Button color="primary" size="lg" variant="shadow" radius="full">
            Email us at: <b>support@heygaia.io</b>
          </Button>
        </a>
      </div>
    </div>
  );
}
