import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GoalData } from "@/types/goalTypes";

interface GoalHeaderProps {
  goalData: GoalData | null;
}

const GoalHeader: React.FC<GoalHeaderProps> = ({ goalData }) => {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full flex-row items-center justify-between">
        <Link href={"/goals"}>
          <Button
            className="w-fit gap-1 px-0 font-normal text-white"
            variant="link"
          >
            <ArrowLeft width={17} />
            All Goals
          </Button>
        </Link>
        <div className="mt-1 text-2xl font-bold text-white">
          {goalData?.roadmap?.title || goalData?.title}
        </div>
        <div></div>
      </div>
      <div className="text-md mt-1 text-foreground-500">
        {goalData?.roadmap?.description || goalData?.description}
      </div>
    </div>
  );
};

export default GoalHeader;
