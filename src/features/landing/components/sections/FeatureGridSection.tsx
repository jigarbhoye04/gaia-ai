import Section_ConvoManagement from "./ConversationManagementSection";
import Section_Document from "./DocumentsSection";
import FlowchartDemo from "./FlowchartSection";
import ImageGeneration from "./ImageGenerationSection";

// const Section_ConvoManagement = lazy(
//   () => import("@/components/landing/sections/ConversationManagementSection"),
// );

// const Section_Document = lazy(
//   () => import("@/components/landing/sections/DocumentsSection"),
// );

// const FlowchartDemo = lazy(
//   () => import("@/components/landing/sections/FlowchartSection"),
// );

// const ImageGeneration = lazy(
//   () => import("@/components/landing/sections/ImageGenerationSection"),
// );

export default function Section_Grid() {
  return (
    <div className="relative flex h-fit min-h-screen w-screen flex-col items-center justify-center gap-10 p-5 sm:pt-0">
      <div className="space-y-2">
        <div className="relative z-2 text-center text-5xl font-medium">
          Ditch all other chatbots!
        </div>
        <div className="relative z-1 mb-4 text-center text-lg text-foreground-600">
          GAIA has everything you need.
        </div>
      </div>

      {/* <div className="relative z-[-1] w-screen max-w-(--breakpoint-xl)">
        <div className="pointer-events-none absolute top-0 flex h-full w-full flex-col items-center justify-start">
          <div className="relative z-[-1] size-[500px] bg-[#00bbff] blur-[200px]" />
          <div className="relative top-[30vh] z-[-1] size-[500px] bg-[#00bbff] blur-[200px]" />
        </div>
      </div> */}

      <div className="relative z-0 grid w-screen max-w-(--breakpoint-xl) grid-cols-1 gap-4 p-3 sm:grid-cols-3 sm:p-0">
        <ImageGeneration />
        <FlowchartDemo />
        <Section_ConvoManagement />
        <Section_Document />
      </div>
    </div>
  );
}
