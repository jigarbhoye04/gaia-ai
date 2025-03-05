// import { Chip } from "@heroui/chip";
// import { WavingHand01Icon } from "../icons";
// import img from "/public/gaia.logo.png";
import { ArrowUpRight } from "lucide-react";

import {
  BlushBrush02Icon,
  Calendar01Icon,
  DocumentAttachmentIcon,
  FlowchartIcon,
  GlobalSearchIcon,
  Mic01Icon,
  Route02Icon,
  StickyNote01Icon,
} from "../Misc/icons";

const badges = [
  {
    variant: "secondary",
    bgClass: "bg-purple-500 hover:bg-purple-500",
    textClass: "text-purple-500",
    icon: (
      <FlowchartIcon
        className="text-purple-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Generate Flowcharts",
  },
  {
    variant: "secondary",
    bgClass: "bg-emerald-500 hover:bg-emerald-500",
    textClass: "text-emerald-500",
    icon: (
      <BlushBrush02Icon
        className="text-emerald-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Generate Image",
  },
  {
    variant: "secondary",
    bgClass: "bg-orange-500 hover:bg-orange-500",
    textClass: "text-orange-500",
    icon: (
      <Mic01Icon
        className="text-orange-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Voice Conversation",
  },
  {
    variant: "secondary",
    bgClass: "bg-blue-500 hover:bg-blue-500",
    textClass: "text-blue-500",
    icon: (
      <GlobalSearchIcon
        className="text-blue-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Internet Search",
  },
  {
    variant: "secondary",
    bgClass: "bg-lime-500 hover:bg-lime-500",
    textClass: "text-lime-500",
    icon: (
      <ArrowUpRight
        className="text-lime-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Fetch Webpage",
  },
  {
    variant: "secondary",
    bgClass: "bg-red-500 hover:bg-red-500",
    textClass: "text-red-500",
    icon: (
      <Calendar01Icon
        className="text-red-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Manage Calendar",
  },
  {
    variant: "secondary",
    bgClass: "bg-cyan-500 hover:bg-cyan-500",
    textClass: "text-cyan-500",
    icon: (
      <StickyNote01Icon
        className="text-cyan-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Store Memories",
  },
  {
    variant: "secondary",
    bgClass: "bg-pink-500 hover:bg-pink-500",
    textClass: "text-pink-500",
    icon: (
      <Route02Icon
        className="text-pink-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Manage Goals",
  },
  {
    variant: "secondary",
    bgClass: "bg-yellow-500 hover:bg-yellow-500",
    textClass: "text-yellow-500",
    icon: (
      <DocumentAttachmentIcon
        className="text-yellow-500 group-hover:text-white transition-colors"
        width={17}
      />
    ),
    text: "Chat with Documents",
  },
];

export default function StarterText() {
  return (
    <>
      <div className="text-4xl font-medium grow flex-1 text-center my-4 inline-flex flex-wrap items-center gap-2 justify-center">
        Hey!
        <img
          alt="Waving Hand"
          className="object-contain"
          height={50}
          src="https://em-content.zobj.net/source/apple/391/waving-hand_1f44b.png"
          width={50}
        />
        What can I do for you today?
      </div>

      {/* <div className="text-foreground-500 text-xs -mt-1 mb-1">
        I can do the following for you:
      </div> */}
      <div className="flex gap-2 flex-wrap max-w-[650px] justify-center">
        {badges.map((badge, index) => (
          <div
            key={index}
            className={`${badge.bgClass} cursor-pointer bg-opacity-20 hover:bg-opacity-80 text-sm ${badge.textClass} font-medium hover:text-white group px-2 rounded-full transition-all`}
          >
            <div className="flex items-center gap-1">
              {badge.icon}
              {badge.text}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
