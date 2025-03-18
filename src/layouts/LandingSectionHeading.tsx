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
    <div className={`relative z-[1] p-7 sm:p-0 ${className}`}>
      <div
        className={`${
          smallHeading ? "sm:text-3xl" : "sm:text-4xl"
        } ${headingClassName} mb-2 flex items-center gap-4 text-3xl font-bold`}
      >
        {icon}
        <span>{heading}</span>
      </div>
      {!!subheading && (
        <div
          className={`max-w-screen-sm text-foreground-500 ${
            smallHeading ? "text-md" : "text-lg"
          }`}
        >
          {subheading}
        </div>
      )}
    </div>
  );
}
