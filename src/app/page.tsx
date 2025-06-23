"use client";

import { lazy, useEffect } from "react";

import HeroImage from "@/features/landing/components/hero/HeroImageSection";
import HeroSection from "@/features/landing/components/hero/HeroSection";
import Integrations from "@/features/landing/components/sections/IntegrationsSection";
import AdvancedConversation from "@/features/landing/components/sections/new/AdvancedConversation";
import Calendar from "@/features/landing/components/sections/new/Calendar";
import Description from "@/features/landing/components/sections/new/Description";
import Personalised from "@/features/landing/components/sections/new/Personalised";
import Proactive from "@/features/landing/components/sections/new/Proactive";
import Productivity from "@/features/landing/components/sections/new/Productivity";
import Todo from "@/features/landing/components/sections/new/Todo";

import LandingLayout from "./(landing)/layout";

const DeepSearchSection = lazy(
  () => import("@/features/landing/components/sections/DeepSearchSection"),
);
// const FeatureGridSection = lazy(
//   () => import("@/components/landing/sections/FeatureGridSection"),
// );
const FinalSection = lazy(
  () => import("@/features/landing/components/sections/FinalSection"),
);

const Goals = lazy(
  () => import("@/features/landing/components/sections/new/Goals"),
);
const InternetSection = lazy(
  () => import("@/features/landing/components/sections/InternetSection"),
);
const MailSection = lazy(
  () => import("@/features/landing/components/sections/MailSection"),
);
const MobileSection = lazy(
  () => import("@/features/landing/components/sections/MobileSection"),
);

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
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-linear-to-b" />

        <HeroSection />
        <HeroImage />

        <div
          className="mt-40 space-y-20"
          // className="mt-[12rem] space-y-[5rem] sm:mt-[18rem] sm:space-y-[15rem]"
        >
          <Description />
          <Productivity />
          <Proactive />
          <Personalised />
          <Calendar />
          <Todo />
          <Goals />
          <AdvancedConversation />
          <Integrations />

          {/* Section for crazy automations, MCP, n8n, and reminders feature */}

          {/* 
          <Suspense fallback={<SuspenseLoader />}>
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <DeepSearchSection />
          </Suspense>


          <Suspense fallback={<SuspenseLoader />}>
            <InternetSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <MailSection />
          </Suspense>
          <Suspense fallback={<SuspenseLoader />}>
            <FeatureGridSection />
          </Suspense> 

          <Suspense fallback={<SuspenseLoader />}>
            <MobileSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <FinalSection />
          </Suspense> */}
        </div>
      </div>
      {/* </ReactLenis> */}
    </LandingLayout>
  );
}
