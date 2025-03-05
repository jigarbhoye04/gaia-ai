/* eslint-disable prettier/prettier */
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tab, Tabs } from "@heroui/tabs";
import React from "react";

import { ArrowLeft01Icon, Tick02Icon } from "@/components/Misc/icons";

export function FAQAccordion() {
  const faqItems = [
    {
      question: "What is Gaia and how does it work?",
      content:
        "Gaia is a general-purpose AI assistant designed to help with time management, event scheduling, email integration, and more.",
    },
    {
      question: "How do I create an account?",
      content:
        "To create an account, click on the 'Sign Up' button and fill out the registration form.",
    },
    {
      question: "What features does Gaia offer?",
      content:
        "Gaia offers features such as task management, event scheduling, email integration, and goal tracking.",
    },
    {
      question: "How can I schedule events with Gaia?",
      content:
        "Use the scheduling feature in Gaia's interface to set up and manage your events easily.",
    },
    {
      question: "Is my data secure with Gaia?",
      content:
        "Yes, we prioritize user data security with advanced encryption and privacy measures.",
    },
    {
      question: "How do I integrate Gaia with my email?",
      content:
        "Connect your email through the settings page to enable email management features.",
    },
    {
      question: "Can I customize Gaia's settings?",
      content:
        "Yes, you can adjust Gaia's settings from the preferences section in your account.",
    },
    {
      question: "How do I reset my password?",
      content:
        "Go to the login page and click 'Forgot Password' to initiate the reset process.",
    },
    {
      question: "What platforms is Gaia compatible with?",
      content: "Gaia is compatible with web, iOS, and Android platforms.",
    },
    {
      question: "How do I contact support if I have an issue?",
      content:
        "Reach out to our support team via the 'Contact Us' page or email us directly.",
    },
  ];

  return (
    <div className="sm:py-[1em] px-[5%] w-full py-[1em] flex justify-center items-center">
      <div className="mb-[10vh] faq_container mt-[20px] bg-foreground-50 p-10 rounded-3xl">
        <div className="flex flex-col justify-center w-full items-center gap-3 mb-5">
          <span className="font-medium text-4xl">
            Frequently asked questions
          </span>
        </div>

        <Accordion variant="light">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              aria-label={item.question}
              indicator={<ArrowLeft01Icon color="white" width="18" />}
              title={item.question}
            >
              <span className="select-text">{item.content}</span>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

interface PricingCardProps {
  title: string;
  // description: string;
  type: "main" | "secondary";
  price: number;
  discountPercentage?: number; // new prop for discount percentage
  featurestitle: React.ReactNode;
  features?: string[];
  durationIsMonth: boolean;
  className?: string;
}

export function PricingCard({
  title,
  // description,
  type,
  price,
  discountPercentage = 0,
  featurestitle,
  features,
  durationIsMonth,
  className,
}: PricingCardProps) {
  const yearlyPrice = price * 12;
  const discountAmount = !durationIsMonth
    ? (discountPercentage / 100) * yearlyPrice
    : 0;
  const finalPrice = durationIsMonth ? price : yearlyPrice - discountAmount;

  return (
    <>
      {/* bg-custom-gradients */}
      <div
        className={`w-full relative rounded-2xl ${className} ${
          type === "main"
            ? "bg-zinc-900  outline outline-2 outline-primary"
            : "bg-zinc-900 "
        } `}
      >
        <div className="p-[7%] h-full flex-col flex gap-4">
          <div className="flex flex-row justify-between items-center !border-none">
            <div className="text-2xl flex justify-between">{title}</div>
            {!durationIsMonth && discountPercentage > 0 && (
              <Chip
                className="flex text-sm items-center gap-[2px] !border-none"
                color="primary"
                variant="flat"
              >
                <span>Save $ {discountAmount.toFixed(2)}</span>
              </Chip>
            )}
            {/* <span className="font-normal text-white text-opacity-70">
              {description}
            </span> */}
          </div>

          <div className="!border-none flex flex-col gap-0 !m-0 flex-1">
            <div className="!border-none flex gap-2 items-baseline">
              {!durationIsMonth && discountPercentage > 0 && price > 0 && (
                <span className="text-red-500 line-through text-3xl font-normal">
                  ${yearlyPrice}
                </span>
              )}
              <span className="text-5xl">${finalPrice}</span>
              <span className="text-2xl">USD</span>
            </div>

            <span className="font-normal text-sm text-white text-opacity-70">
              {durationIsMonth ? "/ per month" : "/ per year"}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            {featurestitle}

            {!!features &&
              features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className="text-sm font-normal flex items-center gap-3 !border-none"
                >
                  <Tick02Icon
                    height="20"
                    width="20"
                    className="min-w-[20px] min-h-[20px]"
                  />
                  {feature}
                </div>
              ))}
          </div>

          <Button
            className="w-full font-medium"
            color="primary"
            variant={type === "main" ? "shadow" : "flat"}
          >
            Get started
          </Button>
        </div>
      </div>
    </>
  );
}

export function PricingCards({ durationIsMonth = false }) {
  return (
    <div className="grid grid-cols-2 w-screen max-w-screen-sm gap-3 ">
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
          <div className="flex flex-col mb-1 !border-none">
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
          <div className="flex flex-col mb-1 !border-none">
            <span>What's Included?</span>
          </div>
        }
        price={10}
        discountPercentage={40}
        title="Pro"
        type="main"
      />
    </div>
  );
}

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

        {/* <FAQAccordion /> */}
      </div>
    </div>
  );
}
