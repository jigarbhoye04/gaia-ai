import {
  BriefcaseBusiness,
  Code,
  GraduationCap,
  Handshake,
} from "lucide-react";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";

import { cn } from "@/lib/utils";

interface TargetCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  img: string;
  current: TargetData | null;
  setCurrent: Dispatch<SetStateAction<TargetData>>;
}

interface TargetData {
  title: string;
  description: string;
  icon: ReactNode;
  img: string;
}

const TargetCard = ({
  title,
  description,
  icon,
  img,
  current,
  setCurrent,
}: TargetCardProps) => (
  <div
    className={cn(
      current?.title === title && current?.description === description
        ? "text-white"
        : "text-foreground-400 hover:text-foreground-600",
      "cursor-pointer transition-all",
    )}
    onClick={() => setCurrent({ title, description, icon, img })}
  >
    <div className="flex items-center gap-2 text-xl font-medium sm:text-2xl">
      {icon}
      {title}
    </div>
    <div className="text-medium sm:text-lg">{description}</div>
  </div>
);

const targetData: TargetData[] = [
  {
    title: "For Students",
    description:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quod temporibus debitis fugit possimus odio amet reprehenderit mollitia recusandae vero quis.",
    icon: <GraduationCap />,
    img: "/landing/screenshot.webp",
  },
  {
    title: "For Professionals",
    description:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quod temporibus debitis fugit possimus odio amet reprehenderit mollitia recusandae vero quis.",
    icon: <BriefcaseBusiness />,
    img: "/landing/screenshot.webp",
  },
  {
    title: "For Businesses",
    description:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quod temporibus debitis fugit possimus odio amet reprehenderit mollitia recusandae vero quis.",
    icon: <Handshake />,
    img: "/landing/screenshot.webp",
  },
  {
    title: "For Developers",
    description:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quod temporibus debitis fugit possimus odio amet reprehenderit mollitia recusandae vero quis.",
    icon: <Code />,
    img: "/landing/screenshot.webp",
  },
];

export default function TargetAudience() {
  const [current, setCurrent] = useState<TargetData>(targetData[0]);

  return (
    <div className="relative z-[1] flex min-h-screen w-screen flex-col items-center justify-center p-5 pt-32 sm:p-0">
      <div className="w-full max-w-screen-xl space-y-2 py-5 text-center sm:text-start">
        <div className="text-5xl font-medium">For Everyone</div>
        <div className="text-md font-normal text-foreground-500 sm:w-[30%]">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laborum,
          assumenda.
        </div>
      </div>
      <div className="flex min-h-[80vh] w-full max-w-screen-xl flex-col items-center overflow-hidden rounded-3xl bg-zinc-900 p-0 outline outline-zinc-900 sm:p-10">
        <div className="grid w-full justify-start gap-10 p-5 sm:grid-cols-4 sm:p-0">
          {targetData.map((item, index) => (
            <TargetCard
              key={index}
              current={current}
              description={item.description}
              icon={item.icon}
              img={item.img}
              setCurrent={setCurrent}
              title={item.title}
            />
          ))}
        </div>
        <img
          alt="GAIA Screenshot"
          className="relative mb-3 min-w-[95%] max-w-[95%] overflow-hidden rounded-2xl outline outline-[4px] outline-zinc-700 sm:top-[10vh] sm:mb-0"
          src={current.img}
        />
      </div>
    </div>
  );
}
