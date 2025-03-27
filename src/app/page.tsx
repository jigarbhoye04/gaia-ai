"use client";

import { useEffect } from "react";

import HeroImage from "@/components/Landing/Sections/HeroImageSection";
import HeroSection from "@/components/Landing/Sections/HeroSection";

import LazyLoadedSections from "@/components/Landing/Sections/LazyLoadedSections";
import LandingLayout from "./(landing)/layout";
// const LazyLoadedSections = lazy(
//   () => import("@/components/Landing/Sections/LazyLoadedSections"),
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
      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 top-0 z-[-1] h-screen bg-[#000000] bg-gradient-to-b" />
        <HeroSection />
        <HeroImage />
        <LazyLoadedSections />
      </div>
    </LandingLayout>
  );
}
