import type { Metadata } from "next";

import PricingPage from "@/features/pricing/components/PricingPage";
import { getPlansServer } from "@/features/pricing/lib/serverPricingApi";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare GAIA's pricing plans and find the best AI assistant plan for your needs. Choose between monthly and yearly subscriptions.",
  openGraph: {
    title: "Pricing",
    description:
      "Compare GAIA's pricing plans and find the best AI assistant plan for your needs. Choose between monthly and yearly subscriptions.",
    url: "https://heygaia.io/pricing",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - AI Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing",
    description:
      "Compare GAIA's pricing plans and find the best AI assistant plan for your needs. Choose between monthly and yearly subscriptions.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "Pricing",
    "AI Assistant",
    "Subscription Plans",
    "Monthly Plan",
    "Yearly Plan",
    "Compare Plans",
  ],
};

export default async function Pricing() {
  // Fetch plans on the server side
  const initialPlans = await getPlansServer(true);

  return <PricingPage initialPlans={initialPlans} />;
}
