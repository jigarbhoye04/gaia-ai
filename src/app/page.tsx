"use client";

import { lazy, useEffect } from "react";

import HeroSection from "@/features/landing/components/hero/HeroSection";
import Productivity from "@/features/landing/components/sections/new/Productivity";

import LandingLayout from "./(landing)/layout";

// Lazy load section components
const CalendarSection = lazy(
  () => import("@/features/landing/components/sections/CalendarSection"),
);
const DeepSearchSection = lazy(
  () => import("@/features/landing/components/sections/DeepSearchSection"),
);
// const FeatureGridSection = lazy(
//   () => import("@/components/landing/sections/FeatureGridSection"),
// );
const FinalSection = lazy(
  () => import("@/features/landing/components/sections/FinalSection"),
);
const GoalSection = lazy(
  () => import("@/features/landing/components/sections/GoalSection"),
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
      <div className="relative overflow-hidden">
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-linear-to-b" />

        <HeroSection />
        {/* <HeroImage /> */}

        <div
        // className="mt-[12rem] space-y-[5rem] sm:mt-[18rem] sm:space-y-[15rem]"
        >
          <Productivity />
          {/* <Integrations /> */}
          {/* 
          <Suspense fallback={<SuspenseLoader />}>
            <CalendarSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <DeepSearchSection />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <GoalSection />
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
    </LandingLayout>
  );
}
