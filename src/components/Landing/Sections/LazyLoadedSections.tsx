import { lazy, Suspense } from "react";

import SuspenseLoader from "@/components/Misc/SuspenseLoader";

const sections = {
  GoalSection: lazy(() => import("@/components/Landing/Sections/GoalSection")),
  CalendarSection: lazy(
    () => import("@/components/Landing/Sections/CalendarSection"),
  ),
  MemoriesSection: lazy(
    () => import("@/components/Landing/Sections/MemoriesSection"),
  ),
  InternetSection: lazy(
    () => import("@/components/Landing/Sections/InternetSection"),
  ),
  DeepSearchSection: lazy(
    () => import("@/components/Landing/Sections/DeepSearchSection"),
  ),
  GridSection: lazy(
    () => import("@/components/Landing/Sections/FeatureGridSection"),
  ),
  // CapabilitiesSection: lazy(
  //   () => import("@/components/Landing/Sections/CapabilitiesSection")
  // ),
  // ComingSoonSection: lazy(
  //   () => import("@/components/Landing/Sections/ComingSoonSection")
  // ),
  FinalSection: lazy(
    () => import("@/components/Landing/Sections/FinalSection"),
  ),
};

export default function LazyLoadedSections() {
  return (
    <div className="mt-[12rem] space-y-[5rem] sm:mt-[18rem] sm:space-y-[15rem]">
      {Object.entries(sections).map(([name, Component]) => (
        <Suspense key={name} fallback={<SuspenseLoader />}>
          <Component />
        </Suspense>
      ))}
    </div>
  );
}
