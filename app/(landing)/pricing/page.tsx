"use client";

import { FAQAccordion } from "@/components/Pricing/FAQAccordion";
import { PricingCards } from "@/components/Pricing/PricingCards";
import { Chip } from "@heroui/chip";
import { Tab, Tabs } from "@heroui/tabs";

export default function Pricing() {
  return (
    <div className="flex justify-center w-screen items-center min-h-screen flex-col bg-custom-gradient">
      <div className="flex-col flex gap-2 items-center">
        <div className="flex items-center flex-col gap-3 mb-2 w-full">
          <Chip color="primary" size="lg" variant="light">
            Pricing
          </Chip>

          <span className="font-medium text-5xl text-center px-6 w-full">
            GAIA - Your Personal AI Assistant
          </span>
          <span className="text-md text-center text-foreground-500">
            Compare plans & features
          </span>
        </div>

        <div className="flex w-full flex-col items-center font-medium mt-5">
          <Tabs aria-label="Options" radius="full">
            <Tab key="monthly" title="Monthly">
              <PricingCards durationIsMonth />
            </Tab>
            <Tab
              key="music"
              title={
                <div className="flex gap-2 items-center justify-center w-full">
                  Yearly
                  <Chip color="primary" size="sm" variant="shadow">
                    <div className="font-medium text-sm">Save 40%</div>
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
