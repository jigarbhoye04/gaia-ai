import { FileUploadIcon } from "@/components/Misc/icons";
// import { MagicCard } from "@/components/ui/magic-card";
import LandingPage1Layout from "@/layouts/LandingPage1";

export default function Section_Document() {
  return (
    // <MagicCard
    //   gradientFrom="#00bbff"
    //   gradientTo="#00bbff70"
    //   gradientColor="#00bbff40"
    // >
    <LandingPage1Layout
      heading={"Chat with Documents"}
      icon={
        <FileUploadIcon
          className="sm:size-[30px] size-[30px]"
          color="#9b9b9b"
        />
      }
      subheading={"..."}
    >
      update this
    </LandingPage1Layout>
    // </MagicCard>
  );
}
