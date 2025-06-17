import { FeatureCard } from "../../shared/FeatureCard";
import LargeHeader from "../../shared/LargeHeader";

export default function Productivity() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        headingText="Your Life. Organized by GAIA."
        subHeadingText={
          "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum "
        }
      />
      <div className="grid h-full w-full max-w-5xl grid-cols-2 grid-rows-2 gap-5">
        <FeatureCard
          imageSrc="/landing/mail.png"
          title="Calendar"
          description="lorem ipsum lorem ipsum"
        />

        <FeatureCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="Email"
        />

        <FeatureCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="To-do"
        />

        <FeatureCard
          imageSrc="/landing/mail.png"
          description="lorem ipsum lorem ipsum"
          title="Goal Tracking"
        />
      </div>
    </div>
  );
}
