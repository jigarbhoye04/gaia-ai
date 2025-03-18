import { StickyNote01Icon } from "@/components/Misc/icons";
import LandingSectionLayout from "@/layouts/LandingSectionLayout";

export default function Section_Notes() {
  return (
    <LandingSectionLayout
      className="col-span-2"
      heading="Your AI Assistant that remembers"
      icon={
        <StickyNote01Icon
          className="size-[30px] sm:size-[30px]"
          color="#9b9b9b"
        />
      }
      subheading="Take Notes & Memories for the assistant to remember important details"
    >
      hey there
    </LandingSectionLayout>
  );
}
