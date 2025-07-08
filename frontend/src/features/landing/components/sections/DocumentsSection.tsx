import Image from "next/image";

import { FileUploadIcon } from "@/components/shared/icons";
import ContentSection from "@/features/landing/layouts/ContentSection";

export default function Section_Document() {
  return (
    <div className="col-span-1 sm:col-span-2">
      <ContentSection
        logoInline
        heading={"chat with documents"}
        icon={
          <FileUploadIcon
            className="size-[30px] sm:size-[30px]"
            color="#9b9b9b"
          />
        }
        subheading={
          "Ask questions, get summaries, extract key insights, and more from uploaded documents and images"
        }
      >
        <div className="relative flex h-[45vh] w-full sm:h-[80vh]">
          <Image
            alt={"File Upload Showcase"}
            className="my-2 w-full rounded-3xl object-cover"
            fill
            src={"/landing/file_upload2.webp"}
          />
        </div>
      </ContentSection>
    </div>
  );
}
