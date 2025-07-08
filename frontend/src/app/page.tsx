"use client";

import { lazy, useEffect } from "react";

import HeroSection from "@/features/landing/components/hero/HeroSection";
import Integrations from "@/features/landing/components/sections/IntegrationsSection";

// import Integrations from "@/features/landing/components/sections/IntegrationsSection";
import LandingLayout from "./(landing)/layout";

// const DeepSearchSection = lazy(
//   () => import("@/features/landing/components/sections/DeepSearchSection"),
// );
// const FeatureGridSection = lazy(
//   () => import("@/components/landing/sections/FeatureGridSection"),
// );
const FinalSection = lazy(
  () => import("@/features/landing/components/sections/FinalSection"),
);

const Goals = lazy(
  () => import("@/features/landing/components/sections/new/Goals"),
);
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
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-linear-to-b" />

        <HeroSection />
        {/* <HeroImage /> */}

        <div
        // className="mt-40 space-y-26"
        // className="mt-[12rem] space-y-[5rem] sm:mt-[18rem] sm:space-y-[15rem]"
        >
          {/* <Description /> */}
          {/* <Personalised /> */}
          <Integrations />
          {/* <Proactive /> */}
          {/* <Mail /> */}
          {/* <Calendar /> */}
          {/* <Todo /> */}
          {/* <Goals /> */}
          {/* <InternetSection /> */}
          {/* <AdvancedConversation /> */}
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
