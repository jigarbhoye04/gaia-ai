"use client";

import { lazy, useEffect } from "react";

import HeroSection from "@/features/landing/components/hero/HeroSection";
import Integrations from "@/features/landing/components/sections/IntegrationsSection";
import Description from "@/features/landing/components/sections/new/Description";
import Personalised from "@/features/landing/components/sections/new/Personalised";
import Proactive from "@/features/landing/components/sections/new/Proactive";
import Mail from "@/features/landing/components/sections/new/Mail";
import Calendar from "@/features/calendar/components/Calendar";
import Todo from "@/features/landing/components/sections/new/Todo";
import InternetSection from "@/features/landing/components/sections/InternetSection";
import AdvancedConversation from "@/features/landing/components/sections/new/AdvancedConversation";
// import Integrations from "@/features/landing/components/sections/IntegrationsSection";
import LandingLayout from "./(landing)/layout";
import HeroImage from "@/features/landing/components/hero/HeroImageSection";
import Image from "next/image";
import Goals from "@/features/chat/components/bubbles/bot/goals";

// const DeepSearchSection = lazy(
//   () => import("@/features/landing/components/sections/DeepSearchSection"),
// );
// const FeatureGridSection = lazy(
//   () => import("@/components/landing/sections/FeatureGridSection"),
// );
const FinalSection = lazy(
  () => import("@/features/landing/components/sections/FinalSection"),
);

// const Goals = lazy(
//   () => import("@/features/landing/components/sections/new/Goals"),
// );
// const InternetSection = lazy(
//   () => import("@/features/landing/components/sections/InternetSection"),
// );
// const MobileSection = lazy(
//   () => import("@/features/landing/components/sections/MobileSection"),
// );

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.style.overflowY = "scroll";

    return () => {
      document.documentElement.style.overflowY = "auto";
    };
  }, []);

  return (
    <LandingLayout>
      {/* <ReactLenis> */}
      <div className="relative overflow-hidden">
        {/* <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-linear-to-b" /> */}

        <HeroSection />
        <div className="relative z-10 flex h-screen w-screen items-center justify-center p-20">
          <Image
            width={1920}
            height={1080}
            alt="Hero Image"
            src={"/landing/hero2.webp"}
            className="rounded-3xl"
          />
          {/* <HeroImage /> */}
        </div>
        <div>
          <Description />
          {/* <Personalised /> */}
          <Integrations />
          <Proactive />
          <Mail />
          {/* <Calendar /> */}
          <Todo />
          {/* <Goals /> */}
          <InternetSection />
          <AdvancedConversation />
          {/* TODO: Section for crazy automations, MCP, n8n, and reminders feature */}

          {/*
          <Suspense fallback={<SuspenseLoader />}>
            <DeepSearchSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <MailSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <FeatureGridSection />
          </Suspense>

           */}
          {/* <MobileSection /> */}
          <FinalSection />
        </div>
      </div>
      {/* </ReactLenis> */}
    </LandingLayout>
  );
}
