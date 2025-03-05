import { StickyNote01Icon } from "@/components/Misc/icons";
import LandingPage1Layout from "@/layouts/LandingPage1";

export default function Section_Notes() {
  return (
    <LandingPage1Layout
      className="col-span-2"
      heading="Your AI Assistant that remembers"
      icon={
        <StickyNote01Icon
          className="sm:size-[30px] size-[30px]"
          color="#9b9b9b"
        />
      }
      subheading="Take Notes & Memories for the assistant to remember important details"
    >
      hey there
    </LandingPage1Layout>
  );
}
