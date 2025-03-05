import { Suspense, lazy } from "react";

import SuspenseLoader from "@/components/Misc/SuspenseLoader";
// import { AnimatedSection } from "../misc/AnimatedSection";

const Section_ConvoManagement = lazy(
  () => import("@/components/Landing/Sections/Sections_ConvoManagement"),
);

const Section_Document = lazy(
  () => import("@/components/Landing/Sections/Section_Documents"),
);

// const Section_Notes = lazy(
//   () => import("@/components/LandingPage/Sections/Section_Notes")
// );

const FlowchartDemo = lazy(
  () => import("@/components/Landing/Sections/Section_Flowchart"),
);

const ImageGeneration = lazy(
  () => import("@/components/Landing/Sections/Section_GenerateImage"),
);

export default function Section_Grid() {
  return (
    <div className="w-screen flex justify-center min-h-screen items-center h-fit sm:pt-0 flex-col p-5 gap-10">
      <div className="space-y-2">
        <div className="font-medium text-5xl relative z-[1] text-center">
          Ditch all other chatbots!
        </div>
        <div className="text-foreground-600 mb-4 relative z-[1] text-center text-lg">
          GAIA has everything you need.
        </div>
      </div>

      <div className="w-screen max-w-screen-xl relative z-[0]">
        <div className="h-full w-full absolute top-0 flex justify-start flex-col items-center pointer-events-none">
          <div className="size-[500px] blur-[200px] bg-[#00bbff] z-[-1] relative" />
          <div className="size-[500px] blur-[200px] bg-[#00bbff] z-[-1] relative top-[30vh]" />
        </div>

        <div className="grid w-screen max-w-screen-xl gap-4 sm:grid-cols-3 grid-cols-1 relative z-[0] sm:p-0 p-3">
          {/* <Suspense fallback={<SuspenseLoader />}> */}
          {/* <Section_Notes /> */}
          {/* </Suspense> */}

          <Suspense fallback={<SuspenseLoader />}>
            <ImageGeneration />
          </Suspense>

          <Suspense fallback={<SuspenseLoader />}>
            <FlowchartDemo />
          </Suspense>

          <div className="sm:col-span-2 col-span-1">
            <Suspense fallback={<SuspenseLoader />}>
              <Section_Document />
            </Suspense>
          </div>

          <Suspense fallback={<SuspenseLoader />}>
            <Section_ConvoManagement />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
