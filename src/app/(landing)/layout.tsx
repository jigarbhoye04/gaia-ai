"use client";

import Footer from "@/components/Misc/Footer";
import Navbar from "@/components/Misc/Navbar";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { ReactNode, Suspense } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
