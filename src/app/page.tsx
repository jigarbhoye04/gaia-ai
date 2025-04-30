"use client";

import { useEffect, lazy, Suspense } from "react";
import LandingLayout from "./(landing)/layout";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import HeroSection from "@/components/Landing/Sections/HeroSection";
import HeroImage from "@/components/Landing/Sections/HeroImageSection";

// Lazy load section components
const CalendarSection = lazy(
  () => import("@/components/Landing/Sections/CalendarSection"),
);
const DeepSearchSection = lazy(
  () => import("@/components/Landing/Sections/DeepSearchSection"),
);
const FeatureGridSection = lazy(
  () => import("@/components/Landing/Sections/FeatureGridSection"),
);
const FinalSection = lazy(
  () => import("@/components/Landing/Sections/FinalSection"),
);
const GoalSection = lazy(
  () => import("@/components/Landing/Sections/GoalSection"),
);
const InternetSection = lazy(
  () => import("@/components/Landing/Sections/InternetSection"),
);
const MailSection = lazy(
  () => import("@/components/Landing/Sections/MailSection"),
);
const MobileSection = lazy(
  () => import("@/components/Landing/Sections/MobileSection"),
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
      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-linear-to-b" />

        <HeroSection />
        <HeroImage />

        <div className="mt-[12rem] space-y-[5rem] sm:mt-[18rem] sm:space-y-[15rem]">
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
          </Suspense>
        </div>
      </div>
    </LandingLayout>
  );
}
