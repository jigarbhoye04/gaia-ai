"use client";

import { motion } from "framer-motion";

import {
  OnboardingChips,
  OnboardingComplete,
  OnboardingInput,
  OnboardingMessages,
} from "@/features/onboarding/components";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";

export default function Onboarding() {
  const {
    onboardingState,
    messagesEndRef,
    inputRef,
    handleChipSelect,
    handleCountrySelect,
    handleProfessionSelect,
    handleProfessionInputChange,
    handleInputChange,
    handleSubmit,
    handleLetsGo,
  } = useOnboarding();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black backdrop-blur-2xl">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(100% 125% at 50% 100%, #000000 50%, #00bbffAA)`,
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Messages Container */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-32">
        <div className="relative mx-auto max-w-2xl">
          <OnboardingMessages
            messages={onboardingState.messages}
            messagesEndRef={messagesEndRef}
          />
          <OnboardingChips
            onboardingState={onboardingState}
            onChipSelect={handleChipSelect}
          />
        </div>
      </div>

      {/* Fixed Input Container */}
      <div className="relative z-10 mx-auto w-full max-w-lg pb-3">
        {onboardingState.isOnboardingComplete ? (
          <OnboardingComplete onLetsGo={handleLetsGo} />
        ) : (
          <OnboardingInput
            onboardingState={onboardingState}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onCountrySelect={handleCountrySelect}
            onProfessionSelect={handleProfessionSelect}
            onProfessionInputChange={handleProfessionInputChange}
            inputRef={inputRef}
          />
        )}
      </div>
    </div>
  );
}
