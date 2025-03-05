"use client";

import Footer from "@/components/Misc/Footer";
import Navbar from "@/components/Misc/Navbar";
import { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
