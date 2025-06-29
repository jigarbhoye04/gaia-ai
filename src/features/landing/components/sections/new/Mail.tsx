import LargeHeader from "../../shared/LargeHeader";

export default function Mail() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader headingText="Mail" subHeadingText={"lorem ipsum"} />
      <div className="grid h-full w-full max-w-5xl grid-cols-2 grid-rows-2 gap-7"></div>
    </div>
  );
}
