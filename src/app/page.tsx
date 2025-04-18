"use client";

import { useEffect } from "react";

import HeroImage from "@/components/Landing/Sections/HeroImageSection";
import HeroSection from "@/components/Landing/Sections/HeroSection";

import LandingLayout from "./(landing)/layout";

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
          {/* <CalendarSection />
          <DeepSearchSection />
          <GoalSection />
          <InternetSection />
          <MailSection />
          <FeatureGridSection />
          <MobileSection />
          <FinalSection /> */}
        </div>
      </div>
    </LandingLayout>
  );
}
