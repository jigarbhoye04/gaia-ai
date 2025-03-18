"use client";

import { ReactNode } from "react";

import Footer from "@/components/Misc/Footer";
import Navbar from "@/components/Misc/Navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
