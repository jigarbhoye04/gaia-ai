import { Chip } from "@heroui/chip";

export default function LargeHeader({
  chipText,
  headingText,
  subHeadingText,
  chipText2,
}: {
  chipText?: string;
  chipText2?: string;
  headingText: string;
  subHeadingText?: string;
}) {
  return (
    <div className="max-w-(--breakpoint-md) text-center">
      <div className="flex w-full items-center justify-center gap-1">
        {chipText && (
          <Chip variant="flat" color="primary">
            {chipText}
          </Chip>
        )}

        {chipText2 && (
          <Chip variant="flat" color="danger">
            {chipText2}
          </Chip>
        )}
      </div>
      <h2 className="relative z-2 mb-2 mt-4 flex items-center justify-center gap-4 text-4xl font-bold sm:text-5xl">
        {headingText}
      </h2>
      {!!subHeadingText && (
        <div className={`px-10 text-lg text-foreground-500`}>
          {subHeadingText}
        </div>
      )}
    </div>
  );
}
