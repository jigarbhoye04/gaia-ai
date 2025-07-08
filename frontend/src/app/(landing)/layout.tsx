"use client";

import { ReactNode } from "react";

import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
