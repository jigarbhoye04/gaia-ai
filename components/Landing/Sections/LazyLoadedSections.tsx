import { lazy, Suspense } from "react";

import SuspenseLoader from "@/components/Misc/SuspenseLoader";

const Section_Calendar = lazy(() => import("./Section_Calendar"));
const Section_Memories = lazy(() => import("./Section_Memories"));

const Section_Grid = lazy(
  () => import("@/components/Landing/Sections/Section_Grid"),
);

// const FreePricing = lazy(
//   () => import("@/components/Landing/Sections/Free_Pricing")
// );

const WhatCanYouDo = lazy(
  () => import("@/components/Landing/Sections/Section_WhatCanYouDo"),
);

// const TargetAudience = lazy(
//   () => import("@/components/LandingPage/Sections/Section_TargetAudience")
// );

const ComingSoon = lazy(
  () => import("@/components/Landing/Sections/Section_ComingSoon"),
);

const Footer = lazy(() => import("@/components/Landing/Footer"));

const GoalSection = lazy(
  () => import("@/components/Landing/Sections/Section_Goal"),
);

const Internet = lazy(
  () => import("@/components/Landing/Sections/Section_Internet"),
);

const FinalSection = lazy(
  () => import("@/components/Landing/Sections/FinalSection"),
);

export default function LazyLoadedSections() {
  return (
    <div className="sm:space-y-[15rem] space-y-[5rem] sm:mt-[18rem] mt-[12rem]">
      <Suspense fallback={<SuspenseLoader />}>
        <GoalSection />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <Section_Calendar />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <Section_Memories />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <Internet />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <Section_Grid />
      </Suspense>
      {/* 
      <Suspense fallback={<SuspenseLoader />}>
        <AllFeatures />
      </Suspense> */}
      {/* 
      <Suspense fallback={<SuspenseLoader />}>
        <TargetAudience />
      </Suspense> */}

      {/* <FreePricing /> */}

      <Suspense fallback={<SuspenseLoader />}>
        <WhatCanYouDo />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <ComingSoon />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <FinalSection />
      </Suspense>

      <Suspense fallback={<SuspenseLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
}
