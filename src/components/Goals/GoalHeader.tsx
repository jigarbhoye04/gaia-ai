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
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-row items-center justify-between w-full">
        <Link href={"/goals"}>
          <Button
            className="text-white w-fit gap-1 px-0 font-normal"
            variant="link"
          >
            <ArrowLeft width={17} />
            All Goals
          </Button>
        </Link>
        <div className="font-bold text-white text-2xl mt-1">
          {goalData?.roadmap?.title || goalData?.title}
        </div>
        <div></div>
      </div>
      <div className="text-foreground-500 text-md mt-1">
        {goalData?.roadmap?.description || goalData?.description}
      </div>
    </div>
  );
};

export default GoalHeader;
