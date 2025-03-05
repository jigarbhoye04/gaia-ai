"use client";

import HeroImage from "@/components/Landing/Sections/HeroImageSection";
import HeroSection from "@/components/Landing/Sections/HeroSection";
import Navbar from "@/components/Misc/Navbar";
import FooterLayout from "@/layouts/FooterLayout";
import NavbarLayout from "@/layouts/NavbarLayout";
import { Dispatch, lazy, ReactElement, SetStateAction, useEffect } from "react";
const LazyLoadedSections = lazy(
  () => import("@/components/Landing/Sections/LazyLoadedSections")
);

export default function LandingPage({
  setLoginModalOpen,
}: {
  setLoginModalOpen: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    document.documentElement.style.overflowY = "scroll";

    return () => {
      document.documentElement.style.overflowY = "auto";
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      <div className="fixed inset-0 bg-gradient-to-b bg-[#000000] z-[-1] top-0 h-screen" />
      <HeroSection />
      <HeroImage setLoginModalOpen={setLoginModalOpen} />
      <LazyLoadedSections />
    </div>
  );
}

LandingPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <NavbarLayout>
      {/* <FooterLayout>{page}</FooterLayout> */}
      {page}
    </NavbarLayout>
  );
};
