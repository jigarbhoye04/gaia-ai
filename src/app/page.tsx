"use client";

import { useEffect } from "react";

import CalendarSection from "@/components/Landing/Sections/CalendarSection";
import DeepSearchSection from "@/components/Landing/Sections/DeepSearchSection";
import FeatureGridSection from "@/components/Landing/Sections/FeatureGridSection";
import FinalSection from "@/components/Landing/Sections/FinalSection";
import GoalSection from "@/components/Landing/Sections/GoalSection";
import HeroImage from "@/components/Landing/Sections/HeroImageSection";
import HeroSection from "@/components/Landing/Sections/HeroSection";
import InternetSection from "@/components/Landing/Sections/InternetSection";
import MailSection from "@/components/Landing/Sections/MailSection";
import MobileSection from "@/components/Landing/Sections/MobileSection";

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
          <CalendarSection />
          <DeepSearchSection />
          <GoalSection />
          <InternetSection />
          <MailSection />
          <FeatureGridSection />
          <MobileSection />
          <FinalSection />
        </div>
      </div>
    </LandingLayout>
  );
}
