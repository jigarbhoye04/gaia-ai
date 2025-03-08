import { AnimatedSection } from "../../../layouts/AnimatedSection";

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

function FeatureCard({
  feature,
}: {
  feature: { icon: JSX.Element; title: string; description: string };
}) {
  return (
    <MagicCard
      className="p-5 !rounded-none !bg-transparent !w-full "
      gradientColor="#00bbff30"
      gradientFrom="#00bbff"
      gradientTo="#00bbff"
      noRadius={true}
    >
      <AnimatedSection className=" items-center flex justify-center flex-col min-w-full w-full p-3">
        <div className="sm:py-3 py-2 bg-transparent !rounded-none">
          {feature.icon}
        </div>
        <div className="font-medium text-lg text-center">{feature.title}</div>
        <div className="text-foreground-600 text-center">
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
    <AnimatedSection className="w-screen flex items-center min-h-fit justify-center flex-col z-[1] relative">
      <div className="font-medium text-4xl text-center">
        What can GAIA do for you?
      </div>
      <div className="max-w-screen-xl w-full min-h-fit rounded-3xl p-10 items-center grid sm:grid-cols-4 grid-cols-1 relative">
        <div className="h-full w-full absolute top-0 flex justify-start flex-col items-center pointer-events-none">
          <div className="size-[250px] blur-[100px] bg-[#00bbff] z-[-1] relative top-[40px]" />
        </div>

        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>
      <div className="text-md text-foreground-600">and much more...</div>
    </AnimatedSection>
  );
}
