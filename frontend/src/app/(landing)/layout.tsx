"use client";
import { ReactNode } from "react";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="relative">
        {/* Backdrop blur overlay */}
        <div 
          id="navbar-backdrop"
          className="fixed inset-0 bg-black/20 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out z-40"
        />
        
        <Navbar />
        
        {children}

        <Footer />
      </div>
    </>
  );
}