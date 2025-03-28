import { SectionHeading } from "@/layouts/LandingSectionHeading";

export default function DeepSearchSection() {
  return (
    <div className="flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col space-y-5">
        <SectionHeading
          heading="Deep Internet Search"
          subheading="Automatically search the web for you"
          // smallHeading="Search the web like never before"
        ></SectionHeading>
      </div>
    </div>
  );
}
