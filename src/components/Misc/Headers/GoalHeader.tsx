import { Button } from "@heroui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { GoalData } from "@/types/goalTypes";

export default function GoalHeader({
  goalData,
}: {
  goalData: GoalData | null;
}) {
  if (!goalData) return <></>;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full flex-row items-start justify-between">
        <Link href={"/goals"}>
          <Button
            className="w-fit gap-1 font-normal text-white"
            variant={"light"}
          >
            <ChevronLeft width={17} />
            All Goals
          </Button>
        </Link>

        <div className="-ml-28 flex w-full flex-col items-center justify-center pb-3">
          <div className="mt-1 text-2xl font-bold text-white">
            {goalData?.roadmap?.title || goalData?.title}
          </div>
          <div className="text-md mt-1 text-foreground-500">
            {goalData?.roadmap?.description || goalData?.description}
          </div>
        </div>
      </div>
    </div>
  );
}
