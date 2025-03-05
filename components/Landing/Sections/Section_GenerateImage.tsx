import { Chip } from "@heroui/chip";
import { useEffect, useState } from "react";

import { SimpleChatBubbleUser } from "../../Chat/ChatBubbles/SimpleChatBubbles";
import { AiImageIcon } from "../../Misc/icons";

import LandingPage1Layout from "@/layouts/LandingPage1";

const imageOptions = [
  {
    title: "Golden Retriever",
    prompt: "cute, golden retriever",
    src: "/generated/golden_retriever.webp",
  },
  {
    title: "Mountains",
    prompt: "breathtaking, mountains, lake, realistic",
    src: "/generated/landscape.webp",
  },
  { title: "Car", prompt: "black porsche, sunset", src: "/generated/car.webp" },
  {
    title: "Abstract",
    prompt: "abstract, vibrant colors, geometric shapes",
    src: "/generated/abstract.webp",
  },
  // { title: "Husky", prompt: "cute, husky", src: "/generated/husky.webp" },
];

export function GeneratedImageChatBubble({
  selectedOption,
}: {
  selectedOption: {
    title: string;
    prompt: string;
    src: string;
  };
}) {
  return (
    <div className="p-1 !rounded-2xl !w-full">
      <div className="text-sm font-medium flex flex-col gap-1 min-w-full">
        <img
          alt={selectedOption?.prompt || "Generated image"}
          className="rounded-3xl my-2 w-full"
          height={400}
          src={selectedOption?.src}
          width={400}
        />
        <div className="flex gap-1 flex-wrap">
          {selectedOption.prompt.split(",").map((keyword, index) => (
            <Chip key={index} color="default" radius="md" size="sm">
              {keyword.trim()}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ImageGeneration() {
  const [selectedOption, setSelectedOption] = useState(imageOptions[0]);

  useEffect(() => {
    imageOptions.forEach((option, index) => {
      setTimeout(() => {
        const img = new Image();

        img.src = option.src;
      }, 1000 * (index + 1));
    });
  }, []);

  return (
    <LandingPage1Layout
      extraHeading={
        <div className="flex flex-wrap gap-2">
          {imageOptions.map((option, index) => (
            <Chip
              key={index}
              className="cursor-pointer"
              color="primary"
              variant={selectedOption?.src === option.src ? "solid" : "flat"}
              onClick={() => setSelectedOption(option)}
            >
              {option.title}
            </Chip>
          ))}
        </div>
      }
      heading="Generate Images"
      icon={
        <AiImageIcon className="sm:size-[30px] size-[30px]" color="#9b9b9b" />
      }
      subheading="Create stunning & realistic images for free"
    >
      <div className="w-full rounded-3xl">
        <SimpleChatBubbleUser hideMobile={true}>
          Generate Image: {selectedOption?.prompt}
        </SimpleChatBubbleUser>
        <GeneratedImageChatBubble selectedOption={selectedOption} />
      </div>
    </LandingPage1Layout>
  );
}
