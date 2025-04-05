"use client";

import { lazy, Suspense, useEffect } from "react";

import HeroImage from "@/components/Landing/Sections/HeroImageSection";
import HeroSection from "@/components/Landing/Sections/HeroSection";
import MobileSection from "@/components/Landing/Sections/MobileSection";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";

import LandingLayout from "./(landing)/layout";

const CalendarSection = lazy(
  () => import("@/components/Landing/Sections/CalendarSection"),
);
const DeepSearchSection = lazy(
  () => import("@/components/Landing/Sections/DeepSearchSection"),
);
const GoalSection = lazy(
  () => import("@/components/Landing/Sections/GoalSection"),
);
const NotesSection = lazy(
  () => import("@/components/Landing/Sections/NotesSection"),
);
const InternetSection = lazy(
  () => import("@/components/Landing/Sections/InternetSection"),
);
const MailSection = lazy(
  () => import("@/components/Landing/Sections/MailSection"),
);
// const FeatureGridSection = lazy(
//   () => import("@/components/Landing/Sections/FeatureGridSection"),
// );
const FinalSection = lazy(
  () => import("@/components/Landing/Sections/FinalSection"),
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
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-gradient-to-b" />
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
            <NotesSection />
          </Suspense>
          <Suspense fallback={<SuspenseLoader />}>
            <InternetSection />
          </Suspense>
          <Suspense fallback={<SuspenseLoader />}>
            <MailSection />
          </Suspense>
          <Suspense fallback={<SuspenseLoader />}>
            <MobileSection />
          </Suspense>
          {/* <Suspense fallback={<SuspenseLoader />}> */}
          {/* <FeatureGridSection /> */}
          {/* </Suspense> */}
          <Suspense fallback={<SuspenseLoader />}>
            <FinalSection />
          </Suspense>
        </div>
      </div>
    </LandingLayout>
  );
}
