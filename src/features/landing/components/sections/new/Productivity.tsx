import Image from "next/image";

import LargeHeader from "../../shared/LargeHeader";

interface ProductivityCardProps {
  imageSrc: string;
  title: string;
  description: string;
  imageAlt?: string;
}

export function ProductivityCard({
  imageSrc,
  title,
  description,
}: ProductivityCardProps) {
  return (
    <div className="flex aspect-square h-full w-full flex-col rounded-3xl bg-zinc-900 p-6">
      <div className="relative mb-4 w-full flex-1 overflow-hidden rounded-2xl">
        <Image fill src={imageSrc} className="object-cover" alt={title} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-3xl font-medium text-white">{title}</div>
        <div className="text-medium text-foreground-400">{description}</div>
      </div>
    </div>
  );
}

export default function Productivity() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        headingText="Your Life. Organized by GAIA"
        subHeadingText={
          "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum "
        }
      />
      <div className="grid h-full w-full max-w-5xl grid-cols-2 grid-rows-2 gap-7">
        <ProductivityCard
          imageSrc="/landing/mail.png"
          title="Calendar"
          description="lorem ipsum lorem ipsum"
        />

        <ProductivityCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="Email"
        />

        <ProductivityCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="To-do"
        />

        <ProductivityCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="Goal Tracking"
        />
      </div>
    </div>
  );
}
