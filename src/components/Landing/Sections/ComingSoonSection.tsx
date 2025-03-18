import React from "react";

import {
  BubbleChatLockIcon,
  ComputerPhoneSyncIcon,
  Mail01Icon,
  MoneyBag02Icon,
  VoiceIcon,
} from "../../Misc/icons";
import { AnimatedSection } from "../../../layouts/AnimatedSection";

const list: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}[] = [
  // {
  //   title: "Personalised",
  //   description: "Tailored to your preferences",
  //   icon: <AccountSetting02Icon width={35} height={35} />,
  // },
  // {
  //   title: "Multi-Lingual",
  //   description: "Support for multiple languages",
  //   icon: <LanguageSkillIcon width={35} height={35} />,
  // },
  {
    title: "Cross-Platform",
    description: "Available on multiple devices",
    icon: <ComputerPhoneSyncIcon height={35} width={35} />,
  },
  {
    title: "Voice Activated",
    description: "Activated using your voice",
    icon: <VoiceIcon height={35} width={35} />,
  },
  {
    title: "Expense Tracking",
    description: "Seamlessly track your expenses through messaging",
    icon: <MoneyBag02Icon height={35} width={35} />,
  },
  {
    title: "Email Management",
    description: "Manage your Emails",
    icon: <Mail01Icon height={35} width={35} />,
  },
  // {
  //   title: "Save Messages",
  //   description: "Pin & save messages for later",
  //   icon: <PinIcon width={35} height={35} />,
  // },
  // {
  //   title: "File Upload",
  //   description: "Supports document & media uploads",
  //   icon: <FileUploadIcon width={35} height={35} />,
  // },
  {
    title: "End-to-End Encryption",
    description: "Support for end-to-end encryption for increased privacy",
    icon: <BubbleChatLockIcon height={35} width={35} />,
  },

  // {
  //   title: "Internet",
  //   description: "Connected to the web",
  //   icon: <InternetIcon width={35} height={35} />,
  // },
  // {
  //   title: "Goal Management",
  //   description: "Track & Manage your goals",
  //   icon: <Target02Icon width={35} height={35} />,
  // },
  // {
  //   title: "Integrated",
  //   description: "Integrate into existing workspaces",
  //   icon: (
  //     <div className="flex gap-2">
  //       <GoogleDriveIcon height={35} width={35} />
  //       <CalendarIcon height={35} width={35} />
  //       <Mail01Icon height={35} width={35} />
  //     </div>
  //   ),
  // },
  // {
  //   description: "and many more features coming soon...",
  //   className: "col-span-3 text-center",
  // },
];

export function Feature({
  icon,
  title,
  description,
  className = "",
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-full w-full flex-col gap-2 rounded-xl bg-zinc-950 px-5 py-3 transition-all hover:bg-zinc-800 ${className}`}
    >
      {icon}
      <span className="text-xl font-medium">{title}</span>
      <span className="text-md text-foreground-500">{description}</span>
    </div>
  );
}

export default function ComingSoonSection() {
  return (
    <div className="relative z-[1] flex h-fit min-h-fit items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-1 p-2 sm:p-5">
        <span className="text-3xl font-medium">Coming Soon!</span>
        <span>What are we working on next?</span>
        <AnimatedSection className="my-6 grid h-fit max-w-screen-xl items-center justify-center gap-2 gap-y-2 rounded-2xl bg-zinc-900 px-2 py-3 sm:grid-cols-3 sm:gap-2 sm:gap-y-5 sm:rounded-3xl sm:p-10">
          {list.map((item, index) => (
            <Feature
              key={index}
              className={item.className}
              description={item.description}
              icon={item.icon}
              title={item.title}
            />
          ))}
        </AnimatedSection>
      </div>
    </div>
  );
}
