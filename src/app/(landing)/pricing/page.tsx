import { FAQAccordion } from "@/components/Pricing/FAQAccordion";
import { PricingCards } from "@/components/Pricing/PricingCards";
import { Chip } from "@heroui/chip";
import { Tab, Tabs } from "@heroui/tabs";
import type { Metadata } from "next";

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

export default function Pricing() {
  return (
    <div className="bg-custom-gradient flex min-h-screen w-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-2 flex w-full flex-col items-center gap-3">
          <Chip color="primary" size="lg" variant="light">
            Pricing
          </Chip>

          <span className="w-full px-6 text-center text-5xl font-medium">
            GAIA - Your Personal AI Assistant
          </span>
          <span className="text-md text-center text-foreground-500">
            Compare plans & features
          </span>
        </div>

        <div className="mt-5 flex w-full flex-col items-center font-medium">
          <Tabs aria-label="Options" radius="full">
            <Tab key="monthly" title="Monthly">
              <PricingCards durationIsMonth />
            </Tab>
            <Tab
              key="music"
              title={
                <div className="flex w-full items-center justify-center gap-2">
                  Yearly
                  <Chip color="primary" size="sm" variant="shadow">
                    <div className="text-sm font-medium">Save 40%</div>
                  </Chip>
                </div>
              }
            >
              <PricingCards />
            </Tab>
          </Tabs>
        </div>

        <FAQAccordion />
      </div>
    </div>
  );
}
