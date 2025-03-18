"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AddGoalDialog from "@/components/Goals/AddGoalDialog";
import { GoalCard } from "@/components/Goals/GoalCard";
import { Target04Icon } from "@/components/Misc/icons";
import { apiauth } from "@/utils/apiaxios";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevGoalTitle, setPrevGoalTitle] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter(); // Use Next.js router

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await apiauth.get("/goals");

      console.log("goals", response.data);
      setGoals(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalTitle: string) => {
    try {
      const response = await apiauth.post("/goals", { title: goalTitle });

      router.push(`/goals/${response.data.id}`); // Use router.push instead of navigate()
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = (goalTitle: string) => {
    createGoal(goalTitle);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col justify-between">
        <div className="w-full overflow-y-auto">
          <div className="flex w-full flex-col items-center gap-2">
            <div className="text-center text-3xl font-bold sm:text-5xl">
              Roadmaps
            </div>
            <div className="text-md max-w-screen-md pb-6 text-center">
              A tool that instantly generates personalized goal roadmaps from a
              single prompt, helping you plan and track your objectives
              efficiently.
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 justify-center gap-4 px-1 pb-28 sm:grid-cols-2 sm:px-16 md:grid-cols-3 lg:grid-cols-4">
              {goals.map((goal, index) => (
                <GoalCard key={index} fetchGoals={fetchGoals} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="flex h-[70vh] w-full items-center justify-center">
              {loading ? <Spinner /> : <div>No Goals created yet.</div>}
            </div>
          )}
        </div>
        <div className="absolute bottom-6 left-0 z-10 flex w-full flex-col items-center justify-center gap-4">
          <div className="flex max-w-screen-lg flex-wrap justify-center gap-2">
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
                className="cursor-pointer"
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
            size="lg"
            variant="shadow"
            onPress={() => setOpenDialog(true)}
          >
            <Target04Icon height={23} width={23} />
            Create a new Goal
          </Button>
        </div>
        <div className="bg-custom-gradient2 absolute bottom-0 left-0 z-[1] h-[100px] w-full" />
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
