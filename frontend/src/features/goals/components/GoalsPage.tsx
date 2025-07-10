"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Target04Icon } from "@/components/shared/icons";
import Spinner from "@/components/ui/shadcn/spinner";
import AddGoalDialog from "@/features/goals/components/AddGoalDialog";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { GoalData } from "@/types/features/goalTypes";

export default function GoalsPage() {
  const [prevGoalTitle, setPrevGoalTitle] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();

  const { goals, loading, fetchGoals, createGoal } = useGoals();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (goalTitle: string) => {
    try {
      const newGoal = await createGoal({ title: goalTitle });
      router.push(`/goals/${newGoal.id}`);
    } catch (err) {
      // Error is already handled in the hook
      console.error(err);
    }
  };

  return (
    <>
      <div className="flex h-full w-full flex-col justify-between p-5">
        <div className="w-full overflow-y-auto">
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 justify-center gap-4 px-1 pb-28 sm:grid-cols-1 sm:px-16 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal, index) => (
                <GoalCard
                  key={index}
                  fetchGoals={fetchGoals}
                  goal={
                    {
                      ...goal,
                      created_at: new Date(goal.created_at || Date.now()),
                      progress: 0,
                      roadmap: { nodes: [], edges: [] },
                    } as GoalData
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[70vh] w-full items-center justify-center">
              {loading ? <Spinner /> : <div>No Goals created yet.</div>}
            </div>
          )}
        </div>
        <div className="absolute bottom-6 left-0 z-10 flex w-full flex-col items-center justify-center gap-4">
          <div className="flex max-w-(--breakpoint-lg) flex-wrap justify-center gap-2">
            {[
              "Build a strong morning routine",
              "Read 12 books this year",
              "Develop better financial habits",
              "Journal daily for self-reflection",
              "Workout consistently for 3 months",
              "Improve work-life balance",
              "Master full-stack development",
            ].map((suggestion, index) => (
              <Chip
                key={index}
                variant="flat"
                color="primary"
                className="cursor-pointer text-primary"
                onClick={() => {
                  setPrevGoalTitle(suggestion);
                  setOpenDialog(true);
                }}
              >
                {suggestion}
              </Chip>
            ))}
          </div>
          <Button
            className="gap-2 font-semibold"
            color="primary"
            radius="full"
            onPress={() => setOpenDialog(true)}
          >
            <Target04Icon height={23} width={23} />
            Create a new Goal
          </Button>
        </div>
        <div className="bg-custom-gradient2 absolute bottom-0 left-0 z-1 h-[100px] w-full" />
      </div>
      <AddGoalDialog
        addGoal={handleAddGoal}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        prevGoalTitle={prevGoalTitle}
      />
    </>
  );
}
