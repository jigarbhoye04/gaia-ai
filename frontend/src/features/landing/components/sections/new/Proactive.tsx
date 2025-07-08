import LargeHeader from "../../shared/LargeHeader";

export default function Proactive() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        headingText="An Assistant That Acts Before You Ask"
        subHeadingText={
          "Proactive by design—GAIA handles emails, schedules, reminders and more so you don’t have to."
        }
      />
      <div className="grid h-full w-full max-w-5xl grid-cols-2 grid-rows-2 gap-7"></div>
    </div>
  );
}
