"use client";

import { Chip } from "@heroui/chip";
import NextImage from "next/image";
import { useEffect, useState } from "react";

import { AiImageIcon } from "@/components/shared/icons";
import { SimpleChatBubbleUser } from "@/features/landing/components/demo/SimpleChatBubbles";
import ContentSection from "@/features/landing/layouts/ContentSection";

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
    <div className="w-full! rounded-2xl! p-1">
      <div className="flex min-w-full flex-col gap-1 text-sm font-medium">
        <NextImage
          alt={selectedOption?.prompt || "Generated image"}
          className="my-2 w-full rounded-3xl"
          height={400}
          src={selectedOption?.src}
          width={400}
        />
        <div className="flex flex-wrap gap-1">
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
      setTimeout(
        () => {
          const img = new Image(400, 400);
          img.src = option.src;
        },
        1000 * (index + 1),
      );
    });
  }, []);

  return (
    <ContentSection
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
      subheading="Create stunning & realistic images for free"
      className="h-full"
      logoInline
      icon={
        <AiImageIcon className="size-[30px] sm:size-[30px]" color="#9b9b9b" />
      }
    >
      <div className="w-full rounded-3xl">
        <SimpleChatBubbleUser hideMobile={true}>
          Generate Image: {selectedOption?.prompt}
        </SimpleChatBubbleUser>
        <GeneratedImageChatBubble selectedOption={selectedOption} />
      </div>
    </ContentSection>
  );
}
