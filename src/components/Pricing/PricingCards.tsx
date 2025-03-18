"use client";

import { PricingCard } from "./PricingCard";

export function PricingCards({ durationIsMonth = false }) {
  return (
    <div className="grid w-screen max-w-screen-sm grid-cols-2 gap-3">
      <PricingCard
        // description="lorem ipsum"
        durationIsMonth={durationIsMonth}
        features={[
          "Instant Messaging",
          "Conversation Management",
          "Limited Email Integration",
          "Limited access to goal tracking, stored notes/memories, calendar bookings, image generation, and more",
          "Talk to GAIA with your voice (Speech-to-text)",
        ]}
        featurestitle={
          <div className="mb-1 flex flex-col !border-none">
            <span>What's Included?</span>
          </div>
        }
        price={0}
        discountPercentage={0}
        title="Basic"
        type="secondary"
      />
      <PricingCard
        // description="lorem ipsum"
        durationIsMonth={durationIsMonth}
        features={[
          "Everything in Free",
          "Advanced Email Integration",
          "Generated upto 50 images per day",
          "Chat with Documents",
          "Early Access to new features",
          "Ability to use more open-source models",
        ]}
        featurestitle={
          <div className="mb-1 flex flex-col !border-none">
            <span>What's Included?</span>
          </div>
        }
        price={20}
        discountPercentage={40}
        title="Pro"
        type="main"
      />
    </div>
  );
}
