import { FileUploadIcon } from "@/components/Misc/icons";
// import { MagicCard } from "@/components/ui/magic-card";
import LandingSectionLayout from "@/layouts/LandingSectionLayout";

export default function Section_Document() {
  return (
    // <MagicCard
    //   gradientFrom="#00bbff"
    //   gradientTo="#00bbff70"
    //   gradientColor="#00bbff40"
    // >
    <LandingSectionLayout
      heading={"Chat with Documents"}
      icon={
        <FileUploadIcon
          className="size-[30px] sm:size-[30px]"
          color="#9b9b9b"
        />
      }
      subheading={"..."}
    >
      update this
    </LandingSectionLayout>
    // </MagicCard>
  );
}
