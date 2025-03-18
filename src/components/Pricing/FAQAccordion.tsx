"use client";

import { ArrowLeft01Icon } from "@/components/Misc/icons";
import { Accordion, AccordionItem } from "@heroui/accordion";

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
    <div className="flex w-full items-center justify-center px-[5%] py-[1em] sm:py-[1em]">
      <div className="faq_container mb-[10vh] mt-[20px] rounded-3xl bg-foreground-50 p-10">
        <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
          <span className="text-4xl font-medium">
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
