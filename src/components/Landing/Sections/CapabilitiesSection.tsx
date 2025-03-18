import { ReactNode } from "react";

import {
  BlushBrush02Icon,
  BubbleConversationChatIcon,
  Calendar01Icon,
  DocumentAttachmentIcon,
  GlobalSearchIcon,
  StickyNote01Icon,
  Target02Icon,
} from "@/components/Misc/icons";
import { MagicCard } from "@/components/ui/magic-card";

import { AnimatedSection } from "../../../layouts/AnimatedSection";

interface FeatureType {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ feature }: { feature: FeatureType }) {
  return (
    <MagicCard
      className="!w-full !rounded-none !bg-transparent p-5"
      gradientColor="#00bbff30"
      gradientFrom="#00bbff"
      gradientTo="#00bbff"
      noRadius={true}
    >
      <AnimatedSection className="flex w-full min-w-full flex-col items-center justify-center p-3">
        <div className="!rounded-none bg-transparent py-2 sm:py-3">
          {feature.icon}
        </div>
        <div className="text-center text-lg font-medium">{feature.title}</div>
        <div className="text-center text-foreground-600">
          {feature.description}
        </div>
      </AnimatedSection>
    </MagicCard>
  );
}

export default function WhatCanYouDo() {
  const features = [
    {
      icon: (
        <BubbleConversationChatIcon color={"#00bbff"} height={30} width={30} />
      ),
      title: "Smart Conversations",
      description: "Chat naturally and get instant answers.",
    },
    {
      icon: <BlushBrush02Icon color={"#00bbff"} height={30} width={30} />,
      title: "Generate Images",
      description: "Create AI-generated images from text.",
    },
    {
      icon: <Calendar01Icon color={"#00bbff"} height={30} width={30} />,
      title: "Calendar Management",
      description: "Schedule events and set reminders.",
    },
    {
      icon: <Calendar01Icon color={"#00bbff"} height={30} width={30} />,
      title: "Store Memories",
      description: "Save and recall important moments.",
    },
    {
      icon: <StickyNote01Icon color={"#00bbff"} height={30} width={30} />,
      title: "Take Notes",
      description: "Store notes for GAIA to remember.",
    },
    {
      icon: <Target02Icon color={"#00bbff"} height={30} width={30} />,
      title: "Manage Goals",
      description: "Create Roadmaps, Track progress, Achieve goals.",
    },
    {
      icon: <DocumentAttachmentIcon color={"#00bbff"} height={30} width={30} />,
      title: "Understand Documents",
      description: "Analyze and understand documents easily.",
    },
    {
      icon: <GlobalSearchIcon color={"#00bbff"} height={30} width={30} />,
      title: "Use the Internet",
      description: "Search and browse real-time information.",
    },
  ];

  return (
    <AnimatedSection className="relative z-[1] flex min-h-fit w-screen flex-col items-center justify-center">
      <div className="text-center text-4xl font-medium">
        What can GAIA do for you?
      </div>
      <div className="relative grid min-h-fit w-full max-w-screen-xl grid-cols-1 items-center rounded-3xl p-10 sm:grid-cols-4">
        <div className="pointer-events-none absolute top-0 flex h-full w-full flex-col items-center justify-start">
          <div className="relative top-[40px] z-[-1] size-[250px] bg-[#00bbff] blur-[100px]" />
        </div>

        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>
      <div className="text-md text-foreground-600">and much more...</div>
    </AnimatedSection>
  );
}
