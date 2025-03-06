import { ReactNode } from "react";

export function SectionHeading({
  heading,
  subheading,
  icon,
  className,
  smallHeading = false,
  headingClassName,
}: {
  heading: string;
  subheading?: string | ReactNode;
  icon: any;
  smallHeading?: boolean;
  className?: string;
  headingClassName?: string;
}) {
  return (
    <div className={`sm:p-0 p-7 z-[1] relative ${className}`}>
      <div
        className={`${
          smallHeading ? "sm:text-3xl" : "sm:text-4xl"
        } ${headingClassName} text-3xl font-bold flex items-center gap-4 mb-2`}
      >
        {icon}
        <span>{heading}</span>
      </div>
      {!!subheading && (
        <div
          className={` text-foreground-500 max-w-screen-sm ${
            smallHeading ? "text-md" : "text-lg"
          }`}
        >
          {subheading}
        </div>
      )}
    </div>
  );
}
